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

/**
 * Manifest visual do Microlote Visual Final do Capítulo 1 (Pele e Cabelo)
 * 12 cards clínicos recortados deterministicamente em grade 3x2 (356x356) a partir das pranchas canônicas.
 */
export interface AyurvedaClinicalCardAsset {
  id: string
  optionId: string
  category: 'skin' | 'hair'
  file: string
  width: number
  height: number
  format: 'png'
  description: string
}

export const AYURVEDA_CLINICAL_CARDS_MANIFEST: AyurvedaClinicalCardAsset[] = [
  // 6 cards de pele (3 colunas x 2 linhas de 356x356)
  {
    id: 'ayv_card_skin_dry_rough',
    optionId: 'dry_rough',
    category: 'skin',
    file: '/assets/ayurveda/ayv-skin-dry_rough.png',
    width: 356,
    height: 356,
    format: 'png',
    description: 'Pele seca, áspera ou repuxando com facilidade',
  },
  {
    id: 'ayv_card_skin_thin_reactive',
    optionId: 'thin_reactive',
    category: 'skin',
    file: '/assets/ayurveda/ayv-skin-thin_reactive.png',
    width: 356,
    height: 356,
    format: 'png',
    description: 'Pele fina ou delicada, reage facilmente ao ambiente',
  },
  {
    id: 'ayv_card_skin_warm_sensitive',
    optionId: 'warm_sensitive',
    category: 'skin',
    file: '/assets/ayurveda/ayv-skin-warm_sensitive.png',
    width: 356,
    height: 356,
    format: 'png',
    description: 'Pele quente, sensível ou avermelha com facilidade',
  },
  {
    id: 'ayv_card_skin_balanced',
    optionId: 'balanced',
    category: 'skin',
    file: '/assets/ayurveda/ayv-skin-balanced.png',
    width: 356,
    height: 356,
    format: 'png',
    description: 'Pele equilibrada em textura e hidratação',
  },
  {
    id: 'ayv_card_skin_soft_oily',
    optionId: 'soft_oily',
    category: 'skin',
    file: '/assets/ayurveda/ayv-skin-soft_oily.png',
    width: 356,
    height: 356,
    format: 'png',
    description: 'Pele macia, úmida ou naturalmente oleosa',
  },
  {
    id: 'ayv_card_skin_varies_region',
    optionId: 'varies_region',
    category: 'skin',
    file: '/assets/ayurveda/ayv-skin-varies_region.png',
    width: 356,
    height: 356,
    format: 'png',
    description: 'Pele com comportamento variado conforme região ou estação',
  },

  // 6 cards de cabelo (3 colunas x 2 linhas de 356x356)
  {
    id: 'ayv_card_hair_fine_delicate',
    optionId: 'fine_delicate',
    category: 'hair',
    file: '/assets/ayurveda/ayv-hair-fine_delicate.png',
    width: 356,
    height: 356,
    format: 'png',
    description: 'Fios finos ou delicados',
  },
  {
    id: 'ayv_card_hair_dry_tangled',
    optionId: 'dry_tangled',
    category: 'hair',
    file: '/assets/ayurveda/ayv-hair-dry_tangled.png',
    width: 356,
    height: 356,
    format: 'png',
    description: 'Fios tendem a ressecar, embaraçar ou quebrar com facilidade',
  },
  {
    id: 'ayv_card_hair_balanced',
    optionId: 'balanced',
    category: 'hair',
    file: '/assets/ayurveda/ayv-hair-balanced.png',
    width: 356,
    height: 356,
    format: 'png',
    description: 'Fios intermediários, comportamento relativamente equilibrado',
  },
  {
    id: 'ayv_card_hair_thick_dense',
    optionId: 'thick_dense',
    category: 'hair',
    file: '/assets/ayurveda/ayv-hair-thick_dense.png',
    width: 356,
    height: 356,
    format: 'png',
    description: 'Fios grossos, densos ou pesados',
  },
  {
    id: 'ayv_card_hair_oily_roots',
    optionId: 'oily_roots',
    category: 'hair',
    file: '/assets/ayurveda/ayv-hair-oily_roots.png',
    width: 356,
    height: 356,
    format: 'png',
    description: 'Raiz naturalmente oleosa ou cabelo que pesa com facilidade',
  },
  {
    id: 'ayv_card_hair_mixed_varies',
    optionId: 'mixed_varies',
    category: 'hair',
    file: '/assets/ayurveda/ayv-hair-mixed_varies.png',
    width: 356,
    height: 356,
    format: 'png',
    description: 'Fios misturam características ou variam bastante',
  },
]

export function getAyurvedaClinicalCardImage(
  category: 'skin' | 'hair',
  optionId: string,
): string | undefined {
  const card = AYURVEDA_CLINICAL_CARDS_MANIFEST.find(
    (c) => c.category === category && c.optionId === optionId,
  )
  return card?.file
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
