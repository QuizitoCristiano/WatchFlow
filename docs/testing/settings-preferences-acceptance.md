# WatchFlow — roteiro de QA das preferências

Este roteiro valida a implementação da PR de preferências antes de promover as alterações para `main`.

## 1. Preparação

- [ ] Usar uma conta Firebase de teste, sem dados de produção.
- [ ] Registrar o estado inicial das preferências.
- [ ] Abrir o DevTools e acompanhar Console e Network.
- [ ] Confirmar que a aplicação está usando a branch/commit que será validado.

## 2. Aparência e idioma

- [ ] Alternar entre tema claro, escuro e sistema.
- [ ] Confirmar que a mudança é aplicada imediatamente nas telas principais.
- [ ] Alternar entre Português (Brasil) e Inglês (EUA).
- [ ] Navegar por Dashboard, Alertas, Métricas, Integrações, Dispositivos, Relatórios e Configurações e identificar textos que permaneçam no idioma anterior.
- [ ] Atualizar a página e confirmar a persistência das escolhas.
- [ ] Sair e entrar novamente com a mesma conta e confirmar a persistência.

## 3. Dashboard e monitoramento

- [ ] Ocultar e reexibir cada widget disponível.
- [ ] Alterar o intervalo de atualização e observar a frequência das consultas.
- [ ] Alterar a janela do histórico e confirmar o período exibido.
- [ ] Confirmar que ocultar um widget não interrompe a coleta de métricas.
- [ ] Confirmar que preferências de notificação não desativam coleta, persistência ou geração de alertas.

## 4. Notificações

- [ ] Desativar notificações globalmente e confirmar que alertas continuam sendo registrados.
- [ ] Testar separadamente severidades crítica, aviso e informativa.
- [ ] Testar categorias de eventos suportadas pela implementação atual.
- [ ] Testar o canal dentro do app.
- [ ] Confirmar que a opção de e-mail representa apenas preferência/elegibilidade: envio real não faz parte desta implementação.
- [ ] Confirmar que nenhum e-mail ou push é enviado sem integração de provedor e consentimento explícito.

## 5. Sessão e isolamento entre contas

- [ ] Confirmar que o botão de logout encerra a sessão Firebase.
- [ ] Entrar com a conta A, alterar preferências e sair.
- [ ] Entrar com a conta B e confirmar que não aparecem preferências nem dados da conta A.
- [ ] Alterar preferências da conta B, sair e voltar à conta A; confirmar que cada conta mantém seu próprio estado.
- [ ] Observar a troca de usuário sem recarregar a página e verificar se não há dados transitórios da conta anterior.

## 6. Validação automatizada

Executar na raiz do projeto:

```bash
npm ci
npm run lint
npm test
npm run build
npm audit
```

Guardar o relatório completo de `npm audit --json`. Não usar `npm audit fix --force` como primeira tentativa: atualizações fora das faixas SemVer declaradas podem introduzir breaking changes.

## Critério de aceite

A implementação só deve ser promovida após lint, testes e build passarem no commit final, os testes manuais críticos serem concluídos e as vulnerabilidades do relatório serem corrigidas ou formalmente documentadas com justificativa e mitigação. A geração do relatório de auditoria no CI não significa que as vulnerabilidades foram corrigidas.
