import pb from '@/lib/pocketbase/client'
import { demoAdapter, DEMO_ENROLLMENT_ID } from './demoAdapter'

export const CYCLE_CONTEXTS = {
  natural: 'Ciclos espontâneos',
  irregular: 'Ciclos irregulares / não sei',
  hormonal: 'Uso de contracepção hormonal',
  perimenopause: 'Perimenopausa',
  menopause: 'Pós-menopausa',
  pregnancy: 'Gestação',
  postpartum: 'Pós-parto / amamentação',
} as const
export type CycleContext = keyof typeof CYCLE_CONTEXTS
export interface CycleProfile {
  id?: string
  enrollment_id: string
  context: CycleContext
  cycle_length: number
  lunar_reflections: boolean
  planner_reminders: boolean
}
export interface CycleEntry {
  id?: string
  thoughts?: string
  cycle_signs?: string[]
  enrollment_id: string
  day: string
  energy: number
  emotions: string[]
  symptoms: string[]
  intensity: number
  appetite: string
  impact: string
  bleeding: string
  period_start: boolean
  sleep: string
  context_note: string
  reflection: string
  need: string
  care: string
  care_response: string
  access_class: 'participant_private' | 'participant_shared'
}
export const CYCLE_SIGNS = ['TPM percebida', 'Sinais de ovulação percebidos', 'Não sei identificar']
export const EMOTIONS = [
  'Tranquila',
  'Alegre',
  'Triste',
  'Irritada',
  'Ansiosa',
  'Sensível',
  'Entusiasmada',
  'Introspectiva',
  'Outra',
]
export const SYMPTOMS = [
  'Sem desconforto',
  'Cólica',
  'Inchaço',
  'Dor de cabeça',
  'Sensibilidade nas mamas',
  'Calor / suor',
  'Desconforto digestivo',
  'Tensão',
  'Outro',
]
export const APPETITES = ['Menor', 'Habitual', 'Maior', 'Diferente do habitual']
export const IMPACTS = ['Não interferiu', 'Precisei adaptar', 'Impediu uma atividade']
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function dayDate(day: string) {
  return new Date(`${day}T12:00:00`)
}
export function addDays(day: string, days: number) {
  const d = dayDate(day)
  d.setDate(d.getDate() + days)
  return localDay(d)
}
export function distanceDays(a: string, b: string) {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000)
}
export function validDay(day: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    Number.isFinite(dayDate(day).getTime()) &&
    localDay(dayDate(day)) === day
  )
}
export function emptyCycleEntry(enrollment_id: string, day = localDay()): CycleEntry {
  return {
    enrollment_id,
    day,
    energy: 0,
    emotions: [],
    symptoms: [],
    intensity: 0,
    appetite: '',
    impact: '',
    bleeding: '',
    period_start: false,
    sleep: '',
    context_note: '',
    reflection: '',
    need: '',
    care: '',
    care_response: '',
    access_class: 'participant_private',
  }
}
export function defaultCycleProfile(enrollment_id: string): CycleProfile {
  return {
    enrollment_id,
    context: 'irregular',
    cycle_length: 0,
    lunar_reflections: false,
    planner_reminders: false,
  }
}
export function validateCycleEntry(e: CycleEntry) {
  if (e.thoughts !== undefined && (typeof e.thoughts !== 'string' || e.thoughts.length > 5000))
    throw new Error('O campo de pensamentos pode ter até 5.000 caracteres.')
  if (
    e.cycle_signs !== undefined &&
    (!Array.isArray(e.cycle_signs) ||
      e.cycle_signs.length > 2 ||
      new Set(e.cycle_signs).size !== e.cycle_signs.length ||
      e.cycle_signs.some((v) => !CYCLE_SIGNS.includes(v)) ||
      (e.cycle_signs.includes('Não sei identificar') && e.cycle_signs.length > 1))
  )
    throw new Error('Confira os sinais do ciclo percebidos.')
  if (!e.enrollment_id || !validDay(e.day) || e.day > localDay())
    throw new Error('Escolha uma data válida, até hoje.')
  if (
    !Number.isInteger(e.energy) ||
    e.energy < 0 ||
    e.energy > 5 ||
    !Number.isInteger(e.intensity) ||
    e.intensity < 0 ||
    e.intensity > 3
  )
    throw new Error('Confira energia e intensidade.')
  if (
    !Array.isArray(e.emotions) ||
    e.emotions.length > 2 ||
    e.emotions.some((v) => !EMOTIONS.includes(v)) ||
    !Array.isArray(e.symptoms) ||
    e.symptoms.some((v) => !SYMPTOMS.includes(v))
  )
    throw new Error('Confira as opções do registro.')
  for (const [value, options] of [
    [e.appetite, APPETITES],
    [e.impact, IMPACTS],
    [e.bleeding, ['Sem sangramento', 'Escape', 'Leve', 'Moderado', 'Intenso']],
    [e.care_response, ['Ajudou', 'Ajudou um pouco', 'Não percebi diferença', 'Me fez pior']],
  ] as [string, string[]][])
    if (value && !options.includes(value)) throw new Error('Confira as opções escolhidas.')
  if (e.symptoms.includes('Sem desconforto') && e.symptoms.length > 1)
    throw new Error('Escolha sem desconforto ou os sintomas percebidos.')
  if (e.period_start && !['Leve', 'Moderado', 'Intenso'].includes(e.bleeding))
    throw new Error('Marque o fluxo menstrual antes de indicar o início da menstruação.')
  for (const key of ['sleep', 'context_note', 'reflection', 'need', 'care'] as const)
    if (typeof e[key] !== 'string' || e[key].length > 5000)
      throw new Error('Cada texto pode ter até 5.000 caracteres.')
  if (!['participant_private', 'participant_shared'].includes(e.access_class))
    throw new Error('Confira a privacidade.')
}
export function validateCycleProfile(p: CycleProfile) {
  if (
    !p.enrollment_id ||
    !Object.hasOwn(CYCLE_CONTEXTS, p.context) ||
    !Number.isInteger(p.cycle_length) ||
    (p.cycle_length !== 0 && (p.cycle_length < 21 || p.cycle_length > 45)) ||
    typeof p.lunar_reflections !== 'boolean' ||
    typeof p.planner_reminders !== 'boolean'
  )
    throw new Error('Confira seu momento e a duração habitual (21 a 45 dias, ou deixe em branco).')
}
export function visibleCycleEntries(
  values: CycleEntry[],
  enrollment: string,
  professional = false,
) {
  return values
    .filter(
      (v) =>
        v.enrollment_id === enrollment &&
        (!professional || v.access_class === 'participant_shared'),
    )
    .sort((a, b) => a.day.localeCompare(b.day))
}
function demoScope(id: string, writing = false) {
  if (id !== DEMO_ENROLLMENT_ID || (writing && demoAdapter.getActivePersona() !== 'mariana'))
    throw new Error('Este registro pertence à interagente da demonstração.')
}
const demoKey = (id: string, kind: string) => `cer-demo-cycle-v1:${id}:${kind}`
function readDemo<T>(id: string, kind: string, fallback: T): T {
  const raw = localStorage.getItem(demoKey(id, kind))
  return raw ? JSON.parse(raw) : fallback
}
function notify(id: string) {
  window.dispatchEvent(
    new CustomEvent('cer-cycle-journal-changed', { detail: { enrollmentId: id } }),
  )
}
export const cycleJournalService = {
  async profile(id: string): Promise<CycleProfile> {
    if (demoAdapter.isEnabled()) {
      demoScope(id)
      if (demoAdapter.getActivePersona() !== 'mariana')
        throw new Error('Preferências pessoais são privadas.')
      return readDemo(id, 'profile', defaultCycleProfile(id))
    }
    const list = await pb.collection('cer_cycle_profiles').getFullList<CycleProfile>({
      filter: pb.filter('enrollment_id = {:id}', { id }),
      requestKey: null,
    })
    return list[0] || defaultCycleProfile(id)
  },
  async saveProfile(value: CycleProfile) {
    validateCycleProfile(value)
    const { id, ...data } = value
    let saved: CycleProfile
    if (demoAdapter.isEnabled()) {
      demoScope(value.enrollment_id, true)
      saved = { ...data, id: id || `demo-cycle-profile-${crypto.randomUUID()}` }
      localStorage.setItem(demoKey(value.enrollment_id, 'profile'), JSON.stringify(saved))
    } else {
      saved = await (id
        ? pb.collection('cer_cycle_profiles').update<CycleProfile>(id, data)
        : pb.collection('cer_cycle_profiles').create<CycleProfile>(data))
    }
    notify(value.enrollment_id)
    return saved
  },
  async list(id: string): Promise<CycleEntry[]> {
    if (demoAdapter.isEnabled()) {
      demoScope(id)
      return visibleCycleEntries(
        readDemo(id, 'entries', []),
        id,
        demoAdapter.getActivePersona() === 'daiane',
      )
    }
    return pb.collection('cer_cycle_entries').getFullList<CycleEntry>({
      filter: pb.filter('enrollment_id = {:id}', { id }),
      sort: 'day',
      requestKey: null,
    })
  },
  async save(value: CycleEntry): Promise<CycleEntry> {
    validateCycleEntry(value)
    const { id, ...data } = value
    let saved: CycleEntry
    if (demoAdapter.isEnabled()) {
      demoScope(value.enrollment_id, true)
      const all = readDemo<CycleEntry[]>(value.enrollment_id, 'entries', [])
      if (id && !all.some((v) => v.id === id && v.day === value.day))
        throw new Error('Registro não encontrado. Recarregue antes de editar.')
      if (!id && all.some((v) => v.day === value.day))
        throw new Error('Já existe um registro neste dia. Recarregue para editá-lo.')
      saved = { ...data, id: id || `demo-cycle-${crypto.randomUUID()}` }
      localStorage.setItem(
        demoKey(value.enrollment_id, 'entries'),
        JSON.stringify([...all.filter((v) => v.id !== saved.id), saved]),
      )
    } else {
      saved = await (id
        ? pb.collection('cer_cycle_entries').update<CycleEntry>(id, data)
        : pb.collection('cer_cycle_entries').create<CycleEntry>(data))
    }
    notify(value.enrollment_id)
    return saved
  },
  async remove(value: CycleEntry) {
    if (!value.id) return
    if (demoAdapter.isEnabled()) {
      demoScope(value.enrollment_id, true)
      const all = readDemo<CycleEntry[]>(value.enrollment_id, 'entries', [])
      localStorage.setItem(
        demoKey(value.enrollment_id, 'entries'),
        JSON.stringify(all.filter((v) => v.id !== value.id)),
      )
    } else await pb.collection('cer_cycle_entries').delete(value.id)
    notify(value.enrollment_id)
  },
}
export function cyclePosition(entries: CycleEntry[], profile: CycleProfile, day: string) {
  const current = entries.find((v) => v.day === day)
  if (['menopause', 'pregnancy', 'postpartum', 'hormonal'].includes(profile.context))
    return { label: 'Acompanhe seu ritmo', estimated: false, day: 0 }
  const anchor = entries
    .filter((v) => v.period_start && v.day <= day)
    .sort((a, b) => b.day.localeCompare(a.day))[0]
  if (!anchor) return { label: 'Fase não identificada', estimated: false, day: 0 }
  const d = distanceDays(anchor.day, day) + 1
  if (current && ['Leve', 'Moderado', 'Intenso'].includes(current.bleeding))
    return { label: 'Menstruação registrada', estimated: false, day: d }
  if (profile.context !== 'natural' || !profile.cycle_length || d > profile.cycle_length)
    return { label: 'Fase não identificada', estimated: false, day: d }
  const ovulation = profile.cycle_length - 14
  return {
    label:
      d < ovulation - 1
        ? 'Folicular estimada'
        : d <= ovulation + 1
          ? 'Período ovulatório estimado'
          : 'Lútea estimada',
    estimated: true,
    day: d,
  }
}
export const LUNAR_THEMES = [
  {
    name: 'Nova',
    symbol: '🌑',
    theme: 'Recolhimento e intenção',
    question: 'O que precisa de espaço para nascer em mim?',
  },
  {
    name: 'Crescente',
    symbol: '🌓',
    theme: 'Cultivo e experimentação',
    question: 'O que desejo nutrir, respeitando minha energia?',
  },
  {
    name: 'Cheia',
    symbol: '🌕',
    theme: 'Presença e expressão',
    question: 'O que está mais evidente em mim?',
  },
  {
    name: 'Minguante',
    symbol: '🌗',
    theme: 'Revisão e descanso',
    question: 'O que posso concluir, aliviar ou deixar ir?',
  },
]
// Meeus, Astronomical Algorithms, cap. 49: principais correções da lua nova.
// Efeméride aproximada, não destinada à astronomia de precisão. Sem chamadas externas.
function newMoon(k: number) {
  const t = k / 1236.85
  const rad = Math.PI / 180
  const sin = (v: number) => Math.sin(v * rad)
  const e = 1 - 0.002516 * t - 0.0000074 * t * t
  const m = 2.5534 + 29.1053567 * k - 0.0000014 * t * t
  const mp = 201.5643 + 385.81693528 * k + 0.0107582 * t * t
  const f = 160.7108 + 390.67050284 * k - 0.0016118 * t * t
  const o = 124.7746 - 1.56375588 * k + 0.0020672 * t * t
  return (
    2451550.09765 +
    29.530588853 * k +
    0.0001337 * t * t -
    0.00000015 * t * t * t -
    0.4072 * sin(mp) +
    0.17241 * e * sin(m) +
    0.01608 * sin(2 * mp) +
    0.01039 * sin(2 * f) +
    0.00739 * e * sin(mp - m) -
    0.00514 * e * sin(mp + m) +
    0.00208 * e * e * sin(2 * m) -
    0.00111 * sin(mp - 2 * f) -
    0.00057 * sin(mp + 2 * f) +
    0.00056 * e * sin(2 * mp + m) -
    0.00042 * sin(3 * mp) +
    0.00042 * e * sin(m + 2 * f) +
    0.00038 * e * sin(m - 2 * f) -
    0.00024 * e * sin(2 * mp - m) -
    0.00017 * sin(o)
  )
}
export function lunarPhase(day: string) {
  const jd = dayDate(day).getTime() / 86400000 + 2440587.5
  let k = Math.floor((jd - 2451550.09765) / 29.530588853)
  while (newMoon(k) > jd) k--
  while (newMoon(k + 1) <= jd) k++
  const fraction = (jd - newMoon(k)) / (newMoon(k + 1) - newMoon(k))
  const eight = Math.round(fraction * 8) % 8
  const symbols = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘']
  const names = [
    'Nova',
    'Crescente',
    'Quarto crescente',
    'Gibosa crescente',
    'Cheia',
    'Gibosa minguante',
    'Quarto minguante',
    'Minguante',
  ]
  const theme = eight === 0 ? 0 : eight < 4 ? 1 : eight === 4 ? 2 : 3
  return { fraction, symbol: symbols[eight], name: names[eight], theme: LUNAR_THEMES[theme] }
}
