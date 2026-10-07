import { validateLifeDirection } from '@/services/lifeDirections'
import type {
  CerPromptRecord,
  EnrollmentExperienceRecord,
  ExperienceResponseRecord,
} from '@/types/cer'
import type { CerMapReadingRow, CerMapReadingSnapshot } from '@/types/cerMapReadings'
import { BUILD_07C_MENTE_PROMPTS, BUILD_07C_REGULACAO_PROMPTS } from './build07cPrompts'
import { BUILD_07D_RELACOES_PROMPTS } from './build07dPrompts'
import { BUILD_07E_SEXUALIDADE_PROMPTS } from './build07ePrompts'
import { BUILD_07F_SENTIDO_PROMPTS } from './build07fPrompts'
import { buildChapter4Synthesis } from './ayurvedaChapter4'
import { buildAyurvedaInterpretation } from './ayurvedaInterpretationEngine'
import { CER_MAP_REFERENCES } from './cerMapReferences'
import { resolveExperienceId } from './experienceEngine'
import { movementReportValues } from './movementFrequency'
import { CER_PROTECTION_PATTERNS } from './cerProtectionPatterns'
import { formatPromptResponse } from '@/components/experience/formatPromptResponse'

export const CER_READING_DIMENSIONS = [
  {
    id: 'corpo',
    experienceId: 'exp-corpo-fisiologia-07b',
    title: 'Corpo & Fisiologia',
    refs: ['prakriti', 'agni', 'ama', 'ayurveda-evidence'],
    explanation:
      'O Ayurveda distingue características reconhecidas há mais tempo (Prakriti) e mudanças do momento (Vikriti). Os doshas — Vata, Pitta e Kapha — são princípios tradicionais ligados a movimento, transformação e sustentação. Agni é a leitura tradicional da digestão; Ama descreve processamento incompleto nessa tradição. São hipóteses para conversar com a profissional, não resultados de exames.',
  },
  {
    id: 'mente',
    experienceId: 'exp-mente-emocoes-07c',
    title: 'Mente & Emoções',
    refs: ['emotion', 'cer'],
    explanation:
      'Emoções, pensamentos e maneiras de agir influenciam uns aos outros. Aqui observamos o que costuma se repetir, o que ajuda e o que traz desgaste. Os Padrões de Proteção CER descrevem movimentos do seu funcionamento; não definem sua personalidade nem explicam sozinhos sua história.',
  },
  {
    id: 'regulacao',
    experienceId: 'exp-regulacao-respostas-07c',
    title: 'Regulação & Padrões de Resposta',
    refs: ['stress', 'emotion', 'cer'],
    explanation:
      'Diante de situações difíceis, podemos agir, nos afastar, ficar sem reação ou ceder. Mais de uma resposta pode aparecer. Entender o contexto, os sinais, o que acontece depois e os recursos disponíveis ajuda a reconhecer a sequência. Essas escolhas não comprovam um estado do sistema nervoso nem a existência de trauma.',
  },
  {
    id: 'relacoes',
    experienceId: 'exp-relacoes-07d',
    title: 'Relações & Vínculos',
    refs: ['attachment'],
    explanation:
      'Proximidade, confiança, limites e apoio podem mudar conforme a relação e o momento. O mapa de órbitas registra proximidade percebida, sem medir qualidade ou amor. As respostas ajudam a investigar seus movimentos nos vínculos; não determinam um estilo de apego fixo.',
  },
  {
    id: 'sexualidade',
    experienceId: 'exp-sexualidade-07e',
    title: 'Sexualidade & Intimidade',
    refs: ['sexual-health'],
    explanation:
      'Sexualidade envolve bem-estar, corpo, desejo, intimidade, respeito e liberdade de escolha. Desejo, resposta física e disponibilidade são aspectos diferentes. A leitura acolhe os seus limites e considera apenas o que foi compartilhado; não pressupõe uma maneira correta de viver a sexualidade.',
  },
  {
    id: 'sentido',
    experienceId: 'exp-sentido-conexao-07f',
    title: 'Sentido & Conexão',
    refs: ['meaning', 'cer'],
    explanation:
      'Valores são aquilo que importa para você; sentido se relaciona com como isso encontra espaço na vida. Observamos fontes de conexão e momentos de distanciamento de si. Conexão com algo maior é opcional e não exige religião nem uma experiência espiritual específica.',
  },
] as const

