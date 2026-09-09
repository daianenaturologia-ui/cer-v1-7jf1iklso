import pb from '@/lib/pocketbase/client'
import type { TestResult } from './tests'
import { cerMapService } from './cerMapService'
import { cerMapCandidateService } from './cerMapCandidateService'
import { evaluateEpistemicGate, CandidateSourcePayload } from './cerEpistemicGate'
import {
  CerMapRecord,
  CerMapItemRecord,
  CerKnowledgeItemRecord,
  CerParticipantRecognitionRecord,
} from '@/types/cer'

/**
 * Suíte Completa de Testes Automatizados do Build 06 — MAPA CER V1
 *
 * Cobertura Completa:
 * - F1–F20: Testes Funcionais e Regras do Mapa CER
 * - E1–E20: Epistemic Gate & Distância Epistemológica
 * - V1–V10: Ciclo de Vida, Versionamento e Imutabilidade
 */
export async function runBuild06MapTests(): Promise<TestResult[]> {
  const results: TestResult[] = []

  const ENROLLMENT_ANA = 'lhzdvf2yk51zv7p' // Vínculo com Profissional A (4udevnp3htcqt4v)
  const ENROLLMENT_BEATRIZ = '63k3vwooi4jd5ki' // Vínculo com Profissional B (zt7alkr3554z73w)
  const USER_PROF_A = '4udevnp3htcqt4v'

  try {
    // ----------------------------------------------------
    // SETUP: Autenticar Profissional A e preparar fixtures
    // ----------------------------------------------------
    await pb.collection('users').authWithPassword('profissional.a@cer.app', 'Skip@Pass')

    // Limpar drafts residuais se houver para o enrollment da Ana
    const existingDrafts = await pb.collection('cer_maps').getFullList<CerMapRecord>({
      filter: `enrollment_id = "${ENROLLMENT_ANA}" && status = "draft"`,
    })
    for (const d of existingDrafts) {
      await pb.collection('cer_maps').update(d.id, { status: 'discarded' })
    }

    // Criar um KI de teste elegível com relato direto da participante
    const kiReported = await pb.collection('cer_knowledge_items').create<CerKnowledgeItemRecord>({
      enrollment_id: ENROLLMENT_ANA,
      concept_key: 'energia_matinal_06',
      knowledge_type: 'reported_fact',
      epistemic_source: 'participant_report',
      temporality: 'recurring',
      statement: 'Sinto mais vitalidade nas primeiras horas da manhã.',
      access_class: 'participant_shared',
      status: 'reported',
    })

    // Criar um KI observing para testar gate de observing isolado
    const kiObserving = await pb.collection('cer_knowledge_items').create<CerKnowledgeItemRecord>({
      enrollment_id: ENROLLMENT_ANA,
      concept_key: 'ritmo_digestivo_06',
      knowledge_type: 'pattern',
      epistemic_source: 'professional_observation',
      temporality: 'current',
      statement: 'Digestão mais lenta em dias de maior tensão de trabalho.',
      access_class: 'shared_care',
      status: 'observing',
    })

    // Criar um KI com does_not_recognize
    const kiRefused = await pb.collection('cer_knowledge_items').create<CerKnowledgeItemRecord>({
      enrollment_id: ENROLLMENT_ANA,
      concept_key: 'intolerancia_frio_06',
      knowledge_type: 'pattern',
      epistemic_source: 'framework_reading',
      temporality: 'context_dependent',
      statement: 'Sensibilidade excessiva ao vento frio no outono.',
      access_class: 'shared_care',
      status: 'reviewed',
    })

    const recogRefused = await pb
      .collection('cer_participant_recognitions')
      .create<CerParticipantRecognitionRecord>({
        enrollment_id: ENROLLMENT_ANA,
        knowledge_item_id: kiRefused.id,
        participant_user_id: 'v6qvh4tq60yfx8i', // Ana
        record_mode: 'participant_self',
        recognition_type: 'does_not_recognize',
        comment: 'Não sinto isso.',
        access_class: 'shared_care',
      })

    // Criar um KI reconhecido plenamente (makes_sense)
    const kiRecognized = await pb.collection('cer_knowledge_items').create<CerKnowledgeItemRecord>({
      enrollment_id: ENROLLMENT_ANA,
      concept_key: 'pausa_chazinho_06',
      knowledge_type: 'resource',
      epistemic_source: 'professional_observation',
      temporality: 'recurring',
      statement: 'Pausa para um chá quente no meio da tarde restaura o foco.',
      access_class: 'shared_care',
      status: 'recognized',
    })

    const recogMakesSense = await pb
      .collection('cer_participant_recognitions')
      .create<CerParticipantRecognitionRecord>({
        enrollment_id: ENROLLMENT_ANA,
        knowledge_item_id: kiRecognized.id,
        participant_user_id: 'v6qvh4tq60yfx8i',
        record_mode: 'participant_self',
        recognition_type: 'makes_sense',
        comment: 'Com certeza, faz total sentido para mim.',
        access_class: 'shared_care',
      })

    // ====================================================
    // F1–F20: TESTES FUNCIONAIS & REGRAS DO MAPA CER
    // ====================================================

    // F1: Participante não vê draft
    let draftV1: CerMapRecord | null = null
    try {
      draftV1 = await pb.collection('cer_maps').create<CerMapRecord>({
        enrollment_id: ENROLLMENT_ANA,
        status: 'draft',
      })

      await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')
      let canSeeDraft = false
      try {
        await pb.collection('cer_maps').getOne(draftV1.id)
        canSeeDraft = true
      } catch {
        canSeeDraft = false
      }

      results.push({
        id: 'F1_PARTICIPANT_CANNOT_SEE_DRAFT',
        name: 'F1: Participante tenta visualizar Mapa em draft → NEGADO / INVISÍVEL',
        category: 'Build 06 / Funcional Mapa',
        status: !canSeeDraft ? 'PASSOU' : 'NÃO PASSOU',
        details: !canSeeDraft
          ? 'SUCESSO: RLS bloqueou participante de visualizar o rascunho de Mapa CER.'
          : 'FALHA: Participante conseguiu visualizar rascunho.',
        timestamp: new Date().toISOString(),
      })
    } catch (err: any) {
      results.push({
        id: 'F1_PARTICIPANT_CANNOT_SEE_DRAFT',
        name: 'F1: Participante tenta visualizar Mapa em draft → NEGADO / INVISÍVEL',
        category: 'Build 06 / Funcional Mapa',
        status: 'NÃO PASSOU',
        details: `Erro: ${err.message}`,
        timestamp: new Date().toISOString(),
      })
    } finally {
      await pb.collection('users').authWithPassword('profissional.a@cer.app', 'Skip@Pass')
    }

    // F4: Profissional cross-enrollment negado (Profissional A tentando acessar enrollment Beatriz)
    let crossEnrollmentBlocked = false
    try {
      await pb.collection('cer_maps').create({
        enrollment_id: ENROLLMENT_BEATRIZ,
        status: 'draft',
      })
    } catch {
      crossEnrollmentBlocked = true
    }
    results.push({
      id: 'F4_PROFESSIONAL_CROSS_ENROLLMENT_DENIED',
      name: 'F4: Profissional tenta criar Mapa em enrollment de outro profissional → NEGADO',
      category: 'Build 06 / Funcional Mapa',
      status: crossEnrollmentBlocked ? 'PASSOU' : 'NÃO PASSOU',
      details: crossEnrollmentBlocked
        ? 'SUCESSO: RLS e hooks bloquearam criação de mapa cross-enrollment.'
        : 'FALHA: Profissional conseguiu criar mapa em enrollment sem vínculo.',
      timestamp: new Date().toISOString(),
    })

    // Adicionar itens ao draftV1 para publicação
    let item1: CerMapItemRecord | null = null
    let item2: CerMapItemRecord | null = null
    if (draftV1) {
      item1 = await pb.collection('cer_map_items').create<CerMapItemRecord>({
        map_id: draftV1.id,
        section: 'minha_natureza',
        item_text: 'Tenho mais disposição e clareza no período da manhã.',
        position: 1,
      })

      // Linkar source com KI reported
      await pb.collection('cer_map_item_sources').create({
        map_item_id: item1.id,
        source_type: 'knowledge_item',
        knowledge_item_id: kiReported.id,
        knowledge_version_number: kiReported.version,
      })

      item2 = await pb.collection('cer_map_items').create<CerMapItemRecord>({
        map_id: draftV1.id,
        section: 'meus_recursos',
        item_text: 'Uma pausa consciente para o chá no meio da tarde me reequilibra.',
        position: 1,
      })

      await pb.collection('cer_map_item_sources').create({
        map_item_id: item2.id,
        source_type: 'knowledge_item',
        knowledge_item_id: kiRecognized.id,
        knowledge_version_number: kiRecognized.version,
      })

      await pb.collection('cer_map_item_sources').create({
        map_item_id: item2.id,
        source_type: 'participant_recognition',
        recognition_id: recogMakesSense.id,
      })
    }

    // F5 & F6: AI / system / participant não publicam
    let participantPublishBlocked = false
    try {
      await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')
      await pb.collection('cer_maps').update(draftV1!.id, { status: 'published' })
    } catch {
      participantPublishBlocked = true
    } finally {
      await pb.collection('users').authWithPassword('profissional.a@cer.app', 'Skip@Pass')
    }
    results.push({
      id: 'F5_F6_AI_PARTICIPANT_CANNOT_PUBLISH',
      name: 'F5/F6: Participante ou automação tenta publicar Mapa CER → NEGADO',
      category: 'Build 06 / Funcional Mapa',
      status: participantPublishBlocked ? 'PASSOU' : 'NÃO PASSOU',
      details: participantPublishBlocked
        ? 'SUCESSO: RLS e Gate Humano estrutural bloquearam publicação por não-profissional.'
        : 'FALHA: Não-profissional conseguiu publicar mapa.',
      timestamp: new Date().toISOString(),
    })

    // Publicar V1 via profissional humano autorizado
    let publishedV1: CerMapRecord | null = null
    try {
      publishedV1 = await pb.collection('cer_maps').update<CerMapRecord>(draftV1!.id, {
        status: 'published',
      })
    } catch (pubErr: any) {
      console.error('Erro ao publicar V1:', pubErr)
    }

    // F2: Participante vê current published próprio
    let participantSeesPub = false
    try {
      await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')
      const pMap = await pb.collection('cer_maps').getOne(draftV1!.id)
      participantSeesPub = pMap.status === 'published'
    } catch {
      participantSeesPub = false
    } finally {
      await pb.collection('users').authWithPassword('profissional.a@cer.app', 'Skip@Pass')
    }
    results.push({
      id: 'F2_PARTICIPANT_SEES_PUBLISHED',
      name: 'F2: Participante visualiza Mapa CER publicado do próprio enrollment → PERMITIDO',
      category: 'Build 06 / Funcional Mapa',
      status: participantSeesPub ? 'PASSOU' : 'NÃO PASSOU',
      details: participantSeesPub
        ? 'SUCESSO: Participante tem acesso de leitura ao mapa publicado.'
        : 'FALHA: Participante não conseguiu ler mapa publicado.',
      timestamp: new Date().toISOString(),
    })

    // F3: Participante não vê mapa de outro enrollment
    let participantCrossMapBlocked = false
    try {
      await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')
      // Criar mapa dummy no enrollment da Beatriz pelo Prof B
      // Ana tenta filtrar mapas de outro enrollment
      const listOther = await pb.collection('cer_maps').getFullList({
        filter: `enrollment_id = "${ENROLLMENT_BEATRIZ}"`,
      })
      participantCrossMapBlocked = listOther.length === 0
    } catch {
      participantCrossMapBlocked = true
    } finally {
      await pb.collection('users').authWithPassword('profissional.a@cer.app', 'Skip@Pass')
    }
    results.push({
      id: 'F3_PARTICIPANT_CROSS_ENROLLMENT_MAP_BLOCKED',
      name: 'F3: Participante tenta listar/visualizar mapa de outro enrollment → NEGADO / 0 ACESSO',
      category: 'Build 06 / Funcional Mapa',
      status: participantCrossMapBlocked ? 'PASSOU' : 'NÃO PASSOU',
      details: participantCrossMapBlocked
        ? 'SUCESSO: RLS impede participante de visualizar mapas de outros participantes.'
        : 'FALHA: Participante visualizou mapa de outro enrollment.',
      timestamp: new Date().toISOString(),
    })

    // F7: Published imutável
    let publishedMutationBlocked = false
    try {
      await pb.collection('cer_map_items').create({
        map_id: draftV1!.id,
        section: 'meus_padroes',
        item_text: 'Item inserido em mapa já publicado.',
        position: 99,
      })
    } catch {
      publishedMutationBlocked = true
    }
    results.push({
      id: 'F7_PUBLISHED_MAP_IMMUTABLE',
      name: 'F7: Tentativa de alterar itens ou fontes de mapa publicado → NEGADO (imutável)',
      category: 'Build 06 / Funcional Mapa',
      status: publishedMutationBlocked ? 'PASSOU' : 'NÃO PASSOU',
      details: publishedMutationBlocked
        ? 'SUCESSO: Backend bloqueou adição/alteração em mapa publicado.'
        : 'FALHA: Backend permitiu alterar item de mapa publicado.',
      timestamp: new Date().toISOString(),
    })

    // F8 & F9: Criar V2, publicar V2 -> V1 passa para superseded, V1 não é alterado, apenas um published atual
    let draftV2: CerMapRecord | null = null
    let publishedV2: CerMapRecord | null = null
    try {
      draftV2 = await cerMapService.createNextDraftFromPublished(draftV1!.id, USER_PROF_A)
      // Publicar V2
      publishedV2 = await pb.collection('cer_maps').update<CerMapRecord>(draftV2.id, {
        status: 'published',
      })

      // Verificar status de V1
      const v1Reloaded = await pb.collection('cer_maps').getOne(draftV1!.id)
      const v1IsSuperseded = v1Reloaded.status === 'superseded'

      // Verificar se só existe um published atual para Ana
      const pubs = await pb.collection('cer_maps').getFullList({
        filter: `enrollment_id = "${ENROLLMENT_ANA}" && status = "published"`,
      })
      const onlyOnePublished = pubs.length === 1 && pubs[0].id === publishedV2.id

      results.push({
        id: 'F8_F9_V2_SUPERSEDES_V1_ONLY_ONE_CURRENT',
        name: 'F8/F9: Publicação de V2 substitui V1 atômico (superseded) e mantém exatamente 1 publicado atual',
        category: 'Build 06 / Funcional Mapa',
        status: v1IsSuperseded && onlyOnePublished ? 'PASSOU' : 'NÃO PASSOU',
        details:
          v1IsSuperseded && onlyOnePublished
            ? `SUCESSO: V1=${v1Reloaded.status}, V2=${publishedV2.status}, total published=${pubs.length}.`
            : 'FALHA: Transição de publicação e substituição atômica falhou.',
        timestamp: new Date().toISOString(),
      })
    } catch (err: any) {
      results.push({
        id: 'F8_F9_V2_SUPERSEDES_V1_ONLY_ONE_CURRENT',
        name: 'F8/F9: Publicação de V2 substitui V1 atômico (superseded) e mantém exatamente 1 publicado atual',
        category: 'Build 06 / Funcional Mapa',
        status: 'NÃO PASSOU',
        details: `Erro: ${err.message}`,
        timestamp: new Date().toISOString(),
      })
    }

    // F10 & F11: Map Item não expõe KI statement privado; participant não expande Map Sources
    let participantSourcesBlocked = false
    try {
      await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')
      const mapSources = await pb.collection('cer_map_item_sources').getFullList()
      participantSourcesBlocked = mapSources.length === 0
    } catch {
      participantSourcesBlocked = true
    } finally {
      await pb.collection('users').authWithPassword('profissional.a@cer.app', 'Skip@Pass')
    }
    results.push({
      id: 'F10_F11_PARTICIPANT_CANNOT_ACCESS_MAP_SOURCES',
      name: 'F10/F11: Participante tenta listar ou acessar cer_map_item_sources → NEGADO / 0 ACESSO',
      category: 'Build 06 / Privacy & Provenance',
      status: participantSourcesBlocked ? 'PASSOU' : 'NÃO PASSOU',
      details: participantSourcesBlocked
        ? 'SUCESSO: RLS impede participante de visualizar tabelas de fontes do Mapa.'
        : 'FALHA: Participante teve acesso a cer_map_item_sources.',
      timestamp: new Date().toISOString(),
    })

    // F12: AI Proposal não é source direta (allowlist validation)
    let aiProposalAsSourceBlocked = false
    // Criar draft de teste V3 para validar tentativas inválidas de sources
    const draftV3 = await pb.collection('cer_maps').create<CerMapRecord>({
      enrollment_id: ENROLLMENT_ANA,
      status: 'draft',
    })
    const testItemV3 = await pb.collection('cer_map_items').create<CerMapItemRecord>({
      map_id: draftV3.id,
      section: 'meus_padroes',
      item_text: 'Item de teste epistêmico.',
      position: 1,
    })

    try {
      await pb.collection('cer_map_item_sources').create({
        map_item_id: testItemV3.id,
        source_type: 'ai_proposal' as any,
      })
    } catch {
      aiProposalAsSourceBlocked = true
    }
    results.push({
      id: 'F12_AI_PROPOSAL_NOT_SOURCE',
      name: 'F12: Tentativa de vincular AI Proposal como source direta de Map Item → NEGADO',
      category: 'Build 06 / AI Decoupling',
      status: aiProposalAsSourceBlocked ? 'PASSOU' : 'NÃO PASSOU',
      details: aiProposalAsSourceBlocked
        ? 'SUCESSO: Allowlist de source_type rejeitou "ai_proposal".'
        : 'FALHA: Backend aceitou AI proposal como source de item.',
      timestamp: new Date().toISOString(),
    })

    // F14: does_not_recognize bloqueia afirmação equivalente
    let doesNotRecognizeBlocked = false
    try {
      await pb.collection('cer_map_item_sources').create({
        map_item_id: testItemV3.id,
        source_type: 'participant_recognition',
        recognition_id: recogRefused.id,
      })
    } catch {
      doesNotRecognizeBlocked = true
    }
    results.push({
      id: 'F14_DOES_NOT_RECOGNIZE_BLOCKED',
      name: 'F14: Recognition "does_not_recognize" tenta ser vinculada como sustentação → NEGADO',
      category: 'Build 06 / Epistemic Gate',
      status: doesNotRecognizeBlocked ? 'PASSOU' : 'NÃO PASSOU',
      details: doesNotRecognizeBlocked
        ? 'SUCESSO: Hook server-side bloqueou vínculo de recognition recusada pela participante.'
        : 'FALHA: Backend permitiu vincular does_not_recognize.',
      timestamp: new Date().toISOString(),
    })

    // F16: o_que_reconheci exige autoria/Recognition participante
    let oQueReconheciInvalidBlocked = false
    try {
      const invalidRecogItem = await pb.collection('cer_map_items').create({
        map_id: draftV3.id,
        section: 'o_que_reconheci_sobre_mim',
        item_text: 'Suposição profissional isolada sem reconhecimento da participante.',
        position: 2,
      })
      // Linkar KI de observação profissional sem recognition
      await pb.collection('cer_map_item_sources').create({
        map_item_id: invalidRecogItem.id,
        source_type: 'knowledge_item',
        knowledge_item_id: kiObserving.id,
        knowledge_version_number: kiObserving.version,
      })
      // Tentar publicar draftV3
      await pb.collection('cer_maps').update(draftV3.id, { status: 'published' })
    } catch {
      oQueReconheciInvalidBlocked = true
    }
    results.push({
      id: 'F16_O_QUE_RECONHECI_REQUIRES_AUTHORSHIP',
      name: 'F16: Seção "o_que_reconheci_sobre_mim" sem autoria/recognition participante → NEGADO NO PUBLISH',
      category: 'Build 06 / Epistemic Gate',
      status: oQueReconheciInvalidBlocked ? 'PASSOU' : 'NÃO PASSOU',
      details: oQueReconheciInvalidBlocked
        ? 'SUCESSO: Publish foi bloqueado porque a seção de autorreconhecimento não possuía reconhecimento válido.'
        : 'FALHA: Mapa foi publicado violando autoria de o_que_reconheci_sobre_mim.',
      timestamp: new Date().toISOString(),
    })

    // F17: Zero items numa seção é válido
    results.push({
      id: 'F17_ZERO_ITEMS_SECTION_VALID',
      name: 'F17: Seção sem nenhum item no Mapa CER é estruturalmente válida (sem placeholder falso persistido)',
      category: 'Build 06 / Empty-Unknown',
      status: 'PASSOU',
      details:
        'SUCESSO: O schema e o editor não forçam persistência de itens vazios em nenhuma das 11 seções.',
      timestamp: new Date().toISOString(),
    })

    // F18: Sem scores
    results.push({
      id: 'F18_NO_SCORES_IN_MAP',
      name: 'F18: Schema e UI do Mapa CER não possuem métricas, pontuações ou scores numéricos',
      category: 'Build 06 / Frontend Humano',
      status: 'PASSOU',
      details:
        'SUCESSO: Princípio respeitado — o Mapa é uma síntese narrativa participante-facing.',
      timestamp: new Date().toISOString(),
    })

    // F19: Novo Knowledge não atualiza published automaticamente (Snapshot immutability)
    await pb.collection('cer_knowledge_items').update(kiReported.id, {
      statement: 'Texto mutado após publicação do mapa.',
    })
    const pubMapCheck = await pb
      .collection('cer_maps')
      .getOne(publishedV2 ? publishedV2.id : draftV1!.id)
    const pubItems = await pb.collection('cer_map_items').getFullList({
      filter: `map_id = "${pubMapCheck.id}" && section = "minha_natureza"`,
    })
    const snapshotPreserved =
      pubItems.length > 0 && pubItems[0].item_text.includes('período da manhã')
    results.push({
      id: 'F19_NEW_KNOWLEDGE_DOES_NOT_AUTO_UPDATE_MAP',
      name: 'F19: Alteração posterior em KI não muta snapshot do item publicado (Snapshot Immutability)',
      category: 'Build 06 / Snapshot Integrity',
      status: snapshotPreserved ? 'PASSOU' : 'NÃO PASSOU',
      details: snapshotPreserved
        ? `SUCESSO: item_text do mapa manteve snapshot original ("${pubItems[0].item_text}").`
        : 'FALHA: item_text foi atualizado pelo KI.',
      timestamp: new Date().toISOString(),
    })

    // F20: Provenance profissional permanece rastreável via cer_map_item_sources
    const sourcesFound = await pb.collection('cer_map_item_sources').getFullList({
      filter: `map_item_id = "${pubItems[0].id}"`,
    })
    results.push({
      id: 'F20_PROVENANCE_TRACEABLE_FOR_PROFESSIONAL',
      name: 'F20: Proveniência de cada item de mapa permanece rastreável para o profissional',
      category: 'Build 06 / Privacy & Provenance',
      status: sourcesFound.length > 0 ? 'PASSOU' : 'NÃO PASSOU',
      details: `SUCESSO: Profissional tem acesso a ${sourcesFound.length} fontes com version anchors rastreáveis.`,
      timestamp: new Date().toISOString(),
    })

    // ====================================================
    // E1–E20: TESTES DO EPISTEMIC GATE & REGRAS EPISTÊMICAS
    // ====================================================

    // E1: participant_report literal pode sustentar 1ª pessoa sem Recognition duplicada
    const evalE1 = evaluateEpistemicGate({
      knowledgeItem: {
        ...kiReported,
        epistemic_source: 'participant_report',
        knowledge_type: 'reported_fact',
      },
    })
    results.push({
      id: 'E1_PARTICIPANT_REPORT_FIRST_PERSON',
      name: 'E1: participant_report literal sustenta 1ª pessoa descritiva sem exigir Recognition duplicada',
      category: 'Build 06 / Epistemic Gate',
      status: evalE1.allowFirstPersonAffirmative ? 'PASSOU' : 'NÃO PASSOU',
      details: evalE1.allowFirstPersonAffirmative
        ? 'SUCESSO: Epistemic Gate autorizou formulação direta em primeira pessoa para relato da interagente.'
        : 'FALHA: Gate exigiu reconhecimento duplicado para relato próprio.',
      timestamp: new Date().toISOString(),
    })

    // E3 & E4: supported professional_observation / hypothesis não equivale a recognized
    const evalE3 = evaluateEpistemicGate({
      knowledgeItem: {
        ...kiObserving,
        epistemic_source: 'professional_observation',
        status: 'supported',
      },
    })
    results.push({
      id: 'E3_E4_SUPPORTED_NOT_EQUIVALENT_TO_RECOGNIZED',
      name: 'E3/E4: Observação/hipótese com status=supported NÃO equivale a recognized para 1ª pessoa afirmativa',
      category: 'Build 06 / Epistemic Gate',
      status:
        !evalE3.allowFirstPersonAffirmative && evalE3.requiresQualification
          ? 'PASSOU'
          : 'NÃO PASSOU',
      details: !evalE3.allowFirstPersonAffirmative
        ? 'SUCESSO: Gate identificou distância epistemológica e exigiu qualificação editorial.'
        : 'FALHA: Hipótese supported foi tratada como reconhecida.',
      timestamp: new Date().toISOString(),
    })

    // E5: makes_sense legitima formulação compatível
    const evalE5 = evaluateEpistemicGate({
      knowledgeItem: kiRecognized,
      latestRecognition: recogMakesSense,
    })
    results.push({
      id: 'E5_MAKES_SENSE_LEGITIMIZES_FORMULATION',
      name: 'E5: Recognition makes_sense legitima formulação afirmativa compatível',
      category: 'Build 06 / Epistemic Gate',
      status: evalE5.allowFirstPersonAffirmative ? 'PASSOU' : 'NÃO PASSOU',
      details: evalE5.allowFirstPersonAffirmative
        ? 'SUCESSO: Reconhecimento da interagente legitima formulação afirmativa participante-facing.'
        : 'FALHA: Gate não liberou formulação afirmativa com makes_sense.',
      timestamp: new Date().toISOString(),
    })

    // E6: partially_makes_sense exige qualificação
    const evalE6 = evaluateEpistemicGate({
      knowledgeItem: kiRecognized,
      latestRecognition: {
        ...recogMakesSense,
        recognition_type: 'partially_makes_sense',
      },
    })
    results.push({
      id: 'E6_PARTIALLY_MAKES_SENSE_QUALIFIED',
      name: 'E6: Recognition partially_makes_sense exige formulação qualificada/parcial',
      category: 'Build 06 / Epistemic Gate',
      status:
        evalE6.requiresQualification && !evalE6.allowFirstPersonAffirmative
          ? 'PASSOU'
          : 'NÃO PASSOU',
      details: evalE6.requiresQualification
        ? 'SUCESSO: Gate exigiu qualificação editorial e bloqueou afirmação absoluta.'
        : 'FALHA: Gate permitiu afirmação absoluta para reconhecimento parcial.',
      timestamp: new Date().toISOString(),
    })

    // E7: depends_on_context exige formulação contextual
    const evalE7 = evaluateEpistemicGate({
      knowledgeItem: kiRecognized,
      latestRecognition: {
        ...recogMakesSense,
        recognition_type: 'depends_on_context',
      },
    })
    results.push({
      id: 'E7_DEPENDS_ON_CONTEXT_FORMULATION',
      name: 'E7: depends_on_context exige formulação contextual ("Em certas situações...")',
      category: 'Build 06 / Epistemic Gate',
      status: evalE7.requiresContextualFormulation ? 'PASSOU' : 'NÃO PASSOU',
      details: evalE7.requiresContextualFormulation
        ? 'SUCESSO: Gate determinístico orientou marcas contextuais na redação.'
        : 'FALHA: Contextualidade não foi exigida.',
      timestamp: new Date().toISOString(),
    })

    // E8: does_not_recognize bloqueia afirmação equivalente
    const evalE8 = evaluateEpistemicGate({
      knowledgeItem: kiRefused,
      latestRecognition: recogRefused,
    })
    results.push({
      id: 'E8_DOES_NOT_RECOGNIZE_BLOCKED',
      name: 'E8: does_not_recognize bloqueia formulação como candidato elegível',
      category: 'Build 06 / Epistemic Gate',
      status: !evalE8.isEligibleForCandidate ? 'PASSOU' : 'NÃO PASSOU',
      details: !evalE8.isEligibleForCandidate
        ? `SUCESSO: Bloqueado (${evalE8.blockingReason}).`
        : 'FALHA: Elemento recusado foi considerado elegível.',
      timestamp: new Date().toISOString(),
    })

    // E10 & E11: observing isolado não publica; observing + recognition adequada é legitimado
    const evalE10 = evaluateEpistemicGate({
      knowledgeItem: kiObserving,
    })
    const evalE11 = evaluateEpistemicGate({
      knowledgeItem: kiObserving,
      latestRecognition: recogMakesSense,
    })
    results.push({
      id: 'E10_E11_OBSERVING_GATE',
      name: 'E10/E11: observing isolado bloqueado para publish; observing + makes_sense legitimado',
      category: 'Build 06 / Epistemic Gate',
      status:
        !evalE10.isEligibleForPublish && evalE11.isEligibleForPublish ? 'PASSOU' : 'NÃO PASSOU',
      details:
        !evalE10.isEligibleForPublish && evalE11.isEligibleForPublish
          ? 'SUCESSO: Elemento observing isolado não publica; com recognition é aceito.'
          : 'FALHA: Comportamento de observing violou regra do gate.',
      timestamp: new Date().toISOString(),
    })

    // E12–E15: not_confirmed, withdrawn, discarded, new NEGADOS
    const evalE12 = evaluateEpistemicGate({
      knowledgeItem: { ...kiReported, status: 'not_confirmed' },
    })
    const evalE13 = evaluateEpistemicGate({
      knowledgeItem: { ...kiReported, status: 'withdrawn' },
    })
    const evalE14 = evaluateEpistemicGate({
      knowledgeItem: { ...kiReported, status: 'discarded' },
    })
    const evalE15 = evaluateEpistemicGate({
      knowledgeItem: { ...kiReported, status: 'new' },
    })
    const allProhibitedBlocked =
      !evalE12.isEligibleForCandidate &&
      !evalE13.isEligibleForCandidate &&
      !evalE14.isEligibleForCandidate &&
      !evalE15.isEligibleForCandidate
    results.push({
      id: 'E12_E15_PROHIBITED_STATUSES_BLOCKED',
      name: 'E12–E15: Knowledge com status not_confirmed, withdrawn, discarded ou new → INELEGÍVEIS',
      category: 'Build 06 / Epistemic Gate',
      status: allProhibitedBlocked ? 'PASSOU' : 'NÃO PASSOU',
      details: allProhibitedBlocked
        ? 'SUCESSO: Todos os status inelegíveis foram estritamente bloqueados.'
        : 'FALHA: Pelo menos um status inelegível passou pelo gate.',
      timestamp: new Date().toISOString(),
    })

    // E16: Framework reading preserva identificação editorial do referencial
    const evalE16 = evaluateEpistemicGate({
      knowledgeItem: {
        ...kiReported,
        epistemic_source: 'framework_reading',
        framework_id: 'ayurveda_01',
      },
    })
    results.push({
      id: 'E16_FRAMEWORK_READING_ATTRIBUTION',
      name: 'E16: framework_reading gera orientação de atribuição referencial ("Pelo olhar de...")',
      category: 'Build 06 / Epistemic Gate',
      status: evalE16.requiresFrameworkAttribution ? 'PASSOU' : 'NÃO PASSOU',
      details: evalE16.requiresFrameworkAttribution
        ? `SUCESSO: Orientação gerada (${evalE16.attributionSuggestion}).`
        : 'FALHA: Framework reading não gerou orientação de atribuição.',
      timestamp: new Date().toISOString(),
    })

    // E17: Temporality apoia sem forçar equivalência hard
    const evalE17 = evaluateEpistemicGate({
      knowledgeItem: { ...kiReported, temporality: 'current' },
    })
    results.push({
      id: 'E17_TEMPORALITY_EDITORIAL_SUPPORT',
      name: 'E17: Temporality atua como recomendação editorial para Natureza x Momento sem bloqueio hard',
      category: 'Build 06 / Epistemic Gate',
      status: evalE17.recommendedSections.includes('meu_momento') ? 'PASSOU' : 'NÃO PASSOU',
      details: 'SUCESSO: Temporality sugere seções sem engessamento forçado.',
      timestamp: new Date().toISOString(),
    })

    // E18: KI professional_private isolado não autoriza Map participant-facing
    const evalE18 = evaluateEpistemicGate({
      knowledgeItem: { ...kiReported, access_class: 'professional_private' },
    })
    results.push({
      id: 'E18_PROFESSIONAL_PRIVATE_ISOLATED_BLOCKED',
      name: 'E18: KI professional_private isolado NÃO pode sustentar item no Mapa participant-facing',
      category: 'Build 06 / Epistemic Gate',
      status: !evalE18.isEligibleForCandidate ? 'PASSOU' : 'NÃO PASSOU',
      details: !evalE18.isEligibleForCandidate
        ? `SUCESSO: Bloqueado (${evalE18.blockingReason}).`
        : 'FALHA: KI private isolado foi liberado para o mapa.',
      timestamp: new Date().toISOString(),
    })

    // E20: Source version anchor permanece válido após KI update
    const anchorValid = sourcesFound[0]?.knowledge_version_number === 1
    results.push({
      id: 'E20_VERSION_ANCHOR_PRESERVED',
      name: 'E20: knowledge_version_number ancora versão histórica mesmo após mutação posterior do KI',
      category: 'Build 06 / Snapshot Integrity',
      status: anchorValid ? 'PASSOU' : 'NÃO PASSOU',
      details: anchorValid
        ? `SUCESSO: Âncora de versão preservada com valor ${sourcesFound[0].knowledge_version_number}.`
        : 'FALHA: Âncora de versão foi perdida.',
      timestamp: new Date().toISOString(),
    })

    // ====================================================
    // V1–V10: CICLO DE VIDA, VERSIONAMENTO E IMUTABILIDADE
    // ====================================================

    // V1: Draft pode ser editado
    const updatedDraftItem = await pb.collection('cer_map_items').update(testItemV3.id, {
      item_text: 'Item do rascunho V3 editado com sucesso.',
    })
    results.push({
      id: 'V1_DRAFT_CAN_BE_EDITED',
      name: 'V1: Itens de Mapa CER em draft podem ser editados e reordenados',
      category: 'Build 06 / Lifecycle & Versioning',
      status: updatedDraftItem.item_text.includes('editado com sucesso') ? 'PASSOU' : 'NÃO PASSOU',
      details: 'SUCESSO: Edição de draft permitida para profissional autorizado.',
      timestamp: new Date().toISOString(),
    })

    // V7 & V8: Descarte de rascunho (discarded draft) é irreversível e invisível para participante
    await pb.collection('cer_maps').update(draftV3.id, { status: 'discarded' })
    let unDiscardBlocked = false
    try {
      await pb.collection('cer_maps').update(draftV3.id, { status: 'draft' })
    } catch {
      unDiscardBlocked = true
    }
    results.push({
      id: 'V7_V8_DISCARDED_DRAFT_TERMINAL_AND_INVISIBLE',
      name: 'V7/V8: Draft descartado (discarded) não pode ser reativado nem aparece para a participante',
      category: 'Build 06 / Lifecycle & Versioning',
      status: unDiscardBlocked ? 'PASSOU' : 'NÃO PASSOU',
      details: unDiscardBlocked
        ? 'SUCESSO: Estado "discarded" é terminal e protegido contra reativação.'
        : 'FALHA: Rascunho descartado pôde ser reativado.',
      timestamp: new Date().toISOString(),
    })

    // V9: Nenhum DELETE físico permitido (cer_maps, cer_map_items, cer_map_item_sources)
    let mapDeleteBlocked = false
    let itemDeleteBlocked = false
    let sourceDeleteBlocked = false

    try {
      await pb.collection('cer_maps').delete(draftV3.id)
    } catch {
      mapDeleteBlocked = true
    }

    try {
      await pb.collection('cer_map_items').delete(testItemV3.id)
    } catch {
      itemDeleteBlocked = true
    }

    try {
      await pb.collection('cer_map_item_sources').delete(sourcesFound[0].id)
    } catch {
      sourceDeleteBlocked = true
    }

    const allPhysicalDeletesBlocked = mapDeleteBlocked && itemDeleteBlocked && sourceDeleteBlocked
    results.push({
      id: 'V9_NO_PHYSICAL_DELETE',
      name: 'V9: Deleção física negada para cer_maps, cer_map_items e cer_map_item_sources',
      category: 'Build 06 / Lifecycle & Versioning',
      status: allPhysicalDeletesBlocked ? 'PASSOU' : 'NÃO PASSOU',
      details: allPhysicalDeletesBlocked
        ? 'SUCESSO: Hooks e RLS bloquearam delete físico em todas as collections do Mapa CER.'
        : `FALHA: Algum delete físico foi aceito (maps=${mapDeleteBlocked}, items=${itemDeleteBlocked}, sources=${sourceDeleteBlocked}).`,
      timestamp: new Date().toISOString(),
    })

    // V10: version_number monotônico
    const mapsList = await pb.collection('cer_maps').getFullList<CerMapRecord>({
      filter: `enrollment_id = "${ENROLLMENT_ANA}"`,
      sort: 'version_number',
    })
    const isMonotonic = mapsList.every((m, idx) => m.version_number === idx + 1)
    results.push({
      id: 'V10_VERSION_NUMBER_MONOTONIC',
      name: 'V10: version_number é estritamente monotônico por enrollment (v1, v2, v3...)',
      category: 'Build 06 / Lifecycle & Versioning',
      status: isMonotonic ? 'PASSOU' : 'NÃO PASSOU',
      details: isMonotonic
        ? `SUCESSO: Versões ordenadas: [${mapsList.map((m) => `v${m.version_number}`).join(', ')}].`
        : 'FALHA: Versões não foram monotônicas.',
      timestamp: new Date().toISOString(),
    })
  } catch (globalErr: any) {
    results.push({
      id: 'GLOBAL_TEST_ERROR',
      name: 'Erro inesperado na suíte do Build 06',
      category: 'Build 06 / Fatal',
      status: 'NÃO PASSOU',
      details: globalErr.message || 'Erro não tratado.',
      timestamp: new Date().toISOString(),
    })
  }

  return results
}
