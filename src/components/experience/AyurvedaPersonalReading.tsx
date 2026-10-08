import type { ReactNode } from 'react'
import type { CerMapReadingDimension } from '@/types/cerMapReadings'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

type Dosha = 'Vata' | 'Pitta' | 'Kapha'
const profiles: Record<Dosha, { body: string; mind: string; emotion: string; strengths: string }> =
  {
    Vata: {
      body: 'Vata reúne movimento, leveza e variabilidade. Na descrição tradicional, pode aparecer em uma estrutura mais leve, pele ou cabelos com tendência ao ressecamento e sensibilidade ao frio. Fome, disposição e sono podem mudar mais entre um dia e outro. Essa variabilidade ajuda a compreender por que regularidade e recuperação costumam ter valor para esse perfil.',
      mind: 'No funcionamento mental descrito pela tradição, Vata se relaciona à rapidez para perceber estímulos, fazer associações e imaginar caminhos. A abertura para o novo favorece criatividade e adaptação; com excesso de estímulos, essa mesma mobilidade pode se tornar dispersão e dificuldade para desacelerar.',
      emotion:
        'Na experiência emocional descrita para esse perfil, sensibilidade e mudanças rápidas podem coexistir. Em períodos de maior exigência, insegurança e inquietação são tendências tradicionais possíveis. Elas não constituem um diagnóstico de ansiedade nem substituem a leitura da sua história.',
      strengths:
        'As potencialidades tradicionalmente associadas a Vata são criatividade, flexibilidade, sensibilidade e capacidade de enxergar alternativas. A força desse movimento está em abrir caminhos e responder ao novo.',
    },
    Pitta: {
      body: 'Pitta reúne transformação, intensidade e calor. A descrição tradicional inclui fome mais intensa, maior sensibilidade a ambientes quentes e pele que pode reagir com calor ou vermelhidão. O organismo é descrito com maior intensidade dos ritmos; isso não significa medir seu metabolismo nem concluir que sua digestão está sempre boa.',
      mind: 'Pitta é associado à clareza para compreender, comparar, decidir e direcionar esforços. Essa capacidade favorece organização e discernimento. Sob maior exigência, a busca de precisão pode se estreitar em cobrança, impaciência ou dificuldade para aceitar imprevistos.',
      emotion:
        'Na descrição tradicional, entusiasmo e determinação podem vir acompanhados de intensidade emocional. Quando há desgaste, frustração e irritabilidade são tendências possíveis. A presença delas na sua vida precisa de relatos específicos; a constituição não determina sua personalidade.',
      strengths:
        'As potencialidades tradicionalmente associadas a Pitta são discernimento, foco, iniciativa e capacidade de transformar uma intenção em ação. Essa força ajuda a dar direção e sentido ao esforço.',
    },
    Kapha: {
      body: 'Kapha reúne sustentação, estabilidade e continuidade. A descrição tradicional inclui estrutura mais sólida, maior constância dos ritmos e sono mais profundo. Essa sustentação pode favorecer resistência e recuperação; quando se altera, a experiência pode ganhar peso e lentidão. O perfil não permite presumir seu peso corporal ou sua saúde.',
      mind: 'Kapha é associado à capacidade de manter atenção, consolidar aprendizados e continuar processos. A continuidade favorece memória e consistência. Sob maior exigência, pode haver dificuldade para sair de um ritmo conhecido e incorporar mudanças.',
      emotion:
        'A descrição tradicional valoriza estabilidade, paciência e disponibilidade afetiva. Em períodos de desgaste, recolhimento e apego ao que oferece segurança são tendências possíveis. O modo como você vive os vínculos depende da sua história, além dessa lente.',
      strengths:
        'As potencialidades tradicionalmente associadas a Kapha são constância, paciência, sustentação e capacidade de construir continuidade. Essa força ajuda a manter o que tem valor ao longo do tempo.',
    },
  }