const promptSets: Record<string, CerPromptRecord[]> = {
  mente: BUILD_07C_MENTE_PROMPTS,
  regulacao: BUILD_07C_REGULACAO_PROMPTS,
  relacoes: BUILD_07D_RELACOES_PROMPTS,
  sexualidade: BUILD_07E_SEXUALIDADE_PROMPTS,
  sentido: BUILD_07F_SENTIDO_PROMPTS,
}

const essentialKeys: Record<string, string[]> = {
  mente: [
    'dois_retratos_espaco',
    'dois_retratos_sobrecarga',
    'emocoes_recorrentes',
    'movimentos_interferencia_atual',
    'movimentos_automaticos_frequencia_p1',
    'movimentos_automaticos_frequencia_p2',
    'recursos_recuperar_espaco',
  ],
  regulacao: [
    'contexto_mobilizacao',
    'resposta_tendencia',
    'custo_posterior',
    'known_return_resource',
  ],
  relacoes: [
    'limites_cena_adaptativa',
    'afastamento_movimento_relacional',
    'pedir_apoio_tendencia',
    'conflito_movimento_inicial',
  ],
  sexualidade: [
    'desejo_camada_experiencia',
    'disponibilidade_camada_experiencia',
    'comunicacao_desconforto_cena',
    'qualidades_intimidade_segura',
  ],
  sentido: [
    'o_que_me_conecta_a_vida_sc1',
    'valores_que_importam_sc2',
    'espaco_para_o_que_importa_sc2',
    'mais_perto_de_mim_sc3',
  ],
}

function keyOf(response: ExperienceResponseRecord): string {
  const value = response.structured_value as any
  return (
    (response.expand?.prompt_id?.schema_config as any)?.prompt_key ||
    (response as any).prompt_key ||
    value?.prompt_key ||
    value?.metadata?.prompt_key ||
    (response as any).canonical_prompt_id ||
    response.prompt_id
  )
}

export function consciousnessCoverage(
  responses: ExperienceResponseRecord[],
  progress: EnrollmentExperienceRecord[] = [],
) {
  return CER_READING_DIMENSIONS.map((dimension) => {
    const records = (Array.isArray(responses) ? responses : []).filter(
      (response) => resolveExperienceId(response.experience_id) === dimension.experienceId,
    )
    const state = (Array.isArray(progress) ? progress : []).find(
      (item) => resolveExperienceId(item.experience_id) === dimension.experienceId,
    )
    return {
      ...dimension,
      started: records.length > 0 || (!!state && state.progress_status !== 'not_started'),
      completed: state?.progress_status === 'completed',
    }
  })
}

