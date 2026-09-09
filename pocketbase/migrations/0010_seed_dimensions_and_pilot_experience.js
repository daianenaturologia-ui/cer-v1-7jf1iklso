migrate(
  (app) => {
    const flagsCol = app.findCollectionByNameOrId('feature_flags')
    const dimensionsCol = app.findCollectionByNameOrId('cer_dimensions')
    const experiencesCol = app.findCollectionByNameOrId('cer_experiences')
    const promptsCol = app.findCollectionByNameOrId('cer_prompts')
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const enrExpCol = app.findCollectionByNameOrId('enrollment_experiences')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Feature Flag: experience_engine
    try {
      app.findFirstRecordByData('feature_flags', 'key', 'experience_engine')
    } catch (_) {
      const ff = new Record(flagsCol)
      ff.set('key', 'experience_engine')
      ff.set('name', 'Experience Engine (Build 02)')
      ff.set('description', 'Motor de experiências modulares da fase Consciência')
      ff.set('is_enabled', true)
      ff.set('metadata', JSON.stringify({ environment: 'synthetic', build: '02' }))
      app.save(ff)
    }

    // 2. As 6 Dimensões Oficiais da Consciência (apenas registros estruturais)
    const officialDimensions = [
      {
        code: 'corpo_fisiologia',
        title: 'Corpo & Fisiologia',
        order_index: 1,
        description:
          'Ritmos biológicos, sono, digestão, vitalidade corporal e sensações somáticas.',
      },
      {
        code: 'mente_emocoes',
        title: 'Mente & Emoções',
        order_index: 2,
        description: 'Processamento mental, estados emocionais, clareza e sobrecarga psíquica.',
      },
      {
        code: 'regulacao_respostas',
        title: 'Regulação & Padrões de Resposta',
        order_index: 3,
        description: 'Respostas ao estresse, autorregulação, co-regulação, reatividade e presença.',
      },
      {
        code: 'relacoes',
        title: 'Relações',
        order_index: 4,
        description: 'Vínculos significativos, comunicação, limites interpessoais e convivência.',
      },
      {
        code: 'sexualidade',
        title: 'Sexualidade',
        order_index: 5,
        description: 'Vitalidade íntima, desejo, relação com o prazer e autonomia erótica.',
      },
      {
        code: 'sentido_conexao',
        title: 'Sentido & Conexão',
        order_index: 6,
        description:
          'Propósito, espiritualidade experiencial, pertencimento e valores estruturantes.',
      },
    ]

    const dimMap = {}
    for (const d of officialDimensions) {
      let rec
      try {
        rec = app.findFirstRecordByData('cer_dimensions', 'code', d.code)
      } catch (_) {
        rec = new Record(dimensionsCol)
        rec.set('code', d.code)
        rec.set('title', d.title)
        rec.set('order_index', d.order_index)
        rec.set('description', d.description)
        rec.set('is_active', true)
        app.save(rec)
      }
      dimMap[d.code] = rec
    }

    // 3. Experiência Piloto Sintética: "Conhecendo meu momento"
    // Pertence estruturalmente à dimensão 1 (Corpo & Fisiologia) para comprovar suporte
    let pilotExp
    try {
      pilotExp = app.findFirstRecordByData('cer_experiences', 'code', 'conhecendo_meu_momento')
    } catch (_) {
      pilotExp = new Record(experiencesCol)
      pilotExp.set('dimension_id', dimMap['corpo_fisiologia'].id)
      pilotExp.set('code', 'conhecendo_meu_momento')
      pilotExp.set('title', 'Conhecendo meu momento')
      pilotExp.set(
        'subtitle',
        'Uma breve pausa para você se perceber e reconhecer seu ritmo de hoje.',
      )
      pilotExp.set('order_index', 1)
      pilotExp.set('is_pilot', true)
      pilotExp.set(
        'opening_text',
        'Reserve alguns minutos para esta pausa. Não existem respostas certas ou erradas — apenas o retrato de como você está agora.',
      )
      pilotExp.set(
        'closing_text',
        'Pronto. Esse registro passa a fazer parte da sua jornada. Obrigado por dedicar este momento a você.',
      )
      pilotExp.set('version', 1)
      app.save(pilotExp)
    }

    // 4. Prompts da Experiência Piloto (Demonstrando todos os 8 componentes reutilizáveis)
    // MOMENTO 1 — COMO CHEGO HOJE (ChoiceCards)
    // MOMENTO 2 — COMO PERCEBO MEU CORPO (BodyMap)
    // MOMENTO 3 — MEU RITMO (SimpleScale)
    // MOMENTO 4 — O QUE TEM OCUPADO ESPAÇO (Ordering)
    // MOMENTO 5 — FOCO DO MEU DIA (MultiSelectCards)
    // MOMENTO 6 — UMA SITUAÇÃO COTIDIANA (ScenarioChoice)
    // MOMENTO 7 — MARCAS DA MINHA JORNADA (Timeline)
    // MOMENTO 8 — ALGO QUE QUERO REGISTRAR (FreeReflection)

    const pilotPrompts = [
      {
        step_order: 1,
        step_title: 'Como chego hoje',
        step_subtitle:
          'Escolha a sensação que melhor descreve seu ponto de partida neste instante.',
        component_type: 'ChoiceCards',
        prompt_text:
          'Qual sensação mais se aproxima de como você se sente ao iniciar esta experiência?',
        helper_text: 'Selecione uma opção que ressoe com o seu momento.',
        schema_config: {
          options: [
            {
              id: 'calma_presente',
              title: 'Calma e presença',
              description: 'Sensação de tranquilidade e atenção aberta.',
            },
            {
              id: 'mente_acelerada',
              title: 'Mente acelerada',
              description: 'Muitos pensamentos e estímulos em andamento.',
            },
            {
              id: 'cansaco_corpo',
              title: 'Cansaço físico',
              description: 'Necessidade de pausa, descanso ou desaceleração.',
            },
            {
              id: 'curiosidade',
              title: 'Curiosidade e abertura',
              description: 'Disposição para investigar como estou funcionando.',
            },
          ],
        },
        is_required: true,
        version: 1,
      },
      {
        step_order: 2,
        step_title: 'Como percebo meu corpo',
        step_subtitle: 'Mapeie as regiões onde sua percepção física está mais evidente hoje.',
        component_type: 'BodyMap',
        prompt_text:
          'Selecione uma ou mais partes do corpo onde você nota sensações agora (tensão, leveza, calor, peso).',
        helper_text: 'Clique nas regiões corporais para marcar ou desmarcar.',
        schema_config: {
          maxSelect: 4,
          regions: [
            { id: 'head', label: 'Cabeça / Têmporas' },
            { id: 'neck_shoulders', label: 'Pescoço e Ombros' },
            { id: 'chest', label: 'Peito / Tórax' },
            { id: 'abdomen', label: 'Abdômen / Digestivo' },
            { id: 'back', label: 'Costas / Lombar' },
            { id: 'arms', label: 'Braços e Mãos' },
            { id: 'legs', label: 'Pernas e Pés' },
          ],
        },
        is_required: true,
        version: 1,
      },
      {
        step_order: 3,
        step_title: 'Meu ritmo',
        step_subtitle: 'Um olhar honesto sobre a velocidade com que seus dias têm transcorrido.',
        component_type: 'SimpleScale',
        prompt_text: 'Como você avalia o ritmo interno dos seus últimos dias?',
        helper_text: 'Deslize ou clique na escala para indicar seu ritmo.',
        schema_config: {
          min: 1,
          max: 5,
          step: 1,
          defaultValue: 3,
          leftAnchor: 'Muito lento / Estagnado',
          centerAnchor: 'Equilibrado e Fluido',
          rightAnchor: 'Muito acelerado / Urgente',
        },
        is_required: true,
        version: 1,
      },
      {
        step_order: 4,
        step_title: 'O que tem ocupado espaço',
        step_subtitle: 'Hierarquize os temas que mais têm demandado sua energia ultimamente.',
        component_type: 'Ordering',
        prompt_text:
          'Ordene estes aspectos do que tem mais ocupado sua atenção para o que menos ocupa:',
        helper_text:
          'Use as setas para reposicionar os itens na ordem do mais presente ao menos presente.',
        schema_config: {
          items: [
            { id: 'trabalho_demandas', label: 'Trabalho e compromissos externos' },
            { id: 'cuidados_corpo', label: 'Cuidados com o corpo e saúde' },
            { id: 'relacoes_afeto', label: 'Relações familiares e afetivas' },
            { id: 'tempo_pessoal', label: 'Tempo livre e descanso pessoal' },
          ],
        },
        is_required: true,
        version: 1,
      },
      {
        step_order: 5,
        step_title: 'Focos de atenção',
        step_subtitle:
          'Identifique os pilares práticos que você gostaria de observar mais de perto.',
        component_type: 'MultiSelectCards',
        prompt_text:
          'Quais desses fatores você sente que merecem mais atenção consciente na sua rotina?',
        helper_text: 'Você pode selecionar até 3 opções.',
        schema_config: {
          minSelect: 1,
          maxSelect: 3,
          options: [
            {
              id: 'sono',
              title: 'Qualidade do Sono',
              description: 'Hora de dormir, despertar e reparação noturna.',
            },
            {
              id: 'alimentacao',
              title: 'Alimentação consciente',
              description: 'Digestão, horários e relação com o alimento.',
            },
            {
              id: 'pausas',
              title: 'Pausas conscientes',
              description: 'Intervalos ao longo da jornada diária.',
            },
            {
              id: 'limites',
              title: 'Dizer "não" e limites',
              description: 'Capacidade de preservar a própria energia.',
            },
            {
              id: 'movimento',
              title: 'Movimento corporal',
              description: 'Caminhadas, exercícios ou mobilidade física.',
            },
          ],
        },
        is_required: true,
        version: 1,
      },
      {
        step_order: 6,
        step_title: 'Uma situação cotidiana',
        step_subtitle: 'Observando padrões de resposta espontâneos frente a um pequeno imprevisto.',
        component_type: 'ScenarioChoice',
        prompt_text: 'Imagine que um compromisso importante é cancelado em cima da hora:',
        helper_text: 'Selecione a resposta que mais costuma se manifestar espontaneamente em você.',
        schema_config: {
          scenarioDescription:
            'Você organizou seu dia para uma reunião ou tarefa, mas o compromisso foi desmarcado repentinamente.',
          options: [
            {
              id: 'alivio',
              title: 'Sinto alívio imediato',
              detail: 'Aproveito para respirar ou fazer algo que estava adiando.',
            },
            {
              id: 'frustracao',
              title: 'Sinto frustração ou incômodo',
              detail: 'Fico com a sensação de tempo perdido e plano quebrado.',
            },
            {
              id: 'ansiedade',
              title: 'Preocupação em reorganizar tudo',
              detail: 'A mente dispara tentando preencher o espaço com outras demandas.',
            },
            {
              id: 'indiferenca',
              title: 'Adapto-me com neutralidade',
              detail: 'Sigo naturalmente para o próximo assunto sem grande apego.',
            },
          ],
        },
        is_required: true,
        version: 1,
      },
      {
        step_order: 7,
        step_title: 'Marcas no tempo',
        step_subtitle: 'Situando marcos temporais que influenciaram seu estado atual.',
        component_type: 'Timeline',
        prompt_text: 'Como você distribui os momentos de maior mudança nos últimos meses?',
        helper_text: 'Selecione ou posicione os acontecimentos que mais impactaram seu equilíbrio.',
        schema_config: {
          milestones: [
            {
              id: 'm1',
              label: 'Há 3 meses',
              defaultNote: 'Mudança de rotina ou início de um ciclo',
            },
            {
              id: 'm2',
              label: 'Mês passado',
              defaultNote: 'Período de maior sobrecarga ou adaptação',
            },
            {
              id: 'm3',
              label: 'Esta semana',
              defaultNote: 'Momento de percepção da necessidade de ajuste',
            },
          ],
        },
        is_required: false,
        version: 1,
      },
      {
        step_order: 8,
        step_title: 'Algo que quero registrar',
        step_subtitle: 'Um espaço aberto para sua palavra autêntica, sem julgamento ou formatação.',
        component_type: 'FreeReflection',
        prompt_text:
          'Há algo que apareceu para você ao longo deste momento e que você deseja deixar registrado?',
        helper_text:
          'Escreva livremente. Este registro é seu e apoia sua caminhada de autopercepção.',
        schema_config: {
          placeholder: 'Escreva o que fizer sentido neste momento...',
          voiceTranscriptionSupported: true, // arquitetura pronta para voz futura, sem chamar IA agora
          minChars: 0,
        },
        is_required: false,
        version: 1,
      },
    ]

    for (const p of pilotPrompts) {
      try {
        app.findFirstRecordByData('cer_prompts', 'prompt_text', p.prompt_text)
      } catch (_) {
        const promptRec = new Record(promptsCol)
        promptRec.set('experience_id', pilotExp.id)
        promptRec.set('step_order', p.step_order)
        promptRec.set('step_title', p.step_title)
        promptRec.set('step_subtitle', p.step_subtitle)
        promptRec.set('component_type', p.component_type)
        promptRec.set('prompt_text', p.prompt_text)
        promptRec.set('helper_text', p.helper_text)
        promptRec.set('schema_config', JSON.stringify(p.schema_config))
        promptRec.set('is_required', p.is_required)
        promptRec.set('version', p.version)
        app.save(promptRec)
      }
    }

    // 5. Vincular a Experiência Piloto aos Enrollments sintéticos existentes (Ana e Beatriz)
    // Por padrão: status 'available' e 'not_started' para permitir interação imediata na Home
    const allEnrollments = app.findRecordsByFilter('enrollments', 'status = "active"', '', 20, 0)
    const profAUser = app.findFirstRecordByData('users', 'email', 'profissional.a@cer.app')

    for (const enr of allEnrollments) {
      try {
        app.findFirstRecordByData('enrollment_experiences', 'enrollment_id', enr.id)
      } catch (_) {
        const enrExp = new Record(enrExpCol)
        enrExp.set('enrollment_id', enr.id)
        enrExp.set('experience_id', pilotExp.id)
        enrExp.set('release_status', 'available')
        enrExp.set('progress_status', 'not_started')
        enrExp.set('current_step_order', 1)
        enrExp.set('released_by_user_id', profAUser ? profAUser.id : null)
        app.save(enrExp)
      }
    }
  },
  (app) => {},
)