function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <AccordionItem value={id}>
      <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
        {title}
      </AccordionTrigger>
      <AccordionContent className="space-y-3 text-sm leading-relaxed text-foreground/90">
        {children}
      </AccordionContent>
    </AccordionItem>
  )
}
function Evidence({ items }: { items: string[] }) {
  return items.length ? (
    <div className="space-y-2 rounded-lg bg-primary/5 p-3">
      <h4 className="font-semibold">O que suas respostas mostram</h4>
      {[...new Set(items)].map((text, i) => (
        <p key={i}>{text}</p>
      ))}
    </div>
  ) : null
}
export function AyurvedaPersonalReading({
  dimension,
  participantName,
  interpretationTitle: _interpretationTitle,
}: {
  dimension: CerMapReadingDimension
  participantName: string
  interpretationTitle: string
}) {
  const doshas = [...new Set(dimension.ayurvedaConstitution || [])].filter((d) =>
    ['Vata', 'Pitta', 'Kapha'].includes(d),
  )
  const pair = doshas.join('–')
  const reading = dimension.ayurvedaReading
  const vp = doshas.length === 2 && doshas.includes('Vata') && doshas.includes('Pitta')
  const vk =
    reading?.currentDoshas.length === 2 &&
    reading.currentDoshas.includes('Vata') &&
    reading.currentDoshas.includes('Kapha')
  return (
    <div className="space-y-4" data-testid="ayurveda-personal-reading">
      <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-2">
        <h3 className="font-semibold">Seu corpo pela lente do Ayurveda</h3>
        <p>
          Por que algumas pessoas precisam de mais regularidade para se sentir bem, enquanto outras
          percebem mais necessidade de movimento, descanso ou pausas? O Ayurveda, uma tradição de
          cuidado originária da Índia, oferece uma maneira de observar essas diferenças.
        </p>
      </div>
      <Accordion type="multiple" className="rounded-lg border bg-card/60 px-4">
        <Section id="doshas" title="Entenda os doshas e suas combinações">
          <p>
            Essa tradição descreve três princípios de funcionamento, chamados{' '}
            <strong>doshas</strong>:
          </p>
          <p>
            <strong>Vata:</strong> associado ao movimento e à variabilidade. <strong>Pitta:</strong>{' '}
            associado à transformação e ao calor. <strong>Kapha:</strong> associado à sustentação e
            à estabilidade.
          </p>
          <p>
            Na perspectiva ayurvédica, todas as pessoas apresentam os três doshas, em combinações
            diferentes. Eles ajudam a interpretar tendências do corpo e aspectos da experiência
            mental e emocional. Não são medidas biológicas nem definições fixas de personalidade.
          </p>
          <h4 className="font-semibold">Um jeito de compreender suas combinações</h4>
          <p>
            Imagine que movimento, transformação e sustentação estão presentes em você, mas não
            aparecem sempre com a mesma intensidade. Em algumas constituições, um desses princípios
            se destaca; em outras, dois ou os três compõem a base. Por isso falamos em Vata, Pitta,
            Kapha, Vata–Pitta, Vata–Kapha, Pitta–Kapha e Vata–Pitta–Kapha.
          </p>
          <p>
            O nome da combinação ajuda a reunir as características que se repetem no seu
            funcionamento. Ele ganha sentido quando lemos essas características em conjunto. A ordem
            dos nomes só indica predominância quando as respostas permitem essa distinção; uma
            contagem empatada, sozinha, não confirma equilíbrio entre os três.
          </p>
        </Section>
        <Section id="base-atual" title="Prakriti e Vikriti: sua base e seu momento">
          <h4 className="font-semibold">Prakriti: suas tendências de base</h4>
          <p>
            Prakriti é o nome dado à sua constituição original. Para explorar essa hipótese,
            observamos características que costumam acompanhar você há bastante tempo: estrutura
            corporal, sensibilidade à temperatura, fome, digestão, sono e ritmo de funcionamento.
          </p>
          <p>
            Conhecer essas tendências pode ajudar você a reconhecer suas necessidades e perceber
            quais condições favorecem seu bem-estar.
          </p>
          <h4 className="font-semibold">Vikriti: o que pede cuidado agora</h4>
          <p>
            Vikriti descreve, nessa tradição, alterações do funcionamento atual em relação às suas
            tendências de base.
          </p>
          <p>
            Alimentação, horários, qualidade do sono, exigências da rotina, clima, adoecimento e
            experiências de estresse podem participar dessas mudanças. Isso não significa que você
            fez algo errado: seu corpo responde às condições em que vive.
          </p>
          <p>
            O questionário separou seu funcionamento habitual das mudanças atuais. A leitura a
            seguir reúne essas respostas para explicar sua base e o que pede cuidado neste momento.
          </p>
        </Section>
        <Section id="uso-cer" title="Como usamos essa leitura no CER">
          <p>
            O Ayurveda participa do CER como uma lente de autoconhecimento e cuidado. Suas
            tendências de base e suas necessidades atuais serão consideradas junto com sua história,
            suas condições de saúde e sua realidade cotidiana.
          </p>
          <p>
            Este questionário oferece uma avaliação inicial. Ele não substitui uma consulta
            aprofundada nem estabelece uma definição definitiva. Quando faltarem informações, o mapa
            indicará o que ainda precisamos compreender.
          </p>
          <p>
            Se quiser aprofundar essa descoberta, converse com Daiane. Juntas, vocês poderão
            reconhecer o que faz sentido, esclarecer dúvidas e construir cuidados possíveis para sua
            vida.
          </p>
        </Section>
      </Accordion>
      <div className="space-y-2">
        <h3 className="font-semibold">{participantName}, vamos conhecer seu jeito de funcionar?</h3>
        <p>
          {doshas.length
            ? `Suas respostas sustentam uma hipótese constitucional ${pair}. A leitura reúne suas características de base e explica como elas se relacionam com seu momento atual.`
            : 'Ainda precisamos conhecer melhor suas tendências de base para definir uma hipótese constitucional. O resultado disponível é a descrição do que você já compartilhou, sem preencher lacunas com características presumidas.'}
        </p>
        <p>
          Sua experiência é o centro deste mapa. As características tradicionais do perfil ajudam a
          compreender tendências; os trechos sobre o seu momento se apoiam nas respostas
          registradas.
        </p>
      </div>
      <Accordion type="multiple" className="rounded-lg border bg-card/60 px-4">
        {doshas.length > 0 && (
          <Section id="constituicao" title={`Sua constituição: conhecendo ${pair}`}>
            {vp && (
              <>
                <p>
                  Vata–Pitta combina a abertura para perceber e imaginar com a capacidade de
                  compreender e direcionar. É a imagem de um funcionamento que encontra caminhos e
                  busca transformá-los em realização. Curiosidade, sensibilidade e determinação
                  podem se encontrar nessa constituição.
                </p>
                <p>
                  Essa combinação reúne qualidades diferentes: Vata tende à variabilidade e ao frio;
                  Pitta, à intensidade e ao calor. Por isso, um mesmo perfil pode apresentar
                  ressecamento e sensibilidade da pele, fome mais intensa em alguns momentos e
                  ritmos variáveis em outros. A combinação não exige que você sinta frio e calor ao
                  mesmo tempo, nem que apresente todas essas características.
                </p>
              </>
            )}
            {!vp && (
              <p>
                Na constituição {pair}, os princípios envolvidos se combinam. Suas qualidades ajudam
                a compreender tanto os recursos desse perfil quanto as áreas que tendem a sentir
                mais as mudanças de ritmo e as exigências da vida.
              </p>
            )}
            <h4 className="font-semibold">Funcionamento físico</h4>
            {doshas.map((d) => (
              <p key={`body-${d}`}>{profiles[d].body}</p>
            ))}
            <h4 className="font-semibold">Funcionamento mental</h4>
            {doshas.map((d) => (
              <p key={`mind-${d}`}>{profiles[d].mind}</p>
            ))}
            {vp && (
              <p>
                No encontro entre os dois princípios, a rapidez para criar pode ganhar direção e
                análise. Quando há sobrecarga, a quantidade de ideias e a exigência de resolver bem
                podem se reforçar: fica mais difícil desacelerar e aceitar que o corpo precisa de
                recuperação. Essa é uma tendência descrita para o perfil, e não uma conclusão
                automática sobre seus pensamentos.
              </p>
            )}
            <h4 className="font-semibold">Funcionamento emocional</h4>
            {doshas.map((d) => (
              <p key={`emotion-${d}`}>{profiles[d].emotion}</p>
            ))}
            {vp && (
              <p>
                A sensibilidade de Vata e a intensidade de Pitta podem formar uma experiência
                emocional viva: perceber muito e reagir com força. Em períodos de maior equilíbrio,
                isso pode favorecer interesse, entusiasmo e presença; sob desgaste, inquietação e
                irritabilidade podem coexistir. Esses movimentos precisam ser diferenciados dos
                resultados específicos de Mente & Emoções.
              </p>
            )}
            <Evidence items={reading?.constitutionEvidence || []} />
          </Section>
        )}
        <Section id="recursos" title="Suas forças e potencialidades">
          {doshas.length ? (
            doshas.map((d) => <p key={d}>{profiles[d].strengths}</p>)
          ) : (
            <p>
              Ainda não há uma hipótese constitucional suficiente para vincular potencialidades a um
              perfil. Isso não significa ausência de forças; significa que este resultado não
              permite descrevê-las a partir dos doshas.
            </p>
          )}
          {vp && (
            <p>
              Na combinação Vata–Pitta, a criatividade encontra discernimento: perceber alternativas
              e dar forma a elas são forças que podem trabalhar juntas. A sensibilidade amplia a
              percepção; a iniciativa ajuda a transformar o que importa em algo concreto. O desgaste
              pode reduzir o acesso a esses recursos, sem apagar suas capacidades.
            </p>
          )}
          <p>
            Essas são potencialidades tradicionais da constituição. Seus talentos, aprendizados e
            recursos pessoais também são construídos na sua história e aparecem nas demais dimensões
            do CER.
          </p>
        </Section>
        <Section id="atual" title="Seu momento atual: o que mudou e o que pede cuidado">
          <p>
            {reading?.currentSummary ||
              'A hipótese de Vikriti permanece em observação neste registro. Sem respostas atuais suficientes, não é possível atribuir uma combinação de desequilíbrio à pessoa.'}
          </p>
          <Evidence items={reading?.currentFacts || []} />
          {vk && (
            <>
              <p>
                Na leitura Vata–Kapha do momento atual, a variabilidade e a lentidão aparecem
                juntas. Os sinais associados a Vata descrevem irregularidade, ressecamento ou
                dificuldade de sustentar repouso; os associados a Kapha descrevem peso, digestão
                lenta ou dificuldade de mobilização. As manifestações efetivamente relatadas estão
                descritas acima.
              </p>
              {vp && (
                <p>
                  Para uma constituição Vata–Pitta, isso significa que sua base de movimento e
                  transformação está convivendo com alterações de ritmo e maior peso ou lentidão. A
                  fome variável, o desconforto digestivo e a recuperação do sono podem interferir no
                  acesso à energia e à continuidade. A clareza e a vontade de realizar não
                  necessariamente acompanham a disposição do corpo no mesmo ritmo. Essa leitura não
                  transforma a dificuldade em falta de vontade e não conclui que Pitta esteja baixo.
                </p>
              )}
              <p>
                Uma combinação de doshas não muda sua identidade nem determina a causa dos sinais. A
                hipótese reúne mudanças atuais para orientar o cuidado; saúde, medicamentos e
                contexto de vida continuam participando da interpretação.
              </p>
            </>
          )}
        </Section>
        <Section id="digestao" title="Agni e Ama: o que suas respostas dizem sobre a digestão">
          <p>
            Agni é o nome tradicional dado à digestão e transformação. Aqui, a leitura vem das
            respostas sobre fome e sensação após comer; Ama considera a convergência dos sinais
            digestivos e de eliminação. Ambos são interpretados pelas respostas, separadamente da
            constituição.
          </p>
          {reading ? (
            <>
              <p className="text-xs text-muted-foreground">{reading.digestiveReference}</p>
              <h4 className="font-semibold">Seu Agni</h4>
              <p>{reading.agniSummary}</p>
              <Evidence items={reading.agniEvidence} />
              <h4 className="font-semibold">Sua leitura de Ama</h4>
              <p>{reading.amaSummary}</p>
              <Evidence items={reading.amaEvidence} />
            </>
          ) : (
            <p>
              {dimension.interpretation ||
                'Este registro ainda não contém uma leitura estruturada de Agni e Ama. As respostas compartilhadas foram preservadas; a ausência dessa leitura não significa digestão equilibrada.'}
            </p>
          )}
          <p>
            O valor dessa leitura está em explicar o padrão registrado: o ritmo da fome, o conforto
            após comer e a eliminação. Agni não mede metabolismo em laboratório, e Ama não
            corresponde à detecção de toxinas no organismo.
          </p>
        </Section>
      </Accordion>
    </div>
  )
}