/** Only shared, current reports enter the document the professional may publish. */
export function buildCerMapReadings(
  responses: ExperienceResponseRecord[],
  enrollmentId: string,
  participantName: string,
  options: { literalOnly?: boolean } = {},
): CerMapReadingSnapshot {
  const shared = (Array.isArray(responses) ? responses : []).filter(
    (response) =>
      response.enrollment_id === enrollmentId &&
      ['participant_shared', 'shared_care'].includes(response.access_class) &&
      !['draft', 'superseded', 'discarded'].includes(response.status),
  )
  const dimensions = CER_READING_DIMENSIONS.map((meta) => {
    const dimensionResponses = shared.filter(
      (response) => resolveExperienceId(response.experience_id) === meta.experienceId,
    )
    let detailedRows: CerMapReadingRow[] = []
    let summaryRows: CerMapReadingRow[] = []
    if (meta.id === 'corpo') {
      const synthesis = buildChapter4Synthesis(dimensionResponses)
      detailedRows = [
        ...synthesis.historical.map((row) => ({
          label: `Há mais tempo · ${row.title}`,
          text: row.value,
        })),
        ...synthesis.habitual.map((row) => ({
          label: `Habitualmente · ${row.title}`,
          text: row.value,
        })),
        ...synthesis.current.map((row) => ({
          label: `Momento atual · ${row.title}`,
          text: row.value,
        })),
      ]
      const reading = buildAyurvedaInterpretation(dimensionResponses)
      if (reading.hasCompletedRevision && !options.literalOnly) {
        detailedRows.push(
          ...[
            ...reading.prakritiHypothesis.evidencesVata,
            ...reading.prakritiHypothesis.evidencesPitta,
            ...reading.prakritiHypothesis.evidencesKapha,
          ].map((evidence) => ({
            label: `Base da hipótese Prakriti · ${evidence.sourceQuestionTitle}`,
            text: `${evidence.literalText}. ${evidence.observation}`,
          })),
        )
        detailedRows.push(
          ...reading.agniReading.evidences.map((text) => ({
            label: 'Base da leitura de Agni',
            text,
          })),
          ...reading.amaReading.evidences.map((text) => ({
            label: 'Base da leitura tradicional de Ama',
            text,
          })),
        )
        summaryRows = [
          {
            label: 'Prakriti · hipótese da base constitucional',
            text: reading.prakritiHypothesis.summary,
          },
          { label: 'Vikriti · hipótese do momento', text: reading.vikritiHypothesis.summary },
          {
            label: 'Agni · leitura da digestão',
            text: `${reading.agniReading.type}. ${reading.agniReading.description}`,
          },
          {
            label: 'Ama · leitura tradicional',
            text: `${reading.amaReading.presence}. ${reading.amaReading.rationale}`,
          },
        ]
      }
      summaryRows.push(
        ...detailedRows.filter((row) => /energia|vitalidade|sono/i.test(row.label)).slice(0, 4),
      )
    } else {
      const latest = new Map<string, ExperienceResponseRecord>()
      for (const response of [...dimensionResponses].sort((a, b) =>
        (a.updated || a.created).localeCompare(b.updated || b.created),
      ))
        latest.set(keyOf(response), response)
      for (const prompt of promptSets[meta.id]) {
        const schema = prompt.schema_config as any
        if (
          schema.composite_mirror?.enabled ||
          schema.privacy_split?.enabled ||
          schema.access_destination === 'participant_private'
        )
          continue
        const response = [...latest.values()].find(
          (item) =>
            keyOf(item) === schema.prompt_key ||
            item.prompt_id === prompt.id ||
            (item as any).canonical_prompt_id === prompt.id,
        )
        if (!response) continue
        const ratings = schema.movement_scale_options ? movementReportValues(response) : {}
        const rows = Object.keys(ratings).length
          ? Object.entries(ratings).map(([id, frequency]) => ({
              label: CER_PROTECTION_PATTERNS[id]?.movementDescription || 'Movimento relatado',
              text: frequency,
              sourceResponseId: response.id,
              sourcePromptKey: schema.prompt_key,
            }))
          : [
              {
                label: prompt.step_title || prompt.prompt_text,
                text: formatPromptResponse(prompt, response),
                sourceResponseId: response.id,
                sourcePromptKey: schema.prompt_key,
              },
            ]
        detailedRows.push(...rows)
        if (essentialKeys[meta.id].includes(schema.prompt_key)) {
          summaryRows.push(
            ...(schema.movement_scale_options
              ? rows.filter((row) => /frequente|frequência|muita força|sob pressão/i.test(row.text))
              : rows),
          )
        }
      }
    }
    if (meta.id === 'corpo') detailedRows = [...summaryRows, ...detailedRows]
    if (!summaryRows.length) summaryRows = detailedRows.slice(0, 3)
    return {
      id: meta.id,
      title: meta.title,
      explanation: meta.explanation,
      summary: '',
      interpretation: '',
      summaryRows,
      detailedRows,
      referenceIds: [...meta.refs],
    }
  })
  return {
    schemaVersion: 1,
    enrollmentId,
    participantName,
    generatedAt: new Date().toISOString(),
    sourceResponseIds: [...new Set(shared.map((response) => response.id))],
    overview: options.literalOnly
      ? 'Este é seu mapa inicial: um retrato das respostas que você já registrou, disponível sem esperar pelo primeiro encontro. Uma leitura visual com aprofundamento sob toque para explorar dimensões, conceitos e recursos. Vocês poderão aprofundar e ajustar essa compreensão nas sessões.'
      : 'Este mapa reúne suas respostas e a leitura revisada pela profissional. Uma leitura visual única com aprofundamento sob toque para compreender conceitos, hipóteses e recursos, sem definir quem você é.',
    integration: '',
    history: '',
    dimensions,
    references: structuredClone(CER_MAP_REFERENCES),
  }
}

