/**
 * REGISTRO TÉCNICO DE ASSETS VISUAIS AYURVEDA — LOTE 0A
 *
 * Status: BLOQUEADO PARA USO CLÍNICO E PERSONALIZAÇÃO DE AVATAR.
 * As seis figuras aprovadas são imagens achatadas sem camadas independentes de pele, roupa ou cabelo.
 * Proibições ativas:
 * - Não recolorir imagens com CSS/canvas.
 * - Não usar escolhas de apresentação/estética como dado ou hipótese clínica (Prakriti/Vikriti/Agni/Ama).
 * - Personalização bloqueada até entrega do próximo lote visual com camadas e máscaras alinhadas.
 */

export interface AyurvedaFigureAssetManifest {
  manifest_version: string
  project: string
  lot: string
  purpose: string
  clinical_use: boolean
  approved_files: Array<{
    id: string
    file: string
    presentation: 'feminine' | 'masculine'
    structure: 'light_narrow' | 'intermediate' | 'broad_solid'
    width: number
    height: number
    format: string
    alpha_required: boolean
    sha256: string
  }>
  next_stage_requirements: {
    status: string
    reason: string
    required_before_avatar_ui: string[]
  }
  prohibitions: string[]
}

export const AYURVEDA_LOTE_0A_MANIFEST: AyurvedaFigureAssetManifest = {
  manifest_version: '1.0.0',
  project: 'CER Ayurveda',
  lot: '0A',
  purpose: 'Inventário técnico das figuras corporais aprovadas antes da implementação',
  clinical_use: false,
  approved_files: [
    {
      id: 'female_light_narrow',
      file: 'assets/ayv-feminino-leve.png',
      presentation: 'feminine',
      structure: 'light_narrow',
      width: 1024,
      height: 1536,
      format: 'png',
      alpha_required: true,
      sha256: '71437dc59de47c72f744d48a17a48f49ffee4170f6a493df1ca7fe35c6650764',
    },
    {
      id: 'female_intermediate',
      file: 'assets/ayv-feminino-intermediario.png',
      presentation: 'feminine',
      structure: 'intermediate',
      width: 1024,
      height: 1536,
      format: 'png',
      alpha_required: true,
      sha256: '110965b4e0e11f69a8307ef8248198f749f5c17a005d67875b9b81188aa6f4b0',
    },
    {
      id: 'female_broad_solid',
      file: 'assets/ayv-feminino-amplo.png',
      presentation: 'feminine',
      structure: 'broad_solid',
      width: 1024,
      height: 1536,
      format: 'png',
      alpha_required: true,
      sha256: '8d03f68fbe207bdb3952dc96a1fc0cdaa60543ed9248a9e4feb82e530c0f11a9',
    },
    {
      id: 'male_light_narrow',
      file: 'assets/ayv-masculino-leve.png',
      presentation: 'masculine',
      structure: 'light_narrow',
      width: 1024,
      height: 1536,
      format: 'png',
      alpha_required: true,
      sha256: 'a8f2c5f243e650d366c194949af33193fdcf7e7e7adf738c5c97f1e1807061a3',
    },
    {
      id: 'male_intermediate',
      file: 'assets/ayv-masculino-intermediario.png',
      presentation: 'masculine',
      structure: 'intermediate',
      width: 1024,
      height: 1536,
      format: 'png',
      alpha_required: true,
      sha256: '473387ed22b0003c7e60f965df0f7fcc935ac7cd73dc67e9d3dcdf82cbb139c6',
    },
    {
      id: 'male_broad_solid',
      file: 'assets/ayv-masculino-amplo.png',
      presentation: 'masculine',
      structure: 'broad_solid',
      width: 1024,
      height: 1536,
      format: 'png',
      alpha_required: true,
      sha256: '2603ea666e8e0148d057eb481a9c12f2bd7ef64586482ff50b03f810253773ea',
    },
  ],
  next_stage_requirements: {
    status: 'blocked_until_assets_exist',
    reason:
      'Os PNGs aprovados são imagens achatadas; não contêm camadas independentes para recolorir pele e cabelo com segurança.',
    required_before_avatar_ui: [
      'máscara de pele alinhada para cada uma das seis figuras',
      'camada de roupa branca e sombras preservadas',
      'máscara ou camada de cabelo alinhada para cada figura',
      'seis tons de pele aprovados',
      'paleta de cabelo aprovada',
      'prévia composta validada em desktop e celular',
    ],
  },
  prohibitions: [
    'não recolorir o PNG completo com filtro CSS',
    'não usar a escolha estética como evidência ayurvédica',
    'não gerar imagens substitutas dentro do Skip',
    'não avançar para perguntas clínicas neste lote',
  ],
}
