import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Code2, 
  Layers, 
  Flame, 
  Palette, 
  CheckCircle2, 
  Cpu,
  Monitor,
  ShieldCheck,
  Zap,
  X
} from 'lucide-react';
import Quizito from "../imagem/quizito.jpeg"

interface TeamMember {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
  responsibilities: string[];
  github?: string;
  linkedin?: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'Quizito',
    name: 'Quizito Cristiano',
    role: 'Desenvolvedor Full Stack & Arquiteto',
    photoUrl: Quizito, // URL da foto (ex: '/kizito.png')
    responsibilities: [
      'Arquitetura geral do WatchFlow',
      'Desenvolvimento Frontend (React + TypeScript)',
      'Modelagem e Estruturação do Firestore',
      'Autenticação e Regras de Segurança (Firebase Auth)',
      'Construção dos Painéis de Métricas e Dashboard',
      'Integrações com APIs e Agentes de Coleta'
    ],
    github: 'https://github.com/QuizitoCristiano',
    linkedin: 'https://www.linkedin.com/in/quizito-cristiano-0b450a361/'
  },
  {
    id: 'membro2',
    name: 'Nome do Integrante',
    role: 'UI/UX Designer & Frontend',
    photoUrl: '',
    responsibilities: [
      'Prototipação das Telas no Figma',
      'Criação do Design System e Componentes',
      'Responsividade e Usabilidade da Interface',
      'Acessibilidade e Experiência do Usuário'
    ],
    github: 'https://github.com/QuizitoCristiano',
    linkedin: 'https://www.linkedin.com/in/quizito-cristiano-0b450a361/'
  },
  {
    id: 'membro3',
    name: 'Nome do Integrante',
    role: 'Documentação & Engenharia de Requisitos',
    photoUrl: '',
    responsibilities: [
      'Levantamento das Regras de Negócio (RNs)',
      'Especificação de Casos de Uso e Diagramas',
      'Documentação das Coleções do Firebase',
      'Redação do Relatório Acadêmico'
    ],
    github: 'https://github.com/QuizitoCristiano',
    linkedin: 'https://www.linkedin.com/in/quizito-cristiano-0b450a361/'
    
  },
  {
    id: 'membro4',
    name: 'Nome do Integrante',
    role: 'Garantia de Qualidade (QA) & Testes',
    photoUrl: '',
    responsibilities: [
      'Validação dos Fluxos de Navegação',
      'Testes de Inserção e Leitura no Firestore',
      'Verificação das Regras de Autenticação',
      'Preparação do Roteiro de Apresentação'
    ],
    github: 'https://github.com/QuizitoCristiano',
    linkedin: 'https://www.linkedin.com/in/quizito-cristiano-0b450a361/'
  }
];

const STACK_TECHNOLOGIES = [
  { name: 'React', desc: 'Interface Dinâmica e Componentizada', icon: Code2, color: 'text-sky-400' },
  { name: 'TypeScript', desc: 'Tipagem Estática e Segurança de Código', icon: ShieldCheck, color: 'text-blue-400' },
  { name: 'Firebase Firestore', desc: 'Banco NoSQL em Tempo Real', icon: Flame, color: 'text-amber-500' },
  { name: 'Firebase Auth', desc: 'Gestão Segura de Usuários', icon: Zap, color: 'text-amber-400' },
  { name: 'Tailwind CSS', desc: 'Estilização Moderna e Responsiva', icon: Palette, color: 'text-teal-400' },
  { name: 'Lucide Icons', desc: 'Padronização Visual da Interface', icon: Layers, color: 'text-indigo-400' }
];

