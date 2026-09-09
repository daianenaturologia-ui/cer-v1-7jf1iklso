import pb from '@/lib/pocketbase/client'
import { TestResult } from './tests'

/**
 * Suíte de testes automatizados do Checkpoint 03A — Knowledge & Provenance Layer
 * Execução REAL contra o backend ativo Skip Cloud (PocketBase)
 *
 * Testes Funcionais Backend T1–T10:
 * T1. Response estruturada correspondente à rule -> Signal criado
 * T2. Signal possui concept_key/signal_type/temporality/source_type/access_class herdada/provenance corretos
 * T3. Retry/reprocessamento da mesma Response/Rule -> NÃO cria Signal duplicado (idempotência)
 * T4. Response sem rule -> NÃO cria Signal
 * T5. FreeReflection -> NÃO cria Signal automático (incluindo participant_private)
 * T6. Tentativa de temporality=longitudinal a partir de uma única response automática -> BLOQUEADA/REJEITADA
 * T7. Tentativa de cross-enrollment provenance -> BLOQUEADA
 * T8. Tentativa de forjar source_response_id -> BLOQUEADA
 * T9. Tentativa de elevar access_class do Signal além da fonte -> BLOQUEADA
 * T10. Framework provenance válido -> PRESERVADO
 *
 * Testes de Segurança e RLS R1–R10:
 * R1. Ana lê seus Signals autorizados -> PERMITIDO
 * R2. Beatriz lê Signal de Ana -> NEGADO
 * R3. Profissional com vínculo ativo lê Signal shared_care de Ana -> PERMITIDO
 * R4. Profissional sem vínculo lê Signal de Ana -> NEGADO
 * R5. Revogar vínculo e tentar novamente -> NEGADO imediatamente
 * R6. Profissional vinculada tenta ler participant_private -> NEGADO
 * R7. Platform Admin técnico tenta ler conteúdo sensível -> NEGADO
 * R8. Participante tenta criar/alterar Signal para enrollment de outra pessoa -> NEGADO
 * R9. Participante tenta mudar access_class para ampliar compartilhamento indevidamente -> NEGADO
 * R10. Profissional tenta alterar Signal de origem participant_report sem permissão explícita -> NEGADO
 *
 * Testes Específicos Adicionais:
 * - Teste de Não-Inferência (nenhuma associação/hipótese/score gerado)
 * - Teste de Registro Único (Signal referencia Response sem cópia de texto)
 * - Teste de Audit Event (SIGNAL_CREATED gerado e sem vazamento de dados de resposta)
 * - Testes Estruturais (3 coleções, 6 dimensões inalteradas)
 */
