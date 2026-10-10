import { CORPO_FISIOLOGIA_EXPERIENCE, CORPO_FISIOLOGIA_MOMENTS, BUILD_07B_PROMPTS } from '../src/services/build07bPrompts'
import { MENTE_EMOCOES_EXPERIENCE, REGULACAO_RESPOSTAS_EXPERIENCE, MENTE_EMOCOES_MOMENTS, REGULACAO_RESPOSTAS_MOMENTS, BUILD_07C_ALL_PROMPTS } from '../src/services/build07cPrompts'
import { RELACOES_EXPERIENCE, RELACOES_MOMENTS, BUILD_07D_RELACOES_PROMPTS } from '../src/services/build07dPrompts'
import { SEXUALIDADE_EXPERIENCE, SEXUALIDADE_MOMENTS, BUILD_07E_SEXUALIDADE_PROMPTS } from '../src/services/build07ePrompts'
import { SENTIDO_CONEXAO_EXPERIENCE, SENTIDO_CONEXAO_MOMENTS, BUILD_07F_SENTIDO_PROMPTS } from '../src/services/build07fPrompts'
import { INTEGRACAO_CONSCIENCIA_EXPERIENCE, INTEGRACAO_CONSCIENCIA_MOMENTS, BUILD_07G_INTEGRACAO_PROMPTS } from '../src/services/build07gPrompts'
import { AYV_C1_PROMPTS } from '../src/services/ayurvedaChapter1'
import { AYV_C2_PROMPTS } from '../src/services/ayurvedaChapter2'
import { AYV_C3_PROMPTS } from '../src/services/ayurvedaChapter3'
import { AYV_C4_COMPLETION } from '../src/services/ayurvedaChapter4'

export const catalog = {
  experiences: [CORPO_FISIOLOGIA_EXPERIENCE, MENTE_EMOCOES_EXPERIENCE, REGULACAO_RESPOSTAS_EXPERIENCE, RELACOES_EXPERIENCE, SEXUALIDADE_EXPERIENCE, SENTIDO_CONEXAO_EXPERIENCE, INTEGRACAO_CONSCIENCIA_EXPERIENCE],
  moments: [...CORPO_FISIOLOGIA_MOMENTS, ...MENTE_EMOCOES_MOMENTS, ...REGULACAO_RESPOSTAS_MOMENTS, ...RELACOES_MOMENTS, ...SEXUALIDADE_MOMENTS, ...SENTIDO_CONEXAO_MOMENTS, ...INTEGRACAO_CONSCIENCIA_MOMENTS],
  prompts: [...BUILD_07B_PROMPTS, ...BUILD_07C_ALL_PROMPTS, ...BUILD_07D_RELACOES_PROMPTS, ...BUILD_07E_SEXUALIDADE_PROMPTS, ...BUILD_07F_SENTIDO_PROMPTS, ...BUILD_07G_INTEGRACAO_PROMPTS,
    ...[AYV_C1_PROMPTS, AYV_C2_PROMPTS, AYV_C3_PROMPTS, { COMPLETION: AYV_C4_COMPLETION }].flatMap(chapter => Object.values(chapter).map((p: any) => ({
      id: p.id, experience_id: CORPO_FISIOLOGIA_EXPERIENCE.id,
      step_order: p.step_order, step_title: p.title || p.key, prompt_text: p.title || p.key,
      component_type: p.id.includes('completion') ? 'ChapterCompletion' : (p.id.includes('pele_habitual') || p.id.includes('cabelo_habitual') || (p.id.startsWith('ayv_c2_') && !p.id.includes('confidence'))) ? 'MultiSelectCards' : 'ChoiceCards',
      version: 1, is_required: false,
      schema_config: { prompt_key: p.key, access_destination: 'shared_care' },
    }))),
  ],
}
