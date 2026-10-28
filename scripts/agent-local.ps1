<#
.SYNOPSIS
    WatchFlow - Agente Coletor Local de Infraestrutura (Windows)
.DESCRIPTION
    Coleta métricas reais de hardware (CPU, RAM, Disco) desta máquina local
    e atualiza a telemetria do WatchFlow via Firebase Firestore REST API.
#>

param (
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = $env:VITE_FIREBASE_PROJECT_ID,

    [Parameter(Mandatory=$false)]
    [string]$UserId = "",

    [Parameter(Mandatory=$false)]
    [string]$DeviceId = "dev-local-pc",

    [Parameter(Mandatory=$false)]
    [int]$IntervalSeconds = 5
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "      WATCHFLOW - AGENTE DE TELEMETRIA LOCAL (SO/HARDWARE) " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Host: $env:COMPUTERNAME | SO: Windows 64-bit" -ForegroundColor Gray

if ([string]::IsNullOrWhiteSpace($UserId)) {
    Write-Host "`n[AVISO] Para sincronizar com o seu usuário logado no WatchFlow:" -ForegroundColor Yellow
    Write-Host "Execute o script informando seu UID do Firebase:" -ForegroundColor White
    Write-Host ".\scripts\agent-local.ps1 -UserId 'SEU_UID_AQUI' -ProjectId 'SEU_PROJECT_ID'`n" -ForegroundColor Green
}

function Get-HardwareMetrics {
    # 1. CPU (%)
    $cpu = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
    if ($null -eq $cpu) { $cpu = 0 }

    # 2. RAM (GB e %)
    $os = Get-CimInstance Win32_OperatingSystem
    $totalRamMb = [math]::Round($os.TotalVisibleMemorySize / 1024, 0)
    $freeRamMb  = [math]::Round($os.FreePhysicalMemory / 1024, 0)
    $usedRamMb  = $totalRamMb - $freeRamMb
    $ramPercent = [math]::Round(($usedRamMb / $totalRamMb) * 100, 1)

    $totalRamGb = [math]::Round($totalRamMb / 1024, 1)
    $usedRamGb  = [math]::Round($usedRamMb / 1024, 1)

    # 3. Disco C: (GB e %)
    $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
    $totalDiskGb = [math]::Round($disk.Size / 1GB, 1)
    $freeDiskGb  = [math]::Round($disk.FreeSpace / 1GB, 1)
    $usedDiskGb  = [math]::Round($totalDiskGb - $freeDiskGb, 1)
    $diskPercent = [math]::Round(($usedDiskGb / $totalDiskGb) * 100, 1)

    return @{
        CpuPercent  = [math]::Round($cpu, 0)
        RamPercent  = $ramPercent
        RamUsedGb   = $usedRamGb
        RamTotalGb  = $totalRamGb
        DiskPercent = $diskPercent
        DiskUsedGb  = $usedDiskGb
        DiskTotalGb = $totalDiskGb
        Timestamp   = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
}

Write-Host "Monitorando hardware em tempo real (Pressione Ctrl+C para parar)...`n" -ForegroundColor Green

while ($true) {
    $m = Get-HardwareMetrics
    $now = Get-Date -Format "HH:mm:ss"

    Write-Host "[$now] CPU: $($m.CpuPercent)% | RAM: $($m.RamPercent)% ($($m.RamUsedGb)GB / $($m.RamTotalGb)GB) | DISCO: $($m.DiskPercent)% ($($m.DiskUsedGb)GB / $($m.DiskTotalGb)GB)" -ForegroundColor White

    # Se o ProjectId e UserId forem informados, despacha para o Firestore
    if (-not [string]::IsNullOrWhiteSpace($ProjectId) -and -not [string]::IsNullOrWhiteSpace($UserId)) {
        try {
            $url = "https://firestore.googleapis.com/v1/projects/$ProjectId/databases/(default)/documents/users/$UserId/devices/$DeviceId"
            
            $body = @{
                fields = @{
                    hostname = @{ stringValue = $env:COMPUTERNAME }
                    ip = @{ stringValue = "127.0.0.1" }
                    status = @{ stringValue = if ($m.CpuPercent -gt 85) { "critical" } elseif ($m.CpuPercent -gt 70) { "warning" } else { "online" } }
                    lastSeen = @{ timestampValue = $m.Timestamp }
                    latestMetricsSummary = @{
                        mapValue = @{
                            fields = @{
                                cpu = @{ integerValue = $m.CpuPercent }
                                memory = @{ integerValue = [int]$m.RamPercent }
                                memoryUsedGb = @{ doubleValue = $m.RamUsedGb }
                                memoryTotalGb = @{ doubleValue = $m.RamTotalGb }
                                disk = @{ integerValue = [int]$m.DiskPercent }
                                diskUsedGb = @{ doubleValue = $m.DiskUsedGb }
                                diskTotalGb = @{ doubleValue = $m.DiskTotalGb }
                            }
                        }
                    }
                }
            } | ConvertTo-Json -Depth 6

            $response = Invoke-RestMethod -Uri "$url?updateMask.fieldPaths=hostname&updateMask.fieldPaths=ip&updateMask.fieldPaths=status&updateMask.fieldPaths=lastSeen&updateMask.fieldPaths=latestMetricsSummary" -Method Patch -Body $body -ContentType "application/json"
            Write-Host "   -> Sincronizado com Firestore com sucesso." -ForegroundColor DarkGreen
        }
        catch {
            Write-Host "   -> Erro ao enviar para o Firestore: $_" -ForegroundColor Red
        }
    }

    Start-Sleep -Seconds $IntervalSeconds
}
