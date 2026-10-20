import React, { useEffect, useState } from 'react'
import { Leaf, HeartHandshake, Compass, Check } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { lifeDirectionsService } from '@/services/lifeDirections'

const rounds = [
  {
    title: 'Olho para minha história',
    icon: Leaf,
    invitation: 'Escolha até três cartas que combinam com o que sua história pede hoje.',
    cards: [
      [
        'acolher',
        'Acolher o que doeu',
        'Posso reconhecer o impacto de uma experiência sem precisar revivê-la agora.',
      ],
      [
        'luto',
        'Dar lugar a uma perda',
        'Algo terminou ou mudou. Posso dar tempo ao meu luto, sem precisar superar depressa.',
      ],
      [
        'vinculo',
        'Rever um vínculo',
        'Talvez eu precise conversar, estabelecer um limite ou preservar distância.',
      ],
      [
        'perdao',
        'Explorar o perdão',
        'Só se fizer sentido para mim. Perdoar não exige esquecer, justificar ou retomar contato.',
      ],
      [
        'soltar',
        'Soltar uma expectativa',
        'Posso reconhecer o que não recebi e buscar outros caminhos de cuidado.',
      ],
      [
        'honrar',
        'Honrar o que me sustentou',
        'Minha história também guarda vínculos, aprendizados e forças que quero levar comigo.',
      ],
    ],
  },
  {
    title: 'Escolho como cuidar de mim hoje',
    icon: HeartHandshake,
    invitation: 'Escolha o que pode ajudar você a viver o presente com mais espaço.',
    cards: [
      ['apoio', 'Receber apoio', 'Não preciso sustentar tudo sem ajuda.'],
      ['limite', 'Comunicar um limite', 'Posso tornar minhas necessidades mais visíveis.'],
      ['pausa', 'Respeitar meu ritmo', 'Cuidar do corpo pode sustentar o que desejo realizar.'],
      [
        'novo',
        'Experimentar outra resposta',
        'Um padrão que me protegeu pode ganhar novas alternativas.',
      ],
    ],
  },
  {
    title: 'Abro espaço para o próximo capítulo',
    icon: Compass,
    invitation: 'Escolha o que deseja cultivar. Sua meta dará um primeiro caminho a essa intenção.',
    cards: [
      [
        'presenca',
        'Viver com mais presença',
        'Quero reservar espaço para o que tem sentido para mim.',
      ],
      ['leveza', 'Realizar com mais leveza', 'Quero avançar sem me abandonar no caminho.'],
      [
        'confianca',
        'Construir confiança',
        'Posso aprender com passos pequenos e ajustar o percurso.',
      ],
      [
        'escolha',
        'Fazer escolhas mais conscientes',
        'Minhas escolhas participam do futuro; apoio e condições de vida também importam.',
      ],
    ],
  },
]
export function LifeIntegrationGame({ enrollmentId }: { enrollmentId: string }) {
  const [step, setStep] = useState(0)
  const [context, setContext] = useState('')
  const [selected, setSelected] = useState<string[][]>([[], [], []])
  const [shared, setShared] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('')
  useEffect(() => {
    setStep(0)
    setContext('')
    setSelected([[], [], []])
    setShared(false)
    setNotice('')
  }, [enrollmentId])
  const round = rounds[step],
    Icon = round?.icon || Compass
  const summary =
    rounds
      .map(
        (r, i) =>
          `${r.title}: ${
            r.cards
              .filter((c) => selected[i].includes(c[0]))
              .map((c) => c[1])
              .join('; ') || 'Ainda em descoberta'
          }.`,
      )
      .join('\n') +
    (context.trim() ? `\nVínculo ou situação que desejo compreender: ${context.trim()}` : '')
  async function save() {
    setBusy(true)
    setNotice('')
    try {
      await lifeDirectionsService.save({
        enrollment_id: enrollmentId,
        kind: 'present',
        horizon: 'now',
        title: 'O que escolho levar da minha história',
        narrative: summary,
        meaning: '',
        resources: '',
        limits: '',
        first_step: '',
        access_class: shared ? 'participant_shared' : 'participant_private',
      })
      setNotice('Reflexão salva no seu presente. Você pode retomá-la antes de escolher sua meta.')
    } catch (e) {
      setNotice(
        e instanceof Error
          ? e.message
          : 'Não foi possível salvar. Suas escolhas continuam aqui para tentar novamente.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <section
      aria-label="Cartas do próximo capítulo"
      className="rounded-2xl border bg-primary/5 p-5 sm:p-7 space-y-4"
    >
      <p className="text-xs uppercase tracking-widest text-primary">
        Um jogo de escolhas · sem pontuação
      </p>
      <h3 className="font-serif text-xl">Cartas do próximo capítulo</h3>
      <p className="text-sm">
        Reconhecer o passado, cuidar do presente, abrir o futuro. Escolha as cartas que fazem
        sentido; você também pode passar. Nada aqui obriga a perdoar, confrontar alguém ou encerrar
        um luto.
      </p>
      {step < 3 ? (
        <>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <h4 className="font-medium">
              {step + 1}. {round.title}
            </h4>
          </div>
          <p className="text-sm text-muted-foreground">{round.invitation}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {round.cards.map(([id, title, text]) => {
              const chosen = selected[step].includes(id)
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={chosen}
                  className={`text-left rounded-2xl border p-4 min-h-28 space-y-2 focus-visible:ring-2 focus-visible:ring-primary ${chosen ? 'border-primary bg-primary/10' : 'bg-card hover:border-primary/50'}`}
                  onClick={() => {
                    setSelected((old) =>
                      old.map((values, i) =>
                        i !== step
                          ? values
                          : chosen
                            ? values.filter((v) => v !== id)
                            : values.length < 3
                              ? [...values, id]
                              : values,
                      ),
                    )
                  }}
                >
                  <span className="font-medium flex justify-between gap-2">
                    {title}
                    {chosen && <Check className="h-4 w-4 shrink-0" />}
                  </span>
                  <span className="block text-sm text-muted-foreground">{text}</span>
                </button>
              )
            })}
          </div>
          {step === 0 && (
            <label className="block text-sm space-y-2">
              Um vínculo ou situação que quero compreender melhor (opcional)
              <Textarea
                rows={2}
                maxLength={500}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Pode ser um nome, uma fase ou uma situação. Conte só o que desejar."
              />
            </label>
          )}
          <div className="flex gap-2 flex-wrap">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Voltar às cartas anteriores
              </Button>
            )}
            <Button onClick={() => setStep(step + 1)}>
              {selected[step].length ? 'Levar minhas escolhas adiante' : 'Passar por enquanto'}
            </Button>
          </div>
        </>
      ) : (
        <>
          <h4 className="font-medium">O que escolho levar comigo</h4>
          <p className="text-sm whitespace-pre-wrap">{summary}</p>
          <label className="flex gap-2 text-sm">
            <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />
            Compartilhar esta reflexão com minha profissional
          </label>
          <p className="text-xs text-muted-foreground">
            Suas escolhas só viram registro ao salvar. Desmarcado: só você acessa. Você pode voltar
            e mudar as cartas.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={busy} onClick={() => setStep(0)}>
              Rever minhas cartas
            </Button>
            <Button
              disabled={
                busy || !!notice.startsWith('Reflexão salva') || !selected.some((v) => v.length)
              }
              onClick={() => void save()}
            >
              {busy ? 'Salvando…' : 'Guardar esta reflexão no meu presente'}
            </Button>
          </div>
        </>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
    </section>
  )
}