export const EquipePage: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Fechar o modal com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedMember(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="p-6 text-white max-w-7xl mx-auto space-y-10 relative">
      
      {/* BANNER & CABEÇALHO */}
      <div className="relative overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-900 to-orange-950/40 border border-zinc-800 rounded-2xl p-8 md:p-10">
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Users className="w-3.5 h-3.5" /> Projeto Acadêmico WatchFlow
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Nossa Equipe & Arquitetura
          </h1>
          <p className="text-gray-300 text-base md:text-lg leading-relaxed">
            "Desenvolvendo soluções para monitoramento, observabilidade e gestão inteligente de ambientes de TI."
          </p>
        </div>
      </div>

      {/* SOBRE O PROJETO */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8 space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
          <Monitor className="text-orange-500 w-5 h-5" /> Sobre o Projeto
        </h2>
        <p className="text-gray-300 leading-relaxed text-sm md:text-base">
          O <strong>WatchFlow</strong> foi desenvolvido como projeto acadêmico com o objetivo de centralizar o monitoramento de infraestrutura de TI utilizando o ecossistema Serverless do <strong>Firebase</strong>. A plataforma reúne dados operacionais em um único painel em tempo real, permitindo acompanhar a saúde de servidores e dispositivos, gerenciar alertas críticos e analisar histórico de métricas com rapidez e precisão.
        </p>
      </div>

      {/* INTEGRANTES DA EQUIPE */}
      <div className="space-y-6">
        <div className="border-b border-zinc-800 pb-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="text-orange-500 w-5 h-5" /> Divisão de Responsabilidades
          </h2>
          <p className="text-xs text-gray-400">Clique na foto do integrante para visualizar em tamanho ampliado</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TEAM_MEMBERS.map((member) => (
            <div 
              key={member.id} 
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition rounded-xl p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-4">
                {/* Header do Card */}
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedMember(member)}
                    className="relative group focus:outline-none rounded-full"
                    title="Clique para ampliar a foto"
                  >
                    {member.photoUrl ? (
                      <img 
                        src={member.photoUrl} 
                        alt={member.name} 
                        className="w-14 h-14 rounded-full object-cover border-2 border-orange-500 group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-zinc-800 border-2 border-orange-500/80 group-hover:border-orange-500 group-hover:scale-105 transition-all duration-200 flex items-center justify-center text-lg font-bold text-orange-500 shadow-md">
                        {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                    )}
                  </button>

                  <div>
                    <h3 className="text-lg font-bold text-white">{member.name}</h3>
                    <span className="text-xs font-medium text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      {member.role}
                    </span>
                  </div>
                </div>

                {/* Lista de Responsabilidades */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Principais Atividades:
                  </span>
                  <ul className="space-y-1.5 text-xs text-gray-300">
                    {member.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Redes Sociais com SVGs Inline */}
              {(member.github || member.linkedin) && (
                <div className="pt-4 border-t border-zinc-800/80 flex items-center gap-3">
                  {member.github && (
                    <a 
                      href={member.github} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-gray-400 hover:text-white transition p-1 hover:bg-zinc-800 rounded"
                      title="Perfil no GitHub"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                    </a>
                  )}
                  {member.linkedin && (
                    <a 
                      href={member.linkedin} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-gray-400 hover:text-blue-400 transition p-1 hover:bg-zinc-800 rounded"
                      title="Perfil no LinkedIn"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* STACK TECNOLÓGICO */}
      <div className="space-y-6">
        <div className="border-b border-zinc-800 pb-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Cpu className="text-orange-500 w-5 h-5" /> Stack Tecnológico
          </h2>
          <p className="text-xs text-gray-400">Tecnologias de ponta utilizadas na construção da aplicação</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STACK_TECHNOLOGIES.map((tech, idx) => {
            const Icon = tech.icon;
            return (
              <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
                <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800">
                  <Icon className={`w-5 h-5 ${tech.color}`} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{tech.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{tech.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ARQUITETURA DO SISTEMA */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8 space-y-6">
        <div className="border-b border-zinc-800 pb-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="text-orange-500 w-5 h-5" /> Fluxo de Arquitetura
          </h2>
          <p className="text-xs text-gray-400">Como os dados transitam entre os agentes e a interface</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2">
            <span className="text-xs text-orange-400 font-semibold uppercase">1. Origem dos Dados</span>
            <h4 className="text-sm font-bold text-white">Agente / Telegraf / Coletor</h4>
            <p className="text-[11px] text-gray-500">Coleta CPU, RAM, Disco e Tráfego dos Servidores</p>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2">
            <span className="text-xs text-amber-400 font-semibold uppercase">2. Armazenamento</span>
            <h4 className="text-sm font-bold text-white">Cloud Firestore</h4>
            <p className="text-[11px] text-gray-500">Documentos em tempo real (`devices` e `metrics`)</p>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2">
            <span className="text-xs text-blue-400 font-semibold uppercase">3. Autenticação</span>
            <h4 className="text-sm font-bold text-white">Firebase Auth</h4>
            <p className="text-[11px] text-gray-500">Validação e isolamento por conta de usuário (UID)</p>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2">
            <span className="text-xs text-emerald-400 font-semibold uppercase">4. Apresentação</span>
            <h4 className="text-sm font-bold text-white">Dashboard WatchFlow</h4>
            <p className="text-[11px] text-gray-500">Interface em React atualizada em tempo real</p>
          </div>
        </div>
      </div>

      {/* MODAL DE FOTO EXPANDIDA */}
      {selectedMember && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedMember(null)}
        >
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden max-w-sm w-full p-6 shadow-2xl relative flex flex-col items-center text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedMember(null)}
              className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-full transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-64 h-80 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner mt-2">
              {selectedMember.photoUrl ? (
                <img 
                  src={selectedMember.photoUrl} 
                  alt={selectedMember.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-950 text-orange-500 font-bold text-5xl">
                  {selectedMember.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  <span className="text-xs text-gray-500 font-normal mt-4">Sem foto cadastrada</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">{selectedMember.name}</h3>
              <p className="text-xs text-orange-400 font-medium">{selectedMember.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* RODAPÉ DA EQUIPE */}
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-8 text-center space-y-4">
        <h3 className="text-lg font-bold text-white">WatchFlow - Projeto de Observabilidade</h3>

        <div className="max-w-2xl mx-auto h-48 bg-zinc-950 border border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center p-4">
          <Users className="w-10 h-10 text-zinc-600 mb-2" />
          <span className="text-xs text-gray-400 font-medium">
            [ Espaço reservado para a Foto Oficial do Grupo ]
          </span>
          <span className="text-[11px] text-gray-600 mt-1">
            Substitua este quadro por uma tag &lt;img&gt; com a foto dos integrantes.
          </span>
        </div>

        <p className="text-xs text-gray-400 italic">
          "Juntos transformamos dados brutos de métricas em inteligência operacional."
        </p>
      </div>

    </div>
  );
};

export { EquipePage as Equipe };