export function isCerMapReadingSnapshot(value: unknown): value is CerMapReadingSnapshot {
  const s = value as CerMapReadingSnapshot
  const strings = (values: unknown[]) => values.every((v) => typeof v === 'string')
  const rows = (v: unknown) =>
    Array.isArray(v) &&
    v.every(
      (r) =>
        r &&
        strings([r.label, r.text]) &&
        (r.sourceResponseId === undefined || typeof r.sourceResponseId === 'string'),
    )
  return (
    !!s &&
    s.schemaVersion === 1 &&
    (s.sessionUpdates === undefined ||
      (Array.isArray(s.sessionUpdates) &&
        new Set(s.sessionUpdates.map((u) => u?.sessionId)).size === s.sessionUpdates.length &&
        s.sessionUpdates.every(
          (u) =>
            u &&
            [u.sessionId, u.sessionDate, u.summary, u.preparedBy, u.preparedAt].every(
              (v) => typeof v === 'string' && v.trim(),
            ),
        ))) &&
    strings([
      s.enrollmentId,
      s.participantName,
      s.generatedAt,
      s.overview,
      s.integration,
      s.history,
    ]) &&
    (s.lifeConnections === undefined ||
      (Array.isArray(s.lifeConnections) &&
        s.lifeConnections.every(
          (c) =>
            c &&
            strings([c.eventId, c.responseId, c.text, c.question]) &&
            c.text.trim() &&
            s.lifeEvents?.some((e) => e.id === c.eventId) &&
            s.sourceResponseIds?.includes(c.responseId),
        ))) &&
    (s.lifeDirections === undefined ||
      (Array.isArray(s.lifeDirections) &&
        new Set(s.lifeDirections.map((v) => v?.id)).size === s.lifeDirections.length &&
        s.lifeDirections.every((v) => {
          try {
            validateLifeDirection(v)
            return (
              typeof v.id === 'string' &&
              typeof v.updated === 'string' &&
              v.enrollment_id === s.enrollmentId &&
              v.access_class === 'participant_shared'
            )
          } catch {
            return false
          }
        }))) &&
    (s.lifeEvents === undefined ||
      (Array.isArray(s.lifeEvents) &&
        s.lifeEvents.every(
          (e) =>
            e &&
            strings([
              e.id,
              e.enrollment_id,
              e.title,
              e.time_kind,
              e.time_value,
              e.narrative,
              e.updated,
            ]) &&
            e.enrollment_id === s.enrollmentId &&
            e.access_class === 'participant_shared' &&
            ['date', 'year', 'age', 'unknown'].includes(e.time_kind) &&
            Array.isArray(e.emotions) &&
            strings(e.emotions),
        ))) &&
    Array.isArray(s.sourceResponseIds) &&
    strings(s.sourceResponseIds) &&
    Array.isArray(s.dimensions) &&
    s.dimensions.length === 6 &&
    CER_READING_DIMENSIONS.every((meta) => s.dimensions.some((d) => d?.id === meta.id)) &&
    s.dimensions.every(
      (d) =>
        d &&
        strings([d.id, d.title, d.explanation, d.summary, d.interpretation]) &&
        rows(d.summaryRows) &&
        rows(d.detailedRows) &&
        Array.isArray(d.referenceIds) &&
        strings(d.referenceIds),
    ) &&
    Array.isArray(s.references) &&
    s.references.every(
      (r) =>
        r &&
        strings([r.id, r.citation, r.kind, r.scope]) &&
        (r.url === undefined || typeof r.url === 'string'),
    )
  )
}

