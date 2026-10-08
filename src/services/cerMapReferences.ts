import type { CerMapReference } from '@/types/cerMapReadings'

// Verified primary/institutional sources. These explain frameworks, not individual diagnoses.
export const CER_MAP_REFERENCES: CerMapReference[] = [
  {
    id: 'prakriti',
    citation:
      'Bhojani, M. K.; Tanwar, A. K. (2021). Deha prakriti. Charak Samhita Research, Training and Development Centre. DOI: 10.47468/CSNE.2021.e01.s09.077.',
    url: 'https://www.carakasamhitaonline.com/index.php/Deha_prakriti',
    kind: 'tradição',
    scope: 'Referencial ayurvédico de constituição, doshas e tendências de funcionamento.',
  },
  {
    id: 'agni',
    citation: 'Charak Samhita Research, Training and Development Centre. Agni. Edição online.',
    url: 'https://www.carakasamhitaonline.com/index.php/Agni',
    kind: 'tradição',
    scope: 'Referencial tradicional para observar fome, digestão e transformação.',
  },
  {
    id: 'ama',
    citation: 'Charak Samhita Research, Training and Development Centre. Ama. Edição online.',
    url: 'https://carakasamhitaonline.com/index.php?title=Ama',
    kind: 'tradição',
    scope: 'Referencial tradicional sobre sinais de processamento incompleto.',
  },
  {
    id: 'ayurveda-evidence',
    citation: 'NCCIH / National Institutes of Health. Ayurvedic Medicine: In Depth.',
    url: 'https://www.nccih.nih.gov/health/ayurvedic-medicine-in-depth',
    kind: 'institucional',
    scope: 'Apresenta o estado das evidências científicas sobre Ayurveda.',
  },
  {
    id: 'emotion',
    citation:
      'Gross, J. J. (1998). Antecedent- and response-focused emotion regulation: divergent consequences for experience, expression, and physiology. Journal of Personality and Social Psychology, 74(1), 224–237. DOI: 10.1037/0022-3514.74.1.224.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/9457784/',
    kind: 'pesquisa',
    scope: 'Estudo sobre estratégias de regulação emocional e seus efeitos.',
  },
  {
    id: 'stress',
    citation:
      'McEwen, B. S. (1998). Protective and damaging effects of stress mediators. New England Journal of Medicine, 338, 171–179. DOI: 10.1056/NEJM199801153380307.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/9428819/',
    kind: 'pesquisa',
    scope: 'Discute adaptação ao estresse e sobrecarga.',
  },
  {
    id: 'attachment',
    citation:
      'Fraley, R. C.; Roisman, G. I. (2019). The development of adult attachment styles: four lessons. Current Opinion in Psychology, 25, 26–30. DOI: 10.1016/j.copsyc.2018.02.008.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29510301/',
    kind: 'pesquisa',
    scope: 'Discute desenvolvimento e variação do apego ao longo da vida e dos vínculos.',
  },
  {
    id: 'sexual-health',
    citation: 'World Health Organization. Sexual health: overview and working definitions.',
    url: 'https://www.who.int/health-topics/sexual-health',
    kind: 'institucional',
    scope:
      'Fundamenta uma abordagem que inclui bem-estar, respeito, segurança e liberdade de escolha na sexualidade.',
  },
  {
    id: 'meaning',
    citation:
      'Ryan, R. M.; Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. American Psychologist, 55(1), 68–78. DOI: 10.1037/0003-066X.55.1.68.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/11392867/',
    kind: 'pesquisa',
    scope: 'Referencial sobre autonomia, competência, vínculo e motivação.',
  },
  {
    id: 'cer',
    citation:
      'Método CER — Consciência, Equilíbrio e Realização. Conteúdo autoral de Daiane: organização integrativa e Padrões de Proteção CER.',
    kind: 'método',
    scope: 'Estrutura de compreensão e diálogo do Método CER.',
  },
]