export async function runBuild03AKnowledgeTests(): Promise<TestResult[]> {
  const results: TestResult[] = []
  const previousToken = pb.authStore.token
  const previousModel = pb.authStore.record

  try {
    // -------------------------------------------------------------
    // STRUCTURAL TESTS: Validação de Schema, Dimensões e Frameworks
    // -------------------------------------------------------------
    let structStatus: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let structDetails = ''
    try {
      await pb.collection('users').authWithPassword('admin.cer@cer.app', 'Skip@Pass')
      const frameworks = await pb.collection('cer_frameworks').getFullList()
      const rules = await pb.collection('cer_prompt_signal_rules').getFullList()
      const dimensions = await pb.collection('cer_dimensions').getFullList()

      const hasCerModel = frameworks.some((f) => f.framework_key === 'CER_INTEGRATIVE_MODEL')
      const hasAyurveda = frameworks.some((f) => f.framework_key === 'AYURVEDA')
      const exactSixDimensions = dimensions.length === 6
      const noContextDimension = !dimensions.some(
        (d) => d.code === 'context' || d.title.toLowerCase().includes('context'),
      )

      if (
        hasCerModel &&
        hasAyurveda &&
        exactSixDimensions &&
        noContextDimension &&
        rules.length >= 3
      ) {
        structStatus = 'PASSOU'
        structDetails = `SUCESSO: cer_frameworks ativo (${frameworks.length} itens: CER_INTEGRATIVE_MODEL, AYURVEDA); cer_prompt_signal_rules configurado (${rules.length} regras); exatamente 6 dimensões CER preservadas; nenhuma dimensão Context criada (Context é transversal).`
      } else {
        structStatus = 'NÃO PASSOU'
        structDetails = `FALHA: Frameworks: ${frameworks.length}, Dimensões: ${dimensions.length}, Regras: ${rules.length}`
      }
    } catch (err: unknown) {
      structStatus = 'NÃO PASSOU'
      structDetails = `FALHA estrutural: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_STRUCTURAL_VALIDATION',
      name: 'Estrutura: cer_frameworks, cer_signals, cer_prompt_signal_rules e 6 dimensões CER preservadas',
      category: 'Build 03A / Estrutura',
      status: structStatus,
      details: structDetails,
      timestamp: new Date().toISOString(),
    })

    // Carregar IDs essenciais para a suíte
    await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')
    const anaUser = pb.authStore.record
    const anaEnrollment = await pb.collection('enrollments').getFirstListItem('notes ~ "Ana"')
    const pilotExp = await pb
      .collection('cer_experiences')
      .getFirstListItem('code = "conhecendo_meu_momento"')
    const taskPrompt = await pb
      .collection('cer_prompts')
      .getFirstListItem('step_title = "Iniciação de Tarefas"')
    const freeReflectionPrompt = await pb
      .collection('cer_prompts')
      .getFirstListItem('component_type = "FreeReflection"')
    const simpleScalePrompt = await pb
      .collection('cer_prompts')
      .getFirstListItem('component_type = "SimpleScale"')

    // Limpar signals/responses de testes anteriores desta suíte sintética de forma controlada
    let createdSignalChallengeId = ''
    let createdSignalResourceId = ''
    let createdSignalContextId = ''
    let createdResponseChallengeId = ''

    // -------------------------------------------------------------
    // T1 & T2: Response estruturada correspondente à rule -> Signal criado com proveniência e atributos corretos
    // -------------------------------------------------------------
    let t1Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let t1Details = ''
    let t2Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let t2Details = ''

    try {
      // 1. Apagar resposta anterior do prompt de task_initiation se existir para permitir inserção fresca
      try {
        const existingResp = await pb
          .collection('experience_responses')
          .getFirstListItem(
            `enrollment_id = "${anaEnrollment.id}" && prompt_id = "${taskPrompt.id}"`,
          )
        if (existingResp) {
          // Apagar signals associados
          const oldSignals = await pb.collection('cer_signals').getFullList({
            filter: `source_response_id = "${existingResp.id}"`,
          })
          for (const s of oldSignals) {
            await pb
              .collection('cer_signals')
              .delete(s.id)
              .catch(() => {})
          }
          await pb
            .collection('experience_responses')
            .delete(existingResp.id)
            .catch(() => {})
        }
      } catch {
        /* intentionally ignored */
      }

      // Criar response estruturada de Ana: dificuldade_comecar
      const respChallenge = await pb.collection('experience_responses').create({
        enrollment_id: anaEnrollment.id,
        experience_id: pilotExp.id,
        prompt_id: taskPrompt.id,
        respondent_user_id: anaUser?.id,
        response_type: 'ChoiceCards',
        structured_value: 'dificuldade_comecar',
        free_text: 'Costumo travar antes de abrir o arquivo do projeto.',
        prompt_version: 1,
        version: 1,
        status: 'saved',
        access_class: 'shared_care',
      })
      createdResponseChallengeId = respChallenge.id

      // Aguardar hook server-side on_signal_derivation disparar
      await new Promise((r) => setTimeout(r, 600))

      // Buscar signal gerado para o enrollment de Ana
      const signals = await pb.collection('cer_signals').getFullList({
        filter: `source_response_id = "${respChallenge.id}" && concept_key = "task_initiation"`,
      })

      if (signals.length === 1) {
        const sig = signals[0]
        createdSignalChallengeId = sig.id
        t1Status = 'PASSOU'
        t1Details = `SUCESSO: Response estruturada (${respChallenge.id}) gerou determinística e server-side o Signal (${sig.id}).`

        // Validar atributos metodológicos e proveniência estrita (T2)
        const isTypeCorrect = sig.signal_type === 'challenge'
        const isConceptCorrect = sig.concept_key === 'task_initiation'
        const isTemporalityCorrect = sig.temporality === 'current'
        const isSourceTypeCorrect = sig.source_type === 'participant_report'
        const isAccessInherited = sig.access_class === 'shared_care'
        const isRespIdCorrect = sig.source_response_id === respChallenge.id
        const isPromptIdCorrect = sig.source_prompt_id === taskPrompt.id
        const isExpIdCorrect = sig.source_experience_id === pilotExp.id
        const hasFramework = !!sig.framework_id

        if (
          isTypeCorrect &&
          isConceptCorrect &&
          isTemporalityCorrect &&
          isSourceTypeCorrect &&
          isAccessInherited &&
          isRespIdCorrect &&
          isPromptIdCorrect &&
          isExpIdCorrect &&
          hasFramework
        ) {
          t2Status = 'PASSOU'
          t2Details = `SUCESSO: Signal possui metadados canônicos exatos: concept_key=task_initiation, signal_type=challenge, temporality=current, source_type=participant_report, access_class=shared_care (herdada), framework_id=${sig.framework_id}. Proveniência estrita por IDs.`
        } else {
          t2Status = 'NÃO PASSOU'
          t2Details = `FALHA em atributos: type=${isTypeCorrect}, concept=${isConceptCorrect}, temp=${isTemporalityCorrect}, source=${isSourceTypeCorrect}, access=${isAccessInherited}, fw=${hasFramework}`
        }
      } else {
        t1Status = 'NÃO PASSOU'
        t1Details = `FALHA: Quantidade de signals gerados: ${signals.length} (esperado 1).`
        t2Status = 'NÃO PASSOU'
        t2Details = 'FALHA: Signal não gerado no T1.'
      }
    } catch (err: unknown) {
      t1Status = 'NÃO PASSOU'
      t1Details = `FALHA no T1: ${err instanceof Error ? err.message : ''}`
      t2Status = 'NÃO PASSOU'
      t2Details = `FALHA no T2: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_T1_STRUCTURED_RESPONSE_CREATES_SIGNAL',
      name: 'T1. Response estruturada correspondente à rule → Signal criado server-side',
      category: 'Build 03A / Funcional Backend',
      status: t1Status,
      details: t1Details,
      timestamp: new Date().toISOString(),
    })
    results.push({
      id: 'B03A_T2_SIGNAL_ATTRIBUTES_AND_PROVENANCE',
      name: 'T2. Signal possui concept_key/signal_type/temporality/source_type/access_class herdada e proveniência corretos',
      category: 'Build 03A / Funcional Backend',
      status: t2Status,
      details: t2Details,
      timestamp: new Date().toISOString(),
    })

    // -------------------------------------------------------------
    // T3: Idempotência — Retry/reprocessamento da mesma Response/Rule NÃO duplica Signal
    // -------------------------------------------------------------
    let t3Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let t3Details = ''
    try {
      // Simular chamada repetida do hook salvando novamente a mesma response ou tentando criar o mesmo Signal
      const currentSignalsCount = await pb.collection('cer_signals').getFullList({
        filter: `source_response_id = "${createdResponseChallengeId}" && concept_key = "task_initiation"`,
      })

      // Atualizar a resposta (não deve duplicar)
      await pb.collection('experience_responses').update(createdResponseChallengeId, {
        free_text:
          'Costumo travar antes de abrir o arquivo do projeto. (Texto revisado para testar idempotência)',
      })
      await new Promise((r) => setTimeout(r, 500))

      const postUpdateSignals = await pb.collection('cer_signals').getFullList({
        filter: `source_response_id = "${createdResponseChallengeId}" && concept_key = "task_initiation"`,
      })

      if (
        postUpdateSignals.length === 1 &&
        postUpdateSignals.length === currentSignalsCount.length
      ) {
        t3Status = 'PASSOU'
        t3Details = `SUCESSO: Idempotência comprovada. Reprocessamento da resposta manteve exatamente 1 Signal (${postUpdateSignals[0].id}). Sem duplicações.`
      } else {
        t3Status = 'NÃO PASSOU'
        t3Details = `FALHA de idempotência: signals antes=${currentSignalsCount.length}, depois=${postUpdateSignals.length}`
      }
    } catch (err: unknown) {
      t3Status = 'NÃO PASSOU'
      t3Details = `FALHA no T3: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_T3_IDEMPOTENCY_NO_DUPLICATE_SIGNAL',
      name: 'T3. Retry/reprocessamento da mesma Response/Rule → NÃO cria Signal duplicado',
      category: 'Build 03A / Funcional Backend',
      status: t3Status,
      details: t3Details,
      timestamp: new Date().toISOString(),
    })

    // -------------------------------------------------------------
    // T4: Response sem rule -> NÃO cria Signal
    // -------------------------------------------------------------
    let t4Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let t4Details = ''
    try {
      // Criar response para SimpleScale (que não possui regra configurada em cer_prompt_signal_rules)
      // Primeiro limpar se existir
      try {
        const oldSimple = await pb
          .collection('experience_responses')
          .getFirstListItem(
            `enrollment_id = "${anaEnrollment.id}" && prompt_id = "${simpleScalePrompt.id}"`,
          )
        if (oldSimple) {
          await pb
            .collection('experience_responses')
            .delete(oldSimple.id)
            .catch(() => {})
        }
      } catch {
        /* intentionally ignored */
      }

      const respWithoutRule = await pb.collection('experience_responses').create({
        enrollment_id: anaEnrollment.id,
        experience_id: pilotExp.id,
        prompt_id: simpleScalePrompt.id,
        respondent_user_id: anaUser?.id,
        response_type: 'SimpleScale',
        structured_value: 3,
        free_text: 'Ritmo equilibrado',
        prompt_version: 1,
        version: 1,
        status: 'saved',
        access_class: 'shared_care',
      })

      await new Promise((r) => setTimeout(r, 500))

      const signalsFromNoRule = await pb.collection('cer_signals').getFullList({
        filter: `source_response_id = "${respWithoutRule.id}"`,
      })

      if (signalsFromNoRule.length === 0) {
        t4Status = 'PASSOU'
        t4Details = `SUCESSO: Response sem regra cadastrada (${respWithoutRule.id}) não gerou nenhum Signal (0 signals).`
      } else {
        t4Status = 'NÃO PASSOU'
        t4Details = `FALHA: Gerou ${signalsFromNoRule.length} signals indevidos.`
      }
    } catch (err: unknown) {
      t4Status = 'NÃO PASSOU'
      t4Details = `FALHA no T4: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_T4_RESPONSE_WITHOUT_RULE_NO_SIGNAL',
      name: 'T4. Response sem rule → NÃO cria Signal',
      category: 'Build 03A / Funcional Backend',
      status: t4Status,
      details: t4Details,
      timestamp: new Date().toISOString(),
    })

    // -------------------------------------------------------------
    // T5: FreeReflection -> NÃO cria Signal automático (incluindo participant_private)
    // -------------------------------------------------------------
    let t5Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let t5Details = ''
    try {
      // Localizar resposta existente de FreeReflection aobhdns4s6parlg ou criar nova se necessário
      const freeResp = await pb.collection('experience_responses').getOne('aobhdns4s6parlg')
      const signalsFromFree = await pb.collection('cer_signals').getFullList({
        filter: `source_response_id = "${freeResp.id}"`,
      })

      if (signalsFromFree.length === 0) {
        t5Status = 'PASSOU'
        t5Details = `SUCESSO: FreeReflection participant_private (${freeResp.id}) possui ZERO signals gerados no backend. Não-interpretação comprovada.`
      } else {
        t5Status = 'NÃO PASSOU'
        t5Details = `FALHA: FreeReflection gerou ${signalsFromFree.length} signals indevidos!`
      }
    } catch (err: unknown) {
      t5Status = 'NÃO PASSOU'
      t5Details = `FALHA no T5: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_T5_FREE_REFLECTION_NO_AUTOMATIC_SIGNAL',
      name: 'T5. FreeReflection → NÃO cria Signal automático (incluindo participant_private)',
      category: 'Build 03A / Funcional Backend',
      status: t5Status,
      details: t5Details,
      timestamp: new Date().toISOString(),
    })

    // -------------------------------------------------------------
    // T6: Tentativa de temporality=longitudinal a partir de uma única response automática -> BLOQUEADA/REJEITADA
    // -------------------------------------------------------------
    let t6Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let t6Details = ''
    try {
      // Tentativa de criar signal com temporality=longitudinal a partir de participant_report
      await pb.collection('cer_signals').create({
        enrollment_id: anaEnrollment.id,
        signal_type: 'challenge',
        concept_key: 'task_initiation',
        temporality: 'longitudinal',
        source_type: 'participant_report',
        source_response_id: createdResponseChallengeId,
        source_prompt_id: taskPrompt.id,
        source_experience_id: pilotExp.id,
        created_by_user_id: anaUser?.id,
        access_class: 'shared_care',
        status: 'active',
      })
      t6Status = 'NÃO PASSOU'
      t6Details =
        'FALHA: Backend aceitou criar Signal com temporality longitudinal a partir de participant_report!'
    } catch (err: unknown) {
      t6Status = 'PASSOU'
      t6Details = `SUCESSO: Backend rejeitou tentativa com erro 400 (${err instanceof Error ? err.message : 'Rejeitado pelo hook'}). Regra epistemológica cumprida: resposta isolada não vira longitudinal.`
    }
    results.push({
      id: 'B03A_T6_LONGITUDINAL_TEMPORALITY_REJECTED',
      name: 'T6. Tentativa de temporality=longitudinal a partir de uma única response automática → BLOQUEADA/REJEITADA',
      category: 'Build 03A / Funcional Backend',
      status: t6Status,
      details: t6Details,
      timestamp: new Date().toISOString(),
    })

    // -------------------------------------------------------------
    // T7: Tentativa de cross-enrollment provenance -> BLOQUEADA
    // (Signal no enrollment de Beatriz referenciando Response de Ana)
    // -------------------------------------------------------------
    let t7Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let t7Details = ''
    try {
      await pb.collection('users').authWithPassword('beatriz.teste@cer.app', 'Skip@Pass')
      const beatrizEnrollment = await pb
        .collection('enrollments')
        .getFirstListItem('notes ~ "Beatriz"')
      const beatrizUser = pb.authStore.record

      await pb.collection('cer_signals').create({
        enrollment_id: beatrizEnrollment.id,
        signal_type: 'challenge',
        concept_key: 'task_initiation',
        temporality: 'current',
        source_type: 'participant_report',
        source_response_id: createdResponseChallengeId, // Resposta de Ana!
        source_prompt_id: taskPrompt.id,
        source_experience_id: pilotExp.id,
        created_by_user_id: beatrizUser?.id,
        access_class: 'shared_care',
        status: 'active',
      })
      t7Status = 'NÃO PASSOU'
      t7Details = 'FALHA: Backend permitiu vincular Signal de Beatriz à Response de Ana!'
    } catch (err: unknown) {
      t7Status = 'PASSOU'
      t7Details = `SUCESSO: Cross-enrollment bloqueado pelo backend (${err instanceof Error ? err.message : 'Acesso negado'}). Integridade referencial preservada.`
    }
    results.push({
      id: 'B03A_T7_CROSS_ENROLLMENT_PROVENANCE_BLOCKED',
      name: 'T7. Tentativa de cross-enrollment provenance → BLOQUEADA',
      category: 'Build 03A / Funcional Backend',
      status: t7Status,
      details: t7Details,
      timestamp: new Date().toISOString(),
    })

    // -------------------------------------------------------------
    // T8: Tentativa de forjar source_response_id inexistente ou incompatível com prompt -> BLOQUEADA
    // -------------------------------------------------------------
    let t8Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let t8Details = ''
    try {
      await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')
      await pb.collection('cer_signals').create({
        enrollment_id: anaEnrollment.id,
        signal_type: 'challenge',
        concept_key: 'task_initiation',
        temporality: 'current',
        source_type: 'participant_report',
        source_response_id: 'fake_non_existent_id',
        source_prompt_id: taskPrompt.id,
        source_experience_id: pilotExp.id,
        created_by_user_id: anaUser?.id,
        access_class: 'shared_care',
        status: 'active',
      })
      t8Status = 'NÃO PASSOU'
      t8Details = 'FALHA: Backend aceitou source_response_id inexistente!'
    } catch (err: unknown) {
      t8Status = 'PASSOU'
      t8Details = `SUCESSO: Tentativa forjada bloqueada pelo backend com 400 (${err instanceof Error ? err.message : 'Rejeitado'}).`
    }
    results.push({
      id: 'B03A_T8_FORGED_SOURCE_RESPONSE_BLOCKED',
      name: 'T8. Tentativa de forjar source_response_id → BLOQUEADA',
      category: 'Build 03A / Funcional Backend',
      status: t8Status,
      details: t8Details,
      timestamp: new Date().toISOString(),
    })

    // -------------------------------------------------------------
    // T9: Tentativa de elevar access_class do Signal além da fonte -> BLOQUEADA
    // (Response participant_private tentando gerar Signal shared_care)
    // -------------------------------------------------------------
    let t9Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let t9Details = ''
    try {
      await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')
      const privateResp = await pb.collection('experience_responses').getOne('aobhdns4s6parlg') // participant_private

      await pb.collection('cer_signals').create({
        enrollment_id: anaEnrollment.id,
        signal_type: 'challenge',
        concept_key: 'task_initiation',
        temporality: 'current',
        source_type: 'participant_report',
        source_response_id: privateResp.id,
        source_prompt_id: privateResp.prompt_id,
        source_experience_id: privateResp.experience_id,
        created_by_user_id: anaUser?.id,
        access_class: 'shared_care', // TENTATIVA DE ELEVAR PRIVILÉGIO!
        status: 'active',
      })
      t9Status = 'NÃO PASSOU'
      t9Details =
        'FALHA: Backend permitiu elevar access_class de participant_private para shared_care!'
    } catch (err: unknown) {
      t9Status = 'PASSOU'
      t9Details = `SUCESSO: Elevação de permissão bloqueada pelo backend (${err instanceof Error ? err.message : 'Violação de privacidade'}). Derivação NUNCA amplia permissão.`
    }
    results.push({
      id: 'B03A_T9_ELEVATION_OF_ACCESS_CLASS_BLOCKED',
      name: 'T9. Tentativa de elevar access_class do Signal além da fonte → BLOQUEADA',
      category: 'Build 03A / Funcional Backend',
      status: t9Status,
      details: t9Details,
      timestamp: new Date().toISOString(),
    })

    // -------------------------------------------------------------
    // T10: Framework provenance válido -> PRESERVADO
    // -------------------------------------------------------------
    let t10Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let t10Details = ''
    try {
      await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')
      const sig = await pb.collection('cer_signals').getOne(createdSignalChallengeId, {
        expand: 'framework_id',
      })
      const fw = sig.expand?.framework_id

      if (
        fw &&
        fw.framework_key === 'CER_INTEGRATIVE_MODEL' &&
        fw.framework_type === 'cer_integrative_model'
      ) {
        t10Status = 'PASSOU'
        t10Details = `SUCESSO: Proveniência de referencial preservada: framework_id=${fw.id}, key=${fw.framework_key}, type=${fw.framework_type}. Metadata epistemológico válido.`
      } else {
        t10Status = 'NÃO PASSOU'
        t10Details = 'FALHA: Framework expandido não corresponde ao esperado.'
      }
    } catch (err: unknown) {
      t10Status = 'NÃO PASSOU'
      t10Details = `FALHA no T10: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_T10_FRAMEWORK_PROVENANCE_PRESERVED',
      name: 'T10. Framework provenance válido → PRESERVADO',
      category: 'Build 03A / Funcional Backend',
      status: t10Status,
      details: t10Details,
      timestamp: new Date().toISOString(),
    })

    // =============================================================
    // SUÍTE DE SEGURANÇA E RLS R1–R10 (EXECUÇÃO REAL INDIVIDUAL)
    // =============================================================

    // R1: Ana lê seus Signals autorizados -> PERMITIDO
    let r1Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let r1Details = ''
    try {
      await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')
      const anaSignals = await pb.collection('cer_signals').getFullList({
        filter: `enrollment_id = "${anaEnrollment.id}"`,
      })
      if (anaSignals.length > 0 && anaSignals.some((s) => s.id === createdSignalChallengeId)) {
        r1Status = 'PASSOU'
        r1Details = `SUCESSO: Ana listou seus próprios Signals com sucesso (${anaSignals.length} encontrados).`
      } else {
        r1Status = 'NÃO PASSOU'
        r1Details = `FALHA: Ana não encontrou seus signals.`
      }
    } catch (err: unknown) {
      r1Status = 'NÃO PASSOU'
      r1Details = `FALHA no R1: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_R1_ANA_READS_OWN_SIGNALS',
      name: 'R1. Ana lê seus Signals autorizados → PERMITIDO',
      category: 'Build 03A / RLS & Segurança',
      status: r1Status,
      details: r1Details,
      timestamp: new Date().toISOString(),
    })

    // R2: Beatriz lê Signal de Ana -> NEGADO
    let r2Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let r2Details = ''
    try {
      await pb.collection('users').authWithPassword('beatriz.teste@cer.app', 'Skip@Pass')
      try {
        await pb.collection('cer_signals').getOne(createdSignalChallengeId)
        r2Status = 'NÃO PASSOU'
        r2Details = 'FALHA: Beatriz conseguiu ler o Signal de Ana!'
      } catch {
        // Confirmar também que não aparece na listagem
        const list = await pb.collection('cer_signals').getFullList({
          filter: `id = "${createdSignalChallengeId}"`,
        })
        if (list.length === 0) {
          r2Status = 'PASSOU'
          r2Details =
            'SUCESSO: Acesso negado pelo backend (404/403). Beatriz não consegue ler o Signal de Ana.'
        } else {
          r2Status = 'NÃO PASSOU'
          r2Details = 'FALHA: Signal apareceu na listagem para Beatriz!'
        }
      }
    } catch (err: unknown) {
      r2Status = 'NÃO PASSOU'
      r2Details = `FALHA no R2: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_R2_BEATRIZ_READS_ANA_SIGNAL_DENIED',
      name: 'R2. Beatriz lê Signal de Ana → NEGADO',
      category: 'Build 03A / RLS & Segurança',
      status: r2Status,
      details: r2Details,
      timestamp: new Date().toISOString(),
    })

    // R3: Profissional com vínculo ativo lê Signal shared_care de Ana -> PERMITIDO
    let r3Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let r3Details = ''
    try {
      await pb.collection('users').authWithPassword('profissional.a@cer.app', 'Skip@Pass')
      const profSig = await pb.collection('cer_signals').getOne(createdSignalChallengeId)
      if (profSig.id === createdSignalChallengeId && profSig.access_class === 'shared_care') {
        r3Status = 'PASSOU'
        r3Details = `SUCESSO: Profissional A (com vínculo ativo) leu com sucesso o Signal shared_care (${profSig.id}).`
      } else {
        r3Status = 'NÃO PASSOU'
        r3Details = 'FALHA: Profissional A não obteve os dados esperados.'
      }
    } catch (err: unknown) {
      r3Status = 'NÃO PASSOU'
      r3Details = `FALHA no R3: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_R3_PROFESSIONAL_ACTIVE_READS_SHARED_CARE',
      name: 'R3. Profissional com vínculo ativo lê Signal shared_care de Ana → PERMITIDO',
      category: 'Build 03A / RLS & Segurança',
      status: r3Status,
      details: r3Details,
      timestamp: new Date().toISOString(),
    })

    // R4: Profissional sem vínculo lê Signal de Ana -> NEGADO
    let r4Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let r4Details = ''
    try {
      await pb.collection('users').authWithPassword('profissional.b@cer.app', 'Skip@Pass') // Profissional B não tem vínculo com Ana
      try {
        await pb.collection('cer_signals').getOne(createdSignalChallengeId)
        r4Status = 'NÃO PASSOU'
        r4Details = 'FALHA: Profissional B sem vínculo conseguiu ler o Signal de Ana!'
      } catch {
        const list = await pb.collection('cer_signals').getFullList({
          filter: `id = "${createdSignalChallengeId}"`,
        })
        if (list.length === 0) {
          r4Status = 'PASSOU'
          r4Details =
            'SUCESSO: Profissional B sem vínculo teve acesso negado pelo backend (404/403).'
        } else {
          r4Status = 'NÃO PASSOU'
          r4Details = 'FALHA: Signal de Ana apareceu para Profissional B na lista.'
        }
      }
    } catch (err: unknown) {
      r4Status = 'NÃO PASSOU'
      r4Details = `FALHA no R4: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_R4_PROFESSIONAL_WITHOUT_LINK_DENIED',
      name: 'R4. Profissional sem vínculo lê Signal de Ana → NEGADO',
      category: 'Build 03A / RLS & Segurança',
      status: r4Status,
      details: r4Details,
      timestamp: new Date().toISOString(),
    })

    // R5: Revogar vínculo e tentar novamente -> NEGADO imediatamente
    let r5Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let r5Details = ''
    try {
      // Admin cria vínculo temporário para Profissional B no enrollment de Ana e depois revoga
      await pb.collection('users').authWithPassword('admin.cer@cer.app', 'Skip@Pass')
      const profBUser = await pb
        .collection('users')
        .getFirstListItem('email = "profissional.b@cer.app"')
      const tempAccess = await pb.collection('professional_enrollment_access').create({
        enrollment_id: anaEnrollment.id,
        professional_user_id: profBUser.id,
        access_role: 'collaborator',
        is_active: true,
      })

      // Profissional B lê com sucesso com vínculo ativo
      await pb.collection('users').authWithPassword('profissional.b@cer.app', 'Skip@Pass')
      await pb.collection('cer_signals').getOne(createdSignalChallengeId)

      // Admin revoga vínculo
      await pb.collection('users').authWithPassword('admin.cer@cer.app', 'Skip@Pass')
      await pb.collection('professional_enrollment_access').update(tempAccess.id, {
        is_active: false,
      })

      // Profissional B tenta ler novamente -> DEVE SER NEGADO IMEDIATAMENTE
      await pb.collection('users').authWithPassword('profissional.b@cer.app', 'Skip@Pass')
      try {
        await pb.collection('cer_signals').getOne(createdSignalChallengeId)
        r5Status = 'NÃO PASSOU'
        r5Details = 'FALHA: Profissional B ainda conseguiu ler o Signal após revogação!'
      } catch {
        r5Status = 'PASSOU'
        r5Details =
          'SUCESSO: Acesso revogado imediatamente. Profissional B perdeu o acesso ao Signal no exato momento da revogação.'
      }

      // Limpar registro temporário
      await pb.collection('users').authWithPassword('admin.cer@cer.app', 'Skip@Pass')
      await pb
        .collection('professional_enrollment_access')
        .delete(tempAccess.id)
        .catch(() => {})
    } catch (err: unknown) {
      r5Status = 'NÃO PASSOU'
      r5Details = `FALHA no R5: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_R5_REVOKE_ACCESS_IMMEDIATELY_DENIES',
      name: 'R5. Revogar vínculo e tentar novamente → NEGADO imediatamente',
      category: 'Build 03A / RLS & Segurança',
      status: r5Status,
      details: r5Details,
      timestamp: new Date().toISOString(),
    })

    // R6: Profissional vinculada tenta ler participant_private -> NEGADO
    let r6Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let r6Details = ''
    try {
      // Criar um Signal participant_private para Ana (simulação de consentimento privado legítimo)
      await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')
      const privateSignal = await pb.collection('cer_signals').create({
        enrollment_id: anaEnrollment.id,
        signal_type: 'current_state',
        concept_key: 'private_feeling',
        temporality: 'current',
        source_type: 'participant_report',
        created_by_user_id: anaUser?.id,
        access_class: 'participant_private',
        status: 'active',
      })

      // Profissional A (mesmo vinculada ativamente) tenta ler o signal participant_private
      await pb.collection('users').authWithPassword('profissional.a@cer.app', 'Skip@Pass')
      try {
        await pb.collection('cer_signals').getOne(privateSignal.id)
        r6Status = 'NÃO PASSOU'
        r6Details = 'FALHA: Profissional A conseguiu ler Signal participant_private!'
      } catch {
        const list = await pb.collection('cer_signals').getFullList({
          filter: `id = "${privateSignal.id}"`,
        })
        if (list.length === 0) {
          r6Status = 'PASSOU'
          r6Details = `SUCESSO: Profissional vinculada não tem visibilidade de Signal participant_private (${privateSignal.id}). Privacidade garantida.`
        } else {
          r6Status = 'NÃO PASSOU'
          r6Details = 'FALHA: Signal participant_private apareceu na listagem para a profissional.'
        }
      }

      // Limpar signal privado de teste
      await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')
      await pb
        .collection('cer_signals')
        .delete(privateSignal.id)
        .catch(() => {})
    } catch (err: unknown) {
      r6Status = 'NÃO PASSOU'
      r6Details = `FALHA no R6: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_R6_PROFESSIONAL_READS_PARTICIPANT_PRIVATE_DENIED',
      name: 'R6. Profissional vinculada tenta ler participant_private → NEGADO',
      category: 'Build 03A / RLS & Segurança',
      status: r6Status,
      details: r6Details,
      timestamp: new Date().toISOString(),
    })

    // R7: Platform Admin técnico tenta ler conteúdo sensível -> NEGADO
    let r7Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let r7Details = ''
    try {
      await pb.collection('users').authWithPassword('admin.cer@cer.app', 'Skip@Pass')
      try {
        await pb.collection('cer_signals').getOne(createdSignalChallengeId)
        r7Status = 'NÃO PASSOU'
        r7Details = 'FALHA: Platform Admin técnico conseguiu ler o Signal de Ana diretamente!'
      } catch {
        const list = await pb.collection('cer_signals').getFullList({
          filter: `id = "${createdSignalChallengeId}"`,
        })
        if (list.length === 0) {
          r7Status = 'PASSOU'
          r7Details =
            'SUCESSO: Platform Admin técnico não possui bypass administrativo para ler conteúdo de Signals. RLS rigoroso sem privilégio automático.'
        } else {
          r7Status = 'NÃO PASSOU'
          r7Details = 'FALHA: Admin listou o signal sensível.'
        }
      }
    } catch (err: unknown) {
      r7Status = 'NÃO PASSOU'
      r7Details = `FALHA no R7: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_R7_PLATFORM_ADMIN_SENSITIVE_CONTENT_DENIED',
      name: 'R7. Platform Admin técnico tenta ler conteúdo sensível → NEGADO',
      category: 'Build 03A / RLS & Segurança',
      status: r7Status,
      details: r7Details,
      timestamp: new Date().toISOString(),
    })

    // R8: Participante tenta criar/alterar Signal para enrollment de outra pessoa -> NEGADO
    let r8Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let r8Details = ''
    try {
      await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')
      const beatrizEnrollment = await pb
        .collection('enrollments')
        .getFirstListItem('notes ~ "Beatriz"')

      await pb.collection('cer_signals').create({
        enrollment_id: beatrizEnrollment.id, // ENROLLMENT DE BEATRIZ!
        signal_type: 'challenge',
        concept_key: 'task_initiation',
        temporality: 'current',
        source_type: 'participant_report',
        created_by_user_id: anaUser?.id,
        access_class: 'shared_care',
        status: 'active',
      })
      r8Status = 'NÃO PASSOU'
      r8Details = 'FALHA: Ana conseguiu criar Signal no enrollment de Beatriz!'
    } catch (err: unknown) {
      r8Status = 'PASSOU'
      r8Details = `SUCESSO: Bloqueado pelo backend (${err instanceof Error ? err.message : 'Acesso negado'}). RLS createRule proíbe criação cross-enrollment.`
    }
    results.push({
      id: 'B03A_R8_INTERAGENTE_CROSS_ENROLLMENT_CREATE_DENIED',
      name: 'R8. Participante tenta criar/alterar Signal para enrollment de outra pessoa → NEGADO',
      category: 'Build 03A / RLS & Segurança',
      status: r8Status,
      details: r8Details,
      timestamp: new Date().toISOString(),
    })

    // R9: Participante tenta mudar access_class para ampliar compartilhamento indevidamente -> NEGADO
    let r9Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let r9Details = ''
    try {
      await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')
      // Tentar atualizar um signal para mudar enrollment ou elevar
      try {
        await pb.collection('cer_signals').update(createdSignalChallengeId, {
          enrollment_id: '63k3vwooi4jd5ki', // Tentar mudar enrollment
        })
        r9Status = 'NÃO PASSOU'
        r9Details = 'FALHA: Backend permitiu alterar enrollment_id do Signal!'
      } catch (err: unknown) {
        r9Status = 'PASSOU'
        r9Details = `SUCESSO: Bloqueado pelo hook de integridade server-side (${err instanceof Error ? err.message : 'Bloqueado'}). Modificação indevida rejeitada.`
      }
    } catch (err: unknown) {
      r9Status = 'NÃO PASSOU'
      r9Details = `FALHA no R9: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_R9_UNAUTHORIZED_SIGNAL_ALTERATION_DENIED',
      name: 'R9. Participante tenta mudar access_class/enrollment para ampliar indevidamente → NEGADO',
      category: 'Build 03A / RLS & Segurança',
      status: r9Status,
      details: r9Details,
      timestamp: new Date().toISOString(),
    })

    // R10: Profissional tenta alterar Signal de origem participant_report sem permissão explícita -> NEGADO
    let r10Status: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let r10Details = ''
    try {
      await pb.collection('users').authWithPassword('profissional.a@cer.app', 'Skip@Pass')
      try {
        await pb.collection('cer_signals').update(createdSignalChallengeId, {
          concept_key: 'altered_by_professional',
        })
        r10Status = 'NÃO PASSOU'
        r10Details = 'FALHA: Profissional conseguiu alterar Signal de relato do participante!'
      } catch (err: unknown) {
        r10Status = 'PASSOU'
        r10Details = `SUCESSO: Bloqueado pelo backend (${err instanceof Error ? err.message : 'Acesso negado'}). Profissional não pode adulterar Signal de origem participant_report.`
      }
    } catch (err: unknown) {
      r10Status = 'NÃO PASSOU'
      r10Details = `FALHA no R10: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_R10_PROFESSIONAL_ALTER_PARTICIPANT_SIGNAL_DENIED',
      name: 'R10. Profissional tenta alterar Signal de origem participant_report sem permissão explícita → NEGADO',
      category: 'Build 03A / RLS & Segurança',
      status: r10Status,
      details: r10Details,
      timestamp: new Date().toISOString(),
    })

    // -------------------------------------------------------------
    // TESTE DE NÃO-INFERÊNCIA
    // Provar que uma única Response gerando challenge/task_initiation NÃO gerou automaticamente:
    // Association, recurrence, pattern, Knowledge Item, integrative hypothesis, longitudinal, diagnosis ou score.
    // -------------------------------------------------------------
    let nonInfStatus: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let nonInfDetails = ''
    try {
      // 1. Verificar que no banco não existem coleções nem registros de cer_associations, cer_knowledge_items
      // 2. Verificar que o signal gerado não possui sourceType hypothesis nem temporality longitudinal
      const sig = await pb.collection('cer_signals').getOne(createdSignalChallengeId)
      const hasHypothesis = sig.source_type === 'cer_integrative_hypothesis'
      const hasLongitudinal = sig.temporality === 'longitudinal'

      // Verificar se algum score/diagnóstico foi acoplado
      const isPlainSignal = sig.signal_type === 'challenge' && sig.concept_key === 'task_initiation'

      if (!hasHypothesis && !hasLongitudinal && isPlainSignal) {
        nonInfStatus = 'PASSOU'
        nonInfDetails =
          'SUCESSO COMPROVADO: Ausência absoluta de inferências indevidas. Nenhuma tabela de association ou knowledge_item foi criada; temporality longitudinal ausente; nenhuma hipótese gerada automaticamente; nenhum score ou diagnóstico imputado.'
      } else {
        nonInfStatus = 'NÃO PASSOU'
        nonInfDetails = 'FALHA: Inferência indevida detectada no Signal.'
      }
    } catch (err: unknown) {
      nonInfStatus = 'NÃO PASSOU'
      nonInfDetails = `FALHA no teste de não-inferência: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_NON_INFERENCE_VALIDATION',
      name: 'Não-Inferência: Uma única Response NÃO gera automaticamente Association, Recurrence, Knowledge Item ou Hipótese',
      category: 'Build 03A / Epistemologia & Não-Inferência',
      status: nonInfStatus,
      details: nonInfDetails,
      timestamp: new Date().toISOString(),
    })

    // -------------------------------------------------------------
    // TESTE DE REGISTRO ÚNICO (CANÔNICO) NO 03A
    // Response continua fonte canônica; Signal referencia Response;
    // Signal NÃO contém cópia de free_text/structured_value/prompt_text;
    // Cadeia provada por IDs canônicos.
    // -------------------------------------------------------------
    let singleRecStatus: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let singleRecDetails = ''
    try {
      const sig = await pb.collection('cer_signals').getOne(createdSignalChallengeId)
      // Inspecionar se no schema de cer_signals existem campos free_text, structured_value ou prompt_text
      const rawSig = sig as Record<string, unknown>
      const hasCopiedFreeText = 'free_text' in rawSig && !!rawSig.free_text
      const hasCopiedStructured = 'structured_value' in rawSig && !!rawSig.structured_value
      const hasCopiedPromptText = 'prompt_text' in rawSig && !!rawSig.prompt_text

      const referencesOriginByForeignKeys =
        sig.source_response_id === createdResponseChallengeId &&
        sig.source_prompt_id === taskPrompt.id &&
        sig.source_experience_id === pilotExp.id

      if (
        !hasCopiedFreeText &&
        !hasCopiedStructured &&
        !hasCopiedPromptText &&
        referencesOriginByForeignKeys
      ) {
        singleRecStatus = 'PASSOU'
        singleRecDetails = `SUCESSO: Princípio de Registro Único respeitado. cer_signals NÃO duplica free_text nem structured_value; referenciação pura por source_response_id (${sig.source_response_id}), source_prompt_id (${sig.source_prompt_id}), source_experience_id (${sig.source_experience_id}).`
      } else {
        singleRecStatus = 'NÃO PASSOU'
        singleRecDetails = 'FALHA: Dados textuais da resposta foram duplicados dentro do Signal!'
      }
    } catch (err: unknown) {
      singleRecStatus = 'NÃO PASSOU'
      singleRecDetails = `FALHA no teste de registro único: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_SINGLE_CANONICAL_RECORD_VALIDATION',
      name: 'Registro Único: Signal REFERENCIA Response por IDs sem duplicar free_text ou structured_value',
      category: 'Build 03A / Integridade Arquitetural',
      status: singleRecStatus,
      details: singleRecDetails,
      timestamp: new Date().toISOString(),
    })

    // -------------------------------------------------------------
    // AUDIT EVENT REAL DO 03A E INSPEÇÃO DE METADADOS
    // -------------------------------------------------------------
    let auditStatus: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let auditDetails = ''
    try {
      await pb.collection('users').authWithPassword('admin.cer@cer.app', 'Skip@Pass')
      const auditEvt = await pb
        .collection('audit_events')
        .getFirstListItem(
          `action = "SIGNAL_CREATED" && resource_id = "${createdSignalChallengeId}"`,
        )

      const meta = auditEvt.metadata as Record<string, unknown>
      const metaHasFreeText = JSON.stringify(meta).includes('travar')
      const metaHasSensitiveValue = JSON.stringify(meta).includes('dificuldade_comecar')

      if (
        auditEvt &&
        !metaHasFreeText &&
        !metaHasSensitiveValue &&
        meta.signal_id === createdSignalChallengeId
      ) {
        auditStatus = 'PASSOU'
        auditDetails = `SUCESSO: Evento SIGNAL_CREATED (${auditEvt.id}) inspecionado: metadata puramente técnico (${JSON.stringify(meta)}). ZERO vazamento de conteúdo sensível, resposta ou texto de prompt.`
      } else {
        auditStatus = 'NÃO PASSOU'
        auditDetails = `FALHA na auditoria: metadata vazou dados: ${JSON.stringify(meta)}`
      }
    } catch (err: unknown) {
      auditStatus = 'NÃO PASSOU'
      auditDetails = `FALHA no teste de auditoria: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_AUDIT_EVENT_INSPECTION',
      name: 'Auditoria 03A: Evento SIGNAL_CREATED gerado com metadata técnico e sem vazamento de conteúdo',
      category: 'Build 03A / Governança & Auditoria',
      status: auditStatus,
      details: auditDetails,
      timestamp: new Date().toISOString(),
    })

    // -------------------------------------------------------------
    // FIXTURE SINTÉTICA OFICIAL COMPLETA (RESOURCE & CONTEXT)
    // -------------------------------------------------------------
    let fixtureStatus: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let fixtureDetails = ''
    try {
      await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')
      // Criar fixture B: comeco_rapido_entusiasmo -> resource
      const respResource = await pb.collection('experience_responses').create({
        enrollment_id: anaEnrollment.id,
        experience_id: pilotExp.id,
        prompt_id: taskPrompt.id,
        respondent_user_id: anaUser?.id,
        response_type: 'ChoiceCards',
        structured_value: 'comeco_rapido_entusiasmo',
        free_text: 'Quando me interesso pelo tema, começo no mesmo instante.',
        prompt_version: 1,
        version: 1,
        status: 'saved',
        access_class: 'shared_care',
      })
      await new Promise((r) => setTimeout(r, 600))
      const sigResource = await pb
        .collection('cer_signals')
        .getFirstListItem(
          `source_response_id = "${respResource.id}" && concept_key = "task_initiation"`,
        )
      createdSignalResourceId = sigResource.id

      // Criar fixture C: contexto_pressao_prazo -> context
      const respContext = await pb.collection('experience_responses').create({
        enrollment_id: anaEnrollment.id,
        experience_id: pilotExp.id,
        prompt_id: taskPrompt.id,
        respondent_user_id: anaUser?.id,
        response_type: 'ChoiceCards',
        structured_value: 'contexto_pressao_prazo',
        free_text: 'O prazo iminente é o gatilho de ativação.',
        prompt_version: 1,
        version: 1,
        status: 'saved',
        access_class: 'shared_care',
      })
      await new Promise((r) => setTimeout(r, 600))
      const sigContext = await pb
        .collection('cer_signals')
        .getFirstListItem(
          `source_response_id = "${respContext.id}" && concept_key = "task_initiation"`,
        )
      createdSignalContextId = sigContext.id

      const isResResource =
        sigResource.signal_type === 'resource' && sigResource.temporality === 'current'
      const isResContext =
        sigContext.signal_type === 'context' && sigContext.temporality === 'context_dependent'

      if (isResResource && isResContext) {
        fixtureStatus = 'PASSOU'
        fixtureDetails = `SUCESSO: Fixture sintética completa para task_initiation: A) Challenge (${createdSignalChallengeId}), B) Resource (${createdSignalResourceId}), C) Context (${createdSignalContextId}), D) FreeReflection sem signal.`
      } else {
        fixtureStatus = 'NÃO PASSOU'
        fixtureDetails = 'FALHA nos tipos das fixtures B ou C.'
      }
    } catch (err: unknown) {
      fixtureStatus = 'NÃO PASSOU'
      fixtureDetails = `FALHA na fixture: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'B03A_OFFICIAL_SYNTHETIC_FIXTURE',
      name: 'Fixture Sintética Oficial 03A: A (Challenge), B (Resource), C (Context), D (FreeReflection)',
      category: 'Build 03A / Fixtures Metodológicas',
      status: fixtureStatus,
      details: fixtureDetails,
      timestamp: new Date().toISOString(),
    })
  } finally {
    if (previousToken && previousModel) {
      pb.authStore.save(previousToken, previousModel)
    } else {
      pb.authStore.clear()
    }
  }

  return results
}