export function unreviewedMapReadings(snapshot: CerMapReadingSnapshot): CerMapReadingSnapshot {
  const copy = structuredClone(snapshot)
  delete copy.reviewedAt
  delete copy.reviewedBy
  return copy
}

export function adaptLegacyMapItemsToReadings(
  items: CerMapItemRecord[],
  enrollmentId: string,
  participantName: string,
  mapVersionNumber: number = 1,
): CerMapReadingSnapshot {
  const SECTION_CANONICAL_DIMENSION: Record<string, string> = {
    minha_natureza: 'corpo',
    meu_momento: 'corpo',
    quando_estou_no_meu_eixo: 'corpo',
    quando_saio_do_meu_eixo: 'corpo',
    o_que_me_mobiliza: 'mente',
    meus_padroes: 'mente',
    meus_recursos: 'mente',
    minhas_relacoes: 'relacoes',
    minha_historia: 'relacoes',
    o_que_tem_sentido_para_mim: 'sentido',
    o_que_reconheci_sobre_mim: 'sentido',
  }

  const SECTION_FRIENDLY_LABEL: Record<string, string> = {
    minha_natureza: 'Minha Natureza',
    meu_momento: 'Meu Momento',
    quando_estou_no_meu_eixo: 'Quando estou no meu eixo',
    quando_saio_do_meu_eixo: 'Quando saio do meu eixo',
    o_que_me_mobiliza: 'O que me mobiliza',
    meus_padroes: 'Meus Padrões',
    meus_recursos: 'Meus Recursos',
    minhas_relacoes: 'Minhas Relações',
    minha_historia: 'Minha História',
    o_que_tem_sentido_para_mim: 'O que tem sentido para mim',
    o_que_reconheci_sobre_mim: 'O que reconheci sobre mim',
  }

  const dimensions = CER_READING_DIMENSIONS.map((meta) => {
    const matchingItems = (Array.isArray(items) ? items : []).filter(
      (item) => SECTION_CANONICAL_DIMENSION[item.section] === meta.id,
    )

    const detailedRows: CerMapReadingRow[] = matchingItems.map((item) => ({
      label: `${SECTION_FRIENDLY_LABEL[item.section] || item.section} · Conteúdo do mapa publicado anteriormente`,
      text: item.item_text,
    }))

    const summaryRows: CerMapReadingRow[] = detailedRows.slice(0, 3)

    return {
      id: meta.id,
      title: meta.title,
      explanation: meta.explanation,
      summary: matchingItems.length > 0 ? 'Conteúdo da versão anterior do mapa.' : '',
      interpretation: '',
      summaryRows,
      detailedRows,
      referenceIds: [...meta.refs],
    }
  })

  return {
    schemaVersion: 1,
    enrollmentId,
    participantName,
    generatedAt: new Date().toISOString(),
    sourceResponseIds: [],
    overview: `Este mapa reúne o conteúdo da versão anterior do mapa (v${mapVersionNumber}), apresentado em visualização interativa com detalhes disponíveis ao tocar em cada alvo.`,
    integration: '',
    history: '',
    dimensions,
    references: structuredClone(CER_MAP_REFERENCES),
    reviewedBy: 'Versão anterior do mapa',
    reviewedAt: new Date().toISOString(),
  }
}
