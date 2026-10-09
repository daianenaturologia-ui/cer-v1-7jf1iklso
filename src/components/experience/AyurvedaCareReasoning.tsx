import type { AyurvedaBodyReading } from '@/types/cerMapReadings'
import type { ExperienceResponseRecord } from '@/types/cer'
import { ayurvedaCareDirections, ayurvedaReviewWindow } from '@/services/ayurvedaCareReasoning'
import { buildCerMapReadings } from '@/services/cerMapReadings'

export function AyurvedaCareReasoning({
  constitution = [],
  reading,
  responses,
}: {
  constitution?: string[]
  reading?: AyurvedaBodyReading
  responses?: ExperienceResponseRecord[]
}) {
  const directions = ayurvedaCareDirections(constitution, reading)
  const review = responses ? ayurvedaReviewWindow(responses) : undefined
  const date = (value: string) =>
    new Date(value).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  return (
    <section
      aria-label="Raciocínio de cuidado ayurvédico"
      className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3"
    >
      <h3 className="font-serif text-lg">Direção do cuidado · Ayurveda</h3>
      <p className="text-sm">
        <strong>Base:</strong> {constitution.join('–') || 'Em observação'} ·{' '}
        <strong>Momento:</strong> {reading?.currentDoshas.join('–') || 'Em observação'}
      </p>
      <p className="text-xs text-muted-foreground">
        Raciocínio inicial para revisão profissional. Objetivo: aproximar o funcionamento da
        Prakriti, regular Agni e diminuir Ama. As setas indicam direções de cuidado, não quantidades
        de doshas.
      </p>
      {directions.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {directions.map((d) => (
            <details key={d.label} className="rounded-xl border bg-background p-3">
              <summary className="cursor-pointer focus-visible:ring-2 focus-visible:ring-ring rounded-md">
                <span className="block text-2xl font-serif">
                  {d.label} <span aria-hidden="true">{d.symbol}</span>
                </span>
                <span className="text-xs">{d.action}</span>
              </summary>
              <p className="mt-3 text-xs leading-relaxed">{d.reason}</p>
            </details>
          ))}
        </div>
      ) : (
        <p className="text-sm">
          Leitura atual ainda insuficiente para definir as direções de cuidado.
        </p>
      )}
      <div className="border-t pt-3 text-xs space-y-1">
        <p>
          <strong>Reavaliação de Ayurveda: a cada 35 dias.</strong> Rever Vikriti, Agni e Ama;
          manter a hipótese constitucional como referência e aprofundá-la quando necessário.
        </p>
        {review ? (
          <p>
            Última avaliação: {date(review.assessedAt)} · Próxima: {date(review.dueAt)}
            {review.due ? ' · Reavaliação disponível' : ''}.
          </p>
        ) : (
          <p>A contagem começa com a conclusão da avaliação do momento atual.</p>
        )}
        <p>
          A nova avaliação atualiza esta síntese de respostas. Mapas apresentados e orientações
          anteriores permanecem no histórico; mudanças do plano serão preparadas com base na nova
          leitura.
        </p>
      </div>
    </section>
  )
}

export function ProfessionalAyurvedaCareReasoning({
  responses,
  participantName,
}: {
  responses: ExperienceResponseRecord[]
  participantName: string
}) {
  const body = buildCerMapReadings(responses, responses[0]?.enrollment_id || '', participantName, {
    literalOnly: true,
  }).dimensions.find((d) => d.id === 'corpo')
  return (
    <AyurvedaCareReasoning
      constitution={body?.ayurvedaConstitution}
      reading={body?.ayurvedaReading}
      responses={responses}
    />
  )
}
