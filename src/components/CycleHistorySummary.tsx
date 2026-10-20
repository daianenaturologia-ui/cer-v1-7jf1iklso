import React from 'react'
import { cycleHistory } from '@/services/cycleHistory'
import { dayDate, type CycleEntry, type CycleProfile } from '@/services/cycleJournal'
export function CycleHistorySummary({
  entries,
  profile,
}: {
  entries: CycleEntry[]
  profile: CycleProfile
}) {
  const info = cycleHistory(entries, profile)
  const date = (d: string) => dayDate(d).toLocaleDateString('pt-BR')
  return (
    <section className="cycle-card" aria-label="Meu histórico menstrual">
      <h3>Meu ciclo ao longo do tempo</h3>
      <p className="text-sm">
        O primeiro dia do fluxo menstrual inicia um novo ciclo. Marque essa opção uma vez por
        menstruação; os outros dias de fluxo podem ser registrados sem marcar um novo início.
      </p>
      {info.starts.length > 0 && (
        <p className="text-sm">
          Último início registrado: <strong>{date(info.starts.at(-1)!)}</strong>.
        </p>
      )}
      {info.recent.length > 0 && (
        <p className="text-sm">
          Últimos intervalos completos: <strong>{info.recent.join(' · ')} dias</strong>. Variação
          observada: {info.min} a {info.max} dias.
        </p>
      )}
      {info.next ? (
        <div className="rounded-xl bg-primary/10 p-4 space-y-2">
          <p className="text-sm font-medium">
            {info.pastReference
              ? 'A referência estimada pelo calendário foi'
              : 'Próximo início estimado: por volta de'}{' '}
            {date(info.next)}.
          </p>
          <p className="text-xs">
            {info.basis === 'history'
              ? `Referência pela mediana dos últimos ${info.recent.length} intervalos registrados.`
              : 'Referência pela duração habitual que você informou; ainda há poucos ciclos registrados.'}{' '}
            {info.pastReference
              ? 'Confira se houve um novo início que ainda precisa ser registrado.'
              : ''}{' '}
            A data pode mudar e não indica, sozinha, se o ciclo está regular.
          </p>
        </div>
      ) : (
        <p className="text-sm">{info.reason}</p>
      )}
      <details>
        <summary className="cursor-pointer text-sm">Como entender esta estimativa</summary>
        <p className="text-sm mt-2">
          A estimativa usa as datas que você registrou no calendário. Não confirma ovulação ou
          período fértil e não deve orientar decisões para engravidar ou evitar gravidez. Mudanças
          persistentes no ciclo podem ser discutidas com sua profissional e com a ginecologista.
        </p>
        <a
          className="text-xs underline"
          href="https://www.acog.org/womens-health/faqs/fertility-awareness-based-methods-of-family-planning"
          target="_blank"
          rel="noreferrer"
        >
          Saiba mais sobre ciclos e limites do calendário · ACOG
        </a>
      </details>
    </section>
  )
}
