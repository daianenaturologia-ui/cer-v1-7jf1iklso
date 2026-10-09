export function PlannerGentleGuide() {
  return (
    <details className="group rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 sm:px-5">
      <summary className="cursor-pointer rounded-md font-serif text-base text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        Organizar para viver gostosamente
      </summary>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-foreground/85">
        <p>
          Sua agenda pode acolher o que importa para você e abrir espaço para viver. Quando
          você tira as tarefas da cabeça e dá a elas um lugar, pode dedicar sua atenção ao
          momento que está vivendo. O planejamento acompanha sua vida: você pode ajustá-lo
          conforme sua energia, seus compromissos e o que acontece no caminho.
        </p>
        <ol className="grid gap-4 sm:grid-cols-2 list-decimal pl-5 marker:text-primary">
          <li className="pl-1">
            <strong className="block text-foreground">Dê um lugar ao que está na sua mente.</strong>
            Anote as tarefas e escolha o que cabe nesta semana. Na agenda, toque em um dia
            e horário para reservar um momento. Comece por um pequeno passo possível.
          </li>
          <li className="pl-1">
            <strong className="block text-foreground">Reserve espaço para você também.</strong>
            Considere seus compromissos, refeições, descanso e coisas que gosta de fazer.
            Deixe intervalos para pausas e imprevistos. Sua energia participa do planejamento.
          </li>
          <li className="pl-1">
            <strong className="block text-foreground">Viva um momento de cada vez.</strong>
            Ao começar, volte a atenção ao que está fazendo e perceba seu corpo. Você pode
            soltar os ombros, sentir os pés no chão ou fazer uma pausa breve. Busque um jeito
            confortável de estar nessa experiência.
          </li>
          <li className="pl-1">
            <strong className="block text-foreground">Traga o que lhe faz bem para o cotidiano.</strong>
            Quando combinar com a atividade, uma música, uma mensagem inspiradora ou um
            gesto de cuidado pode acompanhar você. Cultive espaço para alegria, gratidão,
            amor e, se fizer sentido para você, fé. Não é preciso estar bem o tempo todo;
            acolha também os dias difíceis.
          </li>
          <li className="pl-1 sm:col-span-2">
            <strong className="block text-foreground">Reorganize com leveza.</strong>
            Se algo não couber no horário escolhido, tudo bem. Abra o momento e use Editar
            para escolher outro horário. Você também pode diminuir o passo. Reconheça o que
            conseguiu viver e use esse aprendizado para ajustar os próximos dias.
          </li>
        </ol>
        <p className="border-t border-primary/15 pt-3">
          As forças que você reconheceu no Mapa CER podem ajudar aqui: use uma delas para
          apoiar um passo concreto. Ao salvar uma estratégia no jogo, você pode levá-la
          à agenda e escolher quando deseja colocá-la em prática.
        </p>
      </div>
    </details>
  )
}
