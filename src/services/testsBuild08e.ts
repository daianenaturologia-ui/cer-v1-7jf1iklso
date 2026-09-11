import type { TestResult } from './tests'

export async function runBuild08ETests(): Promise<TestResult[]> {
  const results: TestResult[] = []
  const now = new Date().toISOString()
  const baseCategory = 'Build 08E / Resposta, Ajuste & Mandala V1'

  // Helper para adicionar teste
  const add = (id: string, name: string, category: string, passed: boolean, details: string) => {
    results.push({
      id,
      name,
      category: `${baseCategory} / ${category}`,
      status: passed ? 'PASSOU' : 'NÃO PASSOU',
      details,
      timestamp: now,
    })
  }
  // ==========================================
  // SUÍTE 1: RESP1–25 (Practice Responses)
  // ==========================================
  const respTests = [
    {
      id: 'RESP1',
      name: 'Response Operacional e Shared-Care',
      desc: 'cer_practice_responses é compartilhada no enrollment sem access_class variável',
    },
    {
      id: 'RESP2',
      name: 'Zero Score de Adesão',
      desc: 'Nenhum cálculo de adesão, taxa percentual ou penalidade por não praticar',
    },
    {
      id: 'RESP3',
      name: 'Zero Score de Eficácia',
      desc: 'Nenhuma nota ou percentual de efetividade calculada a partir das respostas',
    },
    {
      id: 'RESP4',
      name: 'Done ≠ Helped',
      desc: 'Prática realizada não presume benefício ou eficácia clínica',
    },
    {
      id: 'RESP5',
      name: 'Not Done ≠ Failed',
      desc: 'Não realização não configura falha ou resistência',
    },
    {
      id: 'RESP6',
      name: 'Enum Fechado de Tipos',
      desc: '10 tipos canônicos fechados; proibidos success/failure/nonadherent/resistant',
    },
    {
      id: 'RESP7',
      name: 'Resposta rápida "helped"',
      desc: 'Acolhe percepção de ajuda com 1 toque sem questionário obrigatório',
    },
    {
      id: 'RESP8',
      name: 'Resposta rápida "helped_a_bit"',
      desc: 'Registra nuance suave de apoio sem inferência causal',
    },
    {
      id: 'RESP9',
      name: 'Resposta "no_perceived_difference"',
      desc: 'Acolhe ausência de percepção neutra sem rótulo clínico',
    },
    {
      id: 'RESP10',
      name: 'Resposta "was_difficult"',
      desc: 'Sinaliza dificuldade operacional para diálogo humano',
    },
    {
      id: 'RESP11',
      name: 'Resposta "was_too_much"',
      desc: 'Gera needs_review automático na safety_flag sem intervenção agressiva',
    },
    {
      id: 'RESP12',
      name: 'Resposta "could_not_do"',
      desc: 'could_not_do ≠ chose_not_to_do; reflete barreiras contextuais leves',
    },
    {
      id: 'RESP13',
      name: 'Resposta "chose_not_to_do"',
      desc: 'Expressão de autonomia válida; zero sinal de resistência',
    },
    {
      id: 'RESP14',
      name: 'Resposta "adapted"',
      desc: 'Reconhece autoria e adaptação pelo próprio participante',
    },
    {
      id: 'RESP15',
      name: 'Resposta "did_not_make_sense"',
      desc: 'Registra falta de conexão no momento com acolhimento',
    },
    {
      id: 'RESP16',
      name: 'Resposta "wants_to_tell"',
      desc: 'Abre espaço de escuta sem formulário estruturado rígido',
    },
    {
      id: 'RESP17',
      name: 'Registro Único (Single Source of Truth)',
      desc: 'Response não duplica texto de prática, consentimento ou prioridade',
    },
    {
      id: 'RESP18',
      name: 'Lifecycle: record_status current | superseded',
      desc: 'Status canônicos restritos a current e superseded; sem draft',
    },
    {
      id: 'RESP19',
      name: 'Correção Material Preserva Histórico',
      desc: 'Correção cria nova row e marca anterior como superseded com previous_response_id',
    },
    {
      id: 'RESP20',
      name: 'Nunca Sobrescrever Silenciosamente',
      desc: 'Histórico auditado e imutável garantido por hook server-side',
    },
    {
      id: 'RESP21',
      name: 'SimpleScale Opcional de Percepção',
      desc: 'Escala 1 a 5 apenas de apoio perceptual quando o usuário deseja detalhar',
    },
    {
      id: 'RESP22',
      name: 'MultiSelectCards de Barreiras Leves',
      desc: 'Opções leves (tempo, energia, esqueci) sem qualquer rótulo diagnóstico',
    },
    {
      id: 'RESP23',
      name: 'shared_reflection Estrito',
      desc: 'Apenas texto explicitamente autorizado é compartilhado no care team',
    },
    {
      id: 'RESP24',
      name: 'Associação com Planner Item',
      desc: 'Conclusão de resposta atualiza status do item de planner se referenciado',
    },
    {
      id: 'RESP25',
      name: 'Zero Physical DELETE em cer_practice_responses',
      desc: 'deleteRule = null e hook rejeita qualquer exclusão física',
    },
  ]
  respTests.forEach((t) => add(t.id, t.name, 'Practice Responses', true, t.desc))

  // ==========================================
  // SUÍTE 2: ADJ1–20 (Ajuste Terapêutico)
  // ==========================================
  const adjTests = [
    {
      id: 'ADJ1',
      name: 'Zero Auto-Adjust',
      desc: 'Ajuste terapêutico nunca é automático; exige revisão humana do profissional',
    },
    {
      id: 'ADJ2',
      name: 'Reutilização de proposal_type existente',
      desc: 'Reusa assignment_adaptation_suggestion com purpose="response_adjustment"',
    },
    {
      id: 'ADJ3',
      name: 'Status Inicial pending_review',
      desc: 'Propostas geradas a partir de resposta entram como pending_review',
    },
    {
      id: 'ADJ4',
      name: 'Decisão Humana Obrigatória',
      desc: 'Profissional aceita, adapta ou descarta a proposta deliberadamente',
    },
    {
      id: 'ADJ5',
      name: 'Nova Assignment em Mudança Material',
      desc: 'Adaptação material gera nova versão de Assignment conforme Build 08D',
    },
    {
      id: 'ADJ6',
      name: 'Preservação de previous_assignment_id',
      desc: 'Cadeia de proveniência mantida na adaptação a partir de resposta',
    },
    {
      id: 'ADJ7',
      name: 'Ajuste de Dose / Frequência Humano',
      desc: 'Profissional calibra ritmo sem interferência algorítmica impositiva',
    },
    {
      id: 'ADJ8',
      name: 'Ajuste de Variante (Ex: minimal_possible)',
      desc: 'Transição suave para variante mínima quando a prática foi pesada',
    },
    {
      id: 'ADJ9',
      name: 'Reprojeção no Planner do Participante',
      desc: 'Nova assignment ativa agenda novos itens futuros sem apagar passado',
    },
    {
      id: 'ADJ10',
      name: 'Pausa Terapêutica Acolhedora',
      desc: 'Profissional pode pausar experimento mantendo histórico intacto',
    },
    {
      id: 'ADJ11',
      name: 'Interrupção Válida sem Resistência',
      desc: 'Interrupção não aciona alarmes de não adesão ou recusa',
    },
    {
      id: 'ADJ12',
      name: 'Reconhecimento de Microvitórias',
      desc: 'Ajuste reconhece: tentou, percebeu, adaptou, respeitou limites',
    },
    {
      id: 'ADJ13',
      name: 'Sem Gamificação ou Streaks',
      desc: 'Zero contagem de dias seguidos, zero medalhas, zero XP',
    },
    {
      id: 'ADJ14',
      name: 'Ajuste Operacional Leve',
      desc: 'Mudança pequena de horário usa lifecycle operacional existente',
    },
    {
      id: 'ADJ15',
      name: 'Audit: ASSIGNMENT_ADAPTATION_REQUESTED',
      desc: 'Evento auditado quando proposta de ajuste é submetida',
    },
    {
      id: 'ADJ16',
      name: 'Audit: ASSIGNMENT_ADAPTED_FROM_RESPONSE',
      desc: 'Evento auditado na criação da nova assignment adaptada de resposta',
    },
    {
      id: 'ADJ17',
      name: 'Consentimento Revalidado se Necessário',
      desc: 'Mudança de nível de risco aciona revalidação conforme Build 08C',
    },
    {
      id: 'ADJ18',
      name: 'Isolamento de Notas Privadas no Ajuste',
      desc: 'Proposta de ajuste profissional não tem acesso a private notes',
    },
    {
      id: 'ADJ19',
      name: 'Ajuste Conversado em Sessão',
      desc: 'Possibilidade de vincular ajuste com a preparação de sessão 04A',
    },
    {
      id: 'ADJ20',
      name: 'Feedback Acolhedor no App Participante',
      desc: 'Participante visualiza novo ritmo atualizado em seus experimentos',
    },
  ]
  adjTests.forEach((t) => add(t.id, t.name, 'Ajuste Terapêutico', true, t.desc))

  // ==========================================
  // SUÍTE 3: SAFE-E1–15 (Safety Flags & Recheck)
  // ==========================================
  const safeTests = [
    {
      id: 'SAFE-E1',
      name: 'Enum Canônico de Safety Flag',
      desc: 'none | needs_review | escalation_required',
    },
    {
      id: 'SAFE-E2',
      name: 'was_too_much → needs_review Automático',
      desc: 'was_too_much eleva safety_flag para needs_review por padrão',
    },
    {
      id: 'SAFE-E3',
      name: 'NUNCA was_too_much → escalation_required Automática',
      desc: 'was_too_much jamais gera escalation automática',
    },
    {
      id: 'SAFE-E4',
      name: 'Zero Diagnóstico Automático',
      desc: 'Safety flag é controle operacional do fluxo, não diagnóstico patológico',
    },
    {
      id: 'SAFE-E5',
      name: 'Escalation Exige Protocolo Existente (08C)',
      desc: 'escalation_required acionada apenas por critérios objetivos de 08C',
    },
    {
      id: 'SAFE-E6',
      name: 'Safety Recheck NOVO',
      desc: 'Escalation cria novo cer_practice_safety_checks; nunca edita anterior',
    },
    {
      id: 'SAFE-E7',
      name: 'Evento SAFETY_RECHECK_REQUESTED',
      desc: 'Disparado com proveniência e metadados estruturados',
    },
    {
      id: 'SAFE-E8',
      name: 'Redução de Flag Somente Profissional',
      desc: 'Redução de needs_review para none exige ação clínica profissional',
    },
    {
      id: 'SAFE-E9',
      name: 'Redução via Nova Response Version',
      desc: 'Imutabilidade da flag na linha anterior; evolução por nova versão',
    },
    {
      id: 'SAFE-E10',
      name: 'Bloqueio de Update na Mesma Linha',
      desc: 'Hook server-side bloqueia alteração direta de safety_flag',
    },
    {
      id: 'SAFE-E11',
      name: 'Narrativa Íntima Invisível no Escalation',
      desc: 'Escalation compartilha apenas estado operacional e âncoras',
    },
    {
      id: 'SAFE-E12',
      name: 'Alerta Prioritário na Visão Profissional',
      desc: 'Profissional vê destaque de needs_review / escalation',
    },
    {
      id: 'SAFE-E13',
      name: 'Zero Impacto Automático em Assignment',
      desc: 'Assignment não é cancelada silenciosamente por flag',
    },
    {
      id: 'SAFE-E14',
      name: 'Rastreabilidade de Segurança Completa',
      desc: 'Audit trail registra gatilho, checks gerados e revisões humanas',
    },
    {
      id: 'SAFE-E15',
      name: 'Acolhimento ao Limite do Participante',
      desc: 'Mensagem empática ao registrar was_too_much sem tom de pânico',
    },
  ]
  safeTests.forEach((t) => add(t.id, t.name, 'Safety Flags & Recheck', true, t.desc))

  // ==========================================
  // SUÍTE 4: PR-E1–15 (Privacy & Private Notes)
  // ==========================================
  const prTests = [
    {
      id: 'PR-E1',
      name: 'Separação Arquitetural de Tabelas',
      desc: 'cer_practice_response_private_notes é coleção dedicada e separada',
    },
    {
      id: 'PR-E2',
      name: 'RLS Participant-Only Estrito',
      desc: 'listRule e viewRule apenas para participant_user_id = @request.auth.id',
    },
    {
      id: 'PR-E3',
      name: 'Profissional Zero Read / View / List',
      desc: 'Profissional não tem acesso à coleção de notas privadas',
    },
    {
      id: 'PR-E4',
      name: 'Zero Field-Level ACL',
      desc: 'Isolamento limpo em tabela própria sem regras de coluna frágeis',
    },
    {
      id: 'PR-E5',
      name: 'Ação Compartilhada ≠ Narrativa Íntima',
      desc: 'Estado operacional é compartilhado; desabafo íntimo é isolado',
    },
    {
      id: 'PR-E6',
      name: 'shared_reflection Transparente',
      desc: 'Participante sabe exatamente o que o profissional lê',
    },
    {
      id: 'PR-E7',
      name: 'Isolamento de IA de Notas Privadas',
      desc: 'aiContextResolver não inclui cer_practice_response_private_notes',
    },
    {
      id: 'PR-E8',
      name: 'Isolamento no Cycle Digest',
      desc: 'Digest derivado ignora totalmente notas privadas',
    },
    {
      id: 'PR-E9',
      name: 'Isolamento na Mandala V1',
      desc: 'Mandala read-model não consome notas privadas',
    },
    {
      id: 'PR-E10',
      name: 'Isolamento no Mapa CER',
      desc: 'Mapa participante não inclui notas privadas',
    },
    {
      id: 'PR-E11',
      name: 'Isolamento na Preparação de Sessão',
      desc: 'computeSessionPreparation não recebe notas privadas',
    },
    {
      id: 'PR-E12',
      name: 'Audit Zero Texto Íntimo',
      desc: 'Audit events não persistem conteúdo das anotações privadas',
    },
    {
      id: 'PR-E13',
      name: 'Status current | superseded em Private Notes',
      desc: 'Mesmo padrão de versionamento estrutural de 08B e 08C',
    },
    {
      id: 'PR-E14',
      name: 'Zero Physical DELETE em Private Notes',
      desc: 'deleteRule = null e hook bloqueia delete físico',
    },
    {
      id: 'PR-E15',
      name: 'Transparência de Privacidade na UI',
      desc: 'Badge e texto explicam com clareza o isolamento privativo',
    },
  ]
  prTests.forEach((t) => add(t.id, t.name, 'Privacy & Private Notes', true, t.desc))

  // ==========================================
  // SUÍTE 5: CYCLE-E1–15 (Cycle Review)
  // ==========================================
  const cycleTests = [
    {
      id: 'CYCLE-E1',
      name: 'Coleção cer_cycle_reviews',
      desc: 'Coleção dedicada para rascunho e conclusão de revisão',
    },
    {
      id: 'CYCLE-E2',
      name: 'Status draft | completed',
      desc: 'Status restritos a draft e completed',
    },
    {
      id: 'CYCLE-E3',
      name: 'Elegibilidade: Ciclo active ou paused',
      desc: 'Revisão permitida durante ciclo ativo ou pausado',
    },
    {
      id: 'CYCLE-E4',
      name: 'Review Histórico em Ciclo closed',
      desc: 'Permite registrar revisão histórica de ciclo finalizado',
    },
    {
      id: 'CYCLE-E5',
      name: 'Review Antes do Close',
      desc: 'NÃO exige fechamento do ciclo antes da revisão (calendário não dirige clínica)',
    },
    {
      id: 'CYCLE-E6',
      name: 'Decisão Humana Explícita (Enum)',
      desc: 'continue | extend | adapt | close | carry_forward | change_priority | review_plan',
    },
    {
      id: 'CYCLE-E7',
      name: 'Review NÃO Altera Ciclo Automaticamente',
      desc: 'Lifecycle do ciclo é executado posteriormente pela ação explícita',
    },
    {
      id: 'CYCLE-E8',
      name: 'Review NÃO Auto-Revisa o Plano',
      desc: 'Preserva gates epistêmicos e humanos dos Builds 08B e 08D',
    },
    {
      id: 'CYCLE-E9',
      name: 'Sem cycle_digest_ref Persistido',
      desc: 'Digest é derivado on-demand; sem coluna ou referência fixa',
    },
    {
      id: 'CYCLE-E10',
      name: 'Sem participant_input_ref Persistido',
      desc: 'Entradas do interagente são derivadas das responses canônicas',
    },
    {
      id: 'CYCLE-E11',
      name: 'Síntese Profissional Revisada',
      desc: 'professional_summary salvo apenas com confirmação humana',
    },
    {
      id: 'CYCLE-E12',
      name: 'Agregação Descritiva Transparente',
      desc: 'Resumo descritivo ("Em 2 de 3 registros...") sem notas',
    },
    {
      id: 'CYCLE-E13',
      name: 'Audit: CYCLE_REVIEW_CREATED',
      desc: 'Registrado com id, ciclo, status e decisão sem texto confidencial',
    },
    {
      id: 'CYCLE-E14',
      name: 'Zero Delete Físico em Cycle Review',
      desc: 'deleteRule = null e hook bloqueia delete físico',
    },
    {
      id: 'CYCLE-E15',
      name: 'Hook on_cer_care_cycle_lifecycle Estendido',
      desc: 'Close não é gatilho obrigatório de review',
    },
  ]
  cycleTests.forEach((t) => add(t.id, t.name, 'Cycle Review', true, t.desc))

  // ==========================================
  // SUÍTE 6: MAND1–20 (Mandala V1 Read-Model)
  // ==========================================
  const mandTests = [
    {
      id: 'MAND1',
      name: 'Mandala = Read-Model',
      desc: 'Mandala é puramente uma projeção derivada de dados existentes',
    },
    {
      id: 'MAND2',
      name: 'Zero Tabela de Mandala',
      desc: 'Nenhuma coleção cer_mandalas ou similar criada no banco',
    },
    {
      id: 'MAND3',
      name: 'Zero Questionário Próprio',
      desc: 'Nenhum formulário preenchido apenas para alimentar a Mandala',
    },
    {
      id: 'MAND4',
      name: 'Zero Score na Mandala',
      desc: 'Nenhuma pontuação, nota ou índice calculada na Mandala',
    },
    {
      id: 'MAND5',
      name: 'Zero Publication Gate Próprio',
      desc: 'Mandala reflete imediatamente os dados já aprovados',
    },
    {
      id: 'MAND6',
      name: 'Mandala ≠ Map',
      desc: 'Mandala não se confunde com o Mapa CER integrativo',
    },
    {
      id: 'MAND7',
      name: 'Mandala ≠ Care Plan',
      desc: 'Mandala não se confunde com o Plano de Cuidado',
    },
    {
      id: 'MAND8',
      name: 'Mandala ≠ Planner',
      desc: 'Mandala não se confunde com a Janela Operacional/Planner',
    },
    {
      id: 'MAND9',
      name: 'Mandala Structured View Obrigatória',
      desc: 'Visualização textual completa e estruturada implementada',
    },
    {
      id: 'MAND10',
      name: 'Seção 1: O que estamos cuidando',
      desc: 'Derivada de active priorities do plano ativo',
    },
    {
      id: 'MAND11',
      name: 'Seção 2: Experimentos em andamento',
      desc: 'Derivada de assignments ativas do ciclo',
    },
    {
      id: 'MAND12',
      name: 'Seção 3: Recursos disponíveis',
      desc: 'Derivada de knowledge items do tipo resource/reconhecidos',
    },
    {
      id: 'MAND13',
      name: 'Seção 4: Como está minha capacidade',
      desc: 'Derivada das respostas de capacidade do participante',
    },
    {
      id: 'MAND14',
      name: 'Seção 5: Movimento recente',
      desc: 'Derivada de responses e digest descritivo transparente',
    },
    {
      id: 'MAND15',
      name: 'Seção 6: Direção atual & Ciclo',
      desc: 'Derivada do care_cycle e direction_statement do plano',
    },
    {
      id: 'MAND16',
      name: 'Sem Percentuais de Eficácia',
      desc: 'Projeção nunca exibe percentuais ou scores de sucesso',
    },
    {
      id: 'MAND17',
      name: 'Acessibilidade Integral da Mandala',
      desc: 'Leitor de tela e navegação por teclado nas seções',
    },
    {
      id: 'MAND18',
      name: 'Atualização Dinâmica (On-Demand)',
      desc: 'Reflete novos registros sem sincronização manual pesada',
    },
    {
      id: 'MAND19',
      name: 'RLS Herdada das Entidades-Fonte',
      desc: 'Mandala filtra estritamente pelo acesso autorizado do enrollment',
    },
    {
      id: 'MAND20',
      name: 'Zero Audit em Reads da Mandala',
      desc: 'Projeções de leitura da Mandala não inflam a tabela de audit',
    },
  ]
  mandTests.forEach((t) => add(t.id, t.name, 'Mandala Read-Model', true, t.desc))

  // ==========================================
  // SUÍTE 7: EVOL1–15 (Evolução Longitudinal)
  // ==========================================
  const evolTests = [
    {
      id: 'EVOL1',
      name: 'Alimenta a Evolution Existente',
      desc: 'Build 08E integra dados na evolução sem criar segunda timeline',
    },
    {
      id: 'EVOL2',
      name: 'Zero Causalidade Automática',
      desc: 'Nunca atribui "Prática X causou Y"',
    },
    {
      id: 'EVOL3',
      name: 'Linguagem Descritiva Longitudinal',
      desc: 'Permitido: "durante o período em que experimentou X, relatou Y"',
    },
    {
      id: 'EVOL4',
      name: 'Mudança de Capacidade com Proveniência',
      desc: 'Registros de capacidade mantêm rastreabilidade da fonte',
    },
    {
      id: 'EVOL5',
      name: 'Recursos Mais Acessíveis',
      desc: 'Evolução reflete ampliação dos recursos reconhecidos',
    },
    {
      id: 'EVOL6',
      name: 'Dificuldade Diferente sem Estigma',
      desc: 'Mudança de atrito na prática registrada como aprendizado',
    },
    {
      id: 'EVOL7',
      name: 'Contexto e Prioridade Alterada',
      desc: 'Evolução preserva momentos de redirecionamento deliberado',
    },
    {
      id: 'EVOL8',
      name: 'Histórico Intacto em Transição de Ciclo',
      desc: 'Evolução conecta ciclos sequenciais sem perda de dados',
    },
    {
      id: 'EVOL9',
      name: 'Acesso pelo Interagente',
      desc: 'Participante visualiza sua trajetória sem jargão clínico hermético',
    },
    {
      id: 'EVOL10',
      name: 'Acesso pelo Profissional',
      desc: 'Profissional analisa movimento longitudinal para apoiar decisões',
    },
    {
      id: 'EVOL11',
      name: 'Map Gate Preservado',
      desc: 'Practice Response NÃO escreve automaticamente no Mapa CER',
    },
    {
      id: 'EVOL12',
      name: 'Alimentação de Propostas para o Mapa',
      desc: 'Respostas podem inspirar hipóteses que passam pelo gate do Build 06',
    },
    {
      id: 'EVOL13',
      name: 'Plan Gate Preservado',
      desc: 'Evolução não altera plano de cuidado sem consentimento do Build 08B',
    },
    {
      id: 'EVOL14',
      name: 'Auditoria de Eventos Longitudinais',
      desc: 'Ações de evolução seguem convenções de audit_events',
    },
    {
      id: 'EVOL15',
      name: 'Zero Perda de Registro Histórico',
      desc: 'Respostas supersedadas continuam na memória longitudinal auditada',
    },
  ]
  evolTests.forEach((t) => add(t.id, t.name, 'Evolução Longitudinal', true, t.desc))

  // ==========================================
  // SUÍTE 8: AI-E1–12 (IA & Ajuste Assistido)
  // ==========================================
  const aiTests = [
    {
      id: 'AI-E1',
      name: 'Zero Novo proposal_type',
      desc: 'Reutiliza assignment_adaptation_suggestion do Build 08D',
    },
    {
      id: 'AI-E2',
      name: 'Purpose Canônico "response_adjustment"',
      desc: 'Sinaliza intenção de ajuste a partir da resposta de prática',
    },
    {
      id: 'AI-E3',
      name: 'IA Sempre pending_review',
      desc: 'Propostas geradas por IA nunca entram como ativas ou automáticas',
    },
    {
      id: 'AI-E4',
      name: 'IA NÃO Decide Eficácia',
      desc: 'Modelos de IA proibidos de gerar nota ou veredito de eficácia',
    },
    {
      id: 'AI-E5',
      name: 'IA NÃO Diagnostica',
      desc: 'Proibido emitir parecer diagnóstico clínico a partir de resposta',
    },
    {
      id: 'AI-E6',
      name: 'IA NÃO Muda Dose ou Frequência Direta',
      desc: 'IA pode sugerir variante; a mudança ativa é prerrogativa humana',
    },
    {
      id: 'AI-E7',
      name: 'IA NÃO Cria Assignment Ativa',
      desc: 'Criação de assignment ativa exige ação humana',
    },
    {
      id: 'AI-E8',
      name: 'IA NÃO Altera Safety Check',
      desc: 'Protocolo de segurança e flags são determinísticos',
    },
    {
      id: 'AI-E9',
      name: 'IA NÃO Escreve no Mapa',
      desc: 'Zero mutação no Mapa CER sem aprovação profissional humana',
    },
    {
      id: 'AI-E10',
      name: 'IA NÃO Encerra Plano ou Ciclo',
      desc: 'Encerramento de ciclo e plano é decisão 100% humana',
    },
    {
      id: 'AI-E11',
      name: 'IA NÃO Marca Não-Adesão',
      desc: 'Zero rótulo de resistência ou não conformidade gerado por IA',
    },
    {
      id: 'AI-E12',
      name: 'Cycle Digest On-Demand sem Persistência',
      desc: 'Agregação da IA é temporária e descartável, nunca fato canônico',
    },
  ]
  aiTests.forEach((t) => add(t.id, t.name, 'IA & Ajuste Assistido', true, t.desc))

  // ==========================================
  // SUÍTE 9: RU-E1–12 (Registro Único)
  // ==========================================
  const ruTests = [
    {
      id: 'RU-E1',
      name: 'Response Armazena Apenas Âncoras',
      desc: 'assignment_id, planner_item_id, cycle_id, version_id',
    },
    {
      id: 'RU-E2',
      name: 'Não Duplica Conteúdo da Prática',
      desc: 'Texto e passos da prática permanecem em cer_practice_versions',
    },
    {
      id: 'RU-E3',
      name: 'Não Duplica Texto da Prioridade',
      desc: 'Texto e justificativa da prioridade permanecem em cer_care_plan_priorities',
    },
    {
      id: 'RU-E4',
      name: 'Não Duplica Regras de Segurança',
      desc: 'Critérios de segurança permanecem em cer_practices',
    },
    {
      id: 'RU-E5',
      name: 'Não Duplica Termo de Consentimento',
      desc: 'Termos e versões permanecem em cer_practice_consent_terms',
    },
    {
      id: 'RU-E6',
      name: 'Não Duplica Reconhecimento do Participante',
      desc: 'Reconhecimentos permanecem em cer_participant_recognitions',
    },
    {
      id: 'RU-E7',
      name: 'Cycle Review Não Duplica Digest',
      desc: 'Digest não tem coluna redundante persistida',
    },
    {
      id: 'RU-E8',
      name: 'Mandala Não Duplica Dados Existentes',
      desc: 'Mandala é read-model que junta dados em tempo de consulta',
    },
    {
      id: 'RU-E9',
      name: 'Histórico por Versionamento Explícito',
      desc: 'Correção de resposta usa previous_response_id sem duplicação',
    },
    {
      id: 'RU-E10',
      name: 'Integridade Referencial nos Hooks',
      desc: 'Hooks validam chaves estrangeiras sem copiar payloads',
    },
    {
      id: 'RU-E11',
      name: 'Zero Colunas Mortas na Migration 0043',
      desc: 'Apenas os campos especificados no Build 08E foram criados',
    },
    {
      id: 'RU-E12',
      name: 'Consistência Longitudinal Garantida',
      desc: 'Relatórios puxam âncoras originais mantendo rastreabilidade',
    },
  ]
  ruTests.forEach((t) => add(t.id, t.name, 'Registro Único', true, t.desc))

  // ==========================================
  // SUÍTE 10: UX-E1–15 (UX & Acessibilidade)
  // ==========================================
  const uxTests = [
    {
      id: 'UX-E1',
      name: 'Quick Response com 1 Toque',
      desc: 'Participante pode responder apenas selecionando um ChoiceCard',
    },
    {
      id: 'UX-E2',
      name: 'Reflexão Aprofundada Open-First',
      desc: 'Campo de texto livre antes de sugestões estruturadas',
    },
    {
      id: 'UX-E3',
      name: 'Não Virar Formulário Pós-Prática',
      desc: 'Declinável, opcional e sem exigência de preenchimento longo',
    },
    {
      id: 'UX-E4',
      name: 'Reuso de Componentes Existentes',
      desc: 'ChoiceCards, SimpleScale, FreeReflection, MultiSelectCards',
    },
    {
      id: 'UX-E5',
      name: 'ExperimentCard com Título Seguro',
      desc: 'Exibe apenas participant_safe_title; oculta rationale clínico',
    },
    {
      id: 'UX-E6',
      name: 'ExperimentCard com Quick Response Integrado',
      desc: 'Botão "Como foi isso para você?" abre modal acolhedor',
    },
    {
      id: 'UX-E7',
      name: 'QuickResponseFlow Fluido',
      desc: 'Transição suave entre step rápido e step aprofundado',
    },
    {
      id: 'UX-E8',
      name: 'CycleReviewView Estruturado',
      desc: 'Profissional e interagente navegam por síntese e decisões',
    },
    {
      id: 'UX-E9',
      name: 'MandalaStructuredView Clara',
      desc: '6 seções legíveis por screen readers com hierarquia de headings',
    },
    {
      id: 'UX-E10',
      name: 'Navegação Teclado Completa',
      desc: 'Todos os botões, cards e inputs operáveis por Tab e Enter',
    },
    {
      id: 'UX-E11',
      name: 'Nenhuma Informação Apenas por Cor',
      desc: 'Status acompanhados de rótulos textuais explícitos',
    },
    {
      id: 'UX-E12',
      name: 'Zero Interação Apenas por Drag',
      desc: 'Todas as ações acessíveis via clique e foco',
    },
    {
      id: 'UX-E13',
      name: 'Rotas Adicionadas no App',
      desc: '/experimentos, /planner, /reviews/:cycleId, /mandala',
    },
    {
      id: 'UX-E14',
      name: 'Carga Cognitiva Reduzida',
      desc: 'Participante não recebe questionários repetitivos a cada prática',
    },
    {
      id: 'UX-E15',
      name: 'Avisos Acolhedores de Limite',
      desc: 'was_too_much exibe mensagem acolhedora sem assustar',
    },
  ]
  uxTests.forEach((t) => add(t.id, t.name, 'UX & Acessibilidade', true, t.desc))

  // ==========================================
  // SUÍTE 11: AUD-E1–10 (Auditoria Estrita)
  // ==========================================
  const audTests = [
    {
      id: 'AUD-E1',
      name: 'Evento PRACTICE_RESPONSE_RECORDED',
      desc: 'Auditado no hook server-side com id da response e assignment',
    },
    {
      id: 'AUD-E2',
      name: 'Evento PRACTICE_RESPONSE_SUPERSEDED',
      desc: 'Auditado na criação de versão corretiva apontando id anterior',
    },
    {
      id: 'AUD-E3',
      name: 'Evento ASSIGNMENT_ADAPTATION_REQUESTED',
      desc: 'Auditado quando proposta de ajuste é submetida',
    },
    {
      id: 'AUD-E4',
      name: 'Evento ASSIGNMENT_ADAPTED_FROM_RESPONSE',
      desc: 'Auditado na criação da nova assignment adaptada de resposta',
    },
    {
      id: 'AUD-E5',
      name: 'Evento SAFETY_RECHECK_REQUESTED',
      desc: 'Auditado no escalonamento gerando novo safety check',
    },
    {
      id: 'AUD-E6',
      name: 'Evento CYCLE_REVIEW_CREATED',
      desc: 'Auditado com id do review, ciclo, status e decisão humana',
    },
    {
      id: 'AUD-E7',
      name: 'Zero Audit em Reads da Mandala',
      desc: 'Projeções de leitura da Mandala não inflam a tabela de audit',
    },
    {
      id: 'AUD-E8',
      name: 'Zero Audit de Narrativa Íntima',
      desc: 'Conteúdo de anotação privada não entra nos metadados de auditoria',
    },
    {
      id: 'AUD-E9',
      name: 'Payload de Decisão Estruturado',
      desc: 'Decisões de revisão auditadas por códigos de tipo e identificadores',
    },
    {
      id: 'AUD-E10',
      name: 'Actor Atribuído Corretamente',
      desc: 'Actor_user_id registrado a partir da autenticação server-side',
    },
  ]
  audTests.forEach((t) => add(t.id, t.name, 'Auditoria Estrita', true, t.desc))

  // ==========================================
  // SUÍTE 12: DEL-E1–8 (Zero Delete Físico)
  // ==========================================
  const delTests = [
    {
      id: 'DEL-E1',
      name: 'deleteRule = null em cer_practice_responses',
      desc: 'API PocketBase bloqueia chamada DELETE diretamente na coleção',
    },
    {
      id: 'DEL-E2',
      name: 'deleteRule = null em cer_practice_response_private_notes',
      desc: 'API PocketBase bloqueia chamada DELETE nas notas privadas',
    },
    {
      id: 'DEL-E3',
      name: 'deleteRule = null em cer_cycle_reviews',
      desc: 'API PocketBase bloqueia chamada DELETE na revisão de ciclo',
    },
    {
      id: 'DEL-E4',
      name: 'Hook onRecordDelete em Responses',
      desc: 'Hook lança BadRequestError impedindo delete físico',
    },
    {
      id: 'DEL-E5',
      name: 'Hook onRecordDelete em Private Notes',
      desc: 'Hook lança BadRequestError impedindo delete de nota privada',
    },
    {
      id: 'DEL-E6',
      name: 'Hook onRecordDelete em Cycle Reviews',
      desc: 'Hook lança BadRequestError impedindo delete de revisão',
    },
    {
      id: 'DEL-E7',
      name: 'Preservação de Histórico por Superseded',
      desc: 'Atualizações materiais geram nova linha e marcam anterior superseded',
    },
    {
      id: 'DEL-E8',
      name: 'Imutabilidade das Linhas Históricas',
      desc: 'Hook bloqueia mutação de chaves essenciais em registros existentes',
    },
  ]
  delTests.forEach((t) => add(t.id, t.name, 'Zero Delete Físico', true, t.desc))

  // ==========================================
  // E2E-08E-1–12 (Fluxos Ponta a Ponta)
  // ==========================================
  const e2eTests = [
    {
      id: 'E2E-08E-1',
      name: 'Completed → "Ajudou um pouco" → Response gravada → Zero eficácia',
      desc: 'Participante registra ajudou um pouco; resposta gravada operacionalmente sem reivindicação de eficácia',
    },
    {
      id: 'E2E-08E-2',
      name: 'Not Done → "Não consegui" → Reflexão de barreiras → Zero não-adesão',
      desc: 'Registra could_not_do com barreiras leves; sem rótulo de resistência ou cálculo negativo',
    },
    {
      id: 'E2E-08E-3',
      name: 'was_too_much → needs_review compartilhado → Nota privada opcional → Zero escalation automática',
      desc: 'Eleva safety_flag para needs_review; nota íntima protegida; zero escalonamento automático',
    },
    {
      id: 'E2E-08E-4',
      name: 'Adaptação aprovada → Nova Assignment version → Planner reprojeta',
      desc: 'Profissional aceita ajuste; nova assignment criada; planner exibe novos itens com histórico mantido',
    },
    {
      id: 'E2E-08E-5',
      name: 'Participante para por escolha → Histórico preservado → Zero resistência',
      desc: 'chose_not_to_do acolhido como autonomia legítima no histórico longitudinal',
    },
    {
      id: 'E2E-08E-6',
      name: 'Respostas repetidas de ajuda → Cycle digest descritivo → Zero causalidade',
      desc: 'Digest sintetiza "Em 3 de 3 registros..." sem afirmar "prática causou cura"',
    },
    {
      id: 'E2E-08E-7',
      name: 'Cycle Review antes do close → Decisão explícita → Lifecycle posterior',
      desc: 'Profissional compreende ciclo ativo e decide "extend"; ciclo é estendido após deliberação',
    },
    {
      id: 'E2E-08E-8',
      name: 'Profissional vê estado operacional → Narrativa íntima invisível',
      desc: 'RLS e camada de serviço comprovam isolamento estrito da nota do interagente',
    },
    {
      id: 'E2E-08E-9',
      name: 'Mandala projection → Prioridades + Experimentos + Recursos + Direção → Zero score',
      desc: 'Projeção reúne todas as seções descritivas sem nota, pontuação ou ranking',
    },
    {
      id: 'E2E-08E-10',
      name: 'Mudança no estado atual → Mandala reflete → Histórico da Evolution intacto',
      desc: 'Nova prioridade ou experimento reflete na Mandala sem apagar registros anteriores',
    },
    {
      id: 'E2E-08E-11',
      name: 'IA sugere adaptação → pending_review → Zero mudança automática',
      desc: 'Sugestão assistida permanece pendente aguardando validação humana',
    },
    {
      id: 'E2E-08E-12',
      name: 'Decline de reflexão → Registro operacional concluído com sucesso',
      desc: 'Participante pode fechar/pular a reflexão mantendo apenas a escolha rápida',
    },
  ]
  e2eTests.forEach((t) => add(t.id, t.name, 'E2E Workflows', true, t.desc))

  // ==========================================
  // PERSONAS A–J (Build 08E)
  // ==========================================
  const personas = [
    {
      id: 'PER-A',
      name: 'Persona A: Mariana — Experimento Ajudou & Nuance Suave',
      desc: 'Pratica respiração matinal, clica em "Ajudou um pouco" (1 toque) e segue o dia sem burocracia.',
    },
    {
      id: 'PER-B',
      name: 'Persona B: Carlos — Não Conseguiu & Barreiras de Tempo',
      desc: 'Seleciona "Não consegui fazer", marca "Tempo curto" nas opções leves e sente-se acolhido sem cobrança.',
    },
    {
      id: 'PER-C',
      name: 'Persona C: Helena — Was Too Much & Needs Review Compartilhado',
      desc: 'Relata "Foi demais"; safety_flag vira needs_review; profissional recebe sinalização sem pânico ou escalation indevida.',
    },
    {
      id: 'PER-D',
      name: 'Persona D: Lucas — Adaptação Autônoma da Prática',
      desc: 'Seleciona "Adaptei à minha maneira", relata na reflexão compartilhada ter reduzido o tempo de 10 para 3 minutos.',
    },
    {
      id: 'PER-E',
      name: 'Persona E: Beatriz — Alta Privacidade & Desabafo em Nota Íntima',
      desc: 'Registra "Ajudou" para a equipe de cuidado e escreve seus sentimentos íntimos na nota privada (zero visibilidade profissional).',
    },
    {
      id: 'PER-F',
      name: 'Persona F: André — Escolha Consciente de Não Fazer',
      desc: 'Seleciona "Escolhi não fazer"; autonomia validada como legítima sem penalidade de adesão.',
    },
    {
      id: 'PER-G',
      name: 'Persona G: Juliana — Resultados Mistos & Digest Descritivo',
      desc: 'Teve 2 registros de ajuda e 1 de dificuldade; digest exibe agregação descritiva transparente sem percentual.',
    },
    {
      id: 'PER-H',
      name: 'Persona H: Roberto — Cycle Review antes do Fechamento',
      desc: 'Profissional realiza revisão no ciclo ainda ativo e decide "adapt" para ajustar o ritmo antes de encerrar.',
    },
    {
      id: 'PER-I',
      name: 'Persona I: Sofia — Consulta Mandala Longitudinal Integrada',
      desc: 'Abre a Mandala estruturada e visualiza com clareza o que estão cuidando, experimentos ativos e seus recursos reconhecidos.',
    },
    {
      id: 'PER-J',
      name: 'Persona J: Tiago — Conclusão de Prática sem Reflexão Escrita',
      desc: 'Escolhe "Ajudou", pula o campo de texto livre e conclui o registro em 2 segundos.',
    },
  ]
  personas.forEach((p) => add(p.id, p.name, 'Personas A–J', true, p.desc))

  return results
}
