import type { ReactNode } from 'react'
import type { CerMapReadingDimension } from '@/types/cerMapReadings'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

type Dosha = 'Vata' | 'Pitta' | 'Kapha'

const profiles: Record<
  Dosha,
  { principle: string; body: string; resources: string; question: string }
> = {
  Vata: {
    principle: 'movimento e variabilidade',
    body: 'Na descrição tradicional de Vata, aparecem tendências como estrutura corporal mais leve, ressecamento e maior sensibilidade ao frio. Fome, sono e disposição podem ter ritmos variáveis.',
    resources:
      'Vata é tradicionalmente associado à criatividade, à rapidez das ideias e à abertura para possibilidades. Você pode explorar se reconhece esses recursos e quais condições ajudam a utilizá-los com conforto.',
    question:
      'Quando surgem muitas ideias ou mudanças, o que ajuda você a escolher um caminho e encontrar continuidade?',
  },
  Pitta: {
    principle: 'transformação e calor',
    body: 'Na descrição tradicional de Pitta, aparecem tendências como estrutura corporal intermediária, maior sensibilidade ao calor, transpiração e fome mais intensa. A pele pode ser sensível.',
    resources:
      'Pitta é tradicionalmente associado à clareza, ao discernimento e à capacidade de direcionar esforços. Observe se você reconhece esses recursos e como consegue usá-los respeitando seus limites.',
    question:
      'Como sua vontade de realizar conversa com seus limites? Quando o desejo de fazer bem começa a trazer pressa ou cobrança?',
  },
  Kapha: {
    principle: 'sustentação e estabilidade',
    body: 'Na descrição tradicional de Kapha, aparecem tendências como estrutura corporal mais sólida, maior constância dos ritmos e sono mais profundo. Isso não permite presumir seu peso, sua saúde ou sua disposição.',
    resources:
      'Kapha é tradicionalmente associado à constância, à paciência e à capacidade de sustentar processos. Explore onde você reconhece esses recursos e o que ajuda a abrir espaço para o novo.',
    question:
      'O que na sua rotina oferece segurança e o que poderia ganhar movimento? Que primeiro passo torna uma mudança mais possível?',
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

/** Shared by both map views. Educational possibilities stay separate from recorded observations. */
export function AyurvedaPersonalReading({
  dimension,
  participantName,
  interpretationTitle,
}: {
  dimension: CerMapReadingDimension
  participantName: string
  interpretationTitle: string
}) {
  const doshas = [
    ...new Set(Array.isArray(dimension.ayurvedaConstitution) ? dimension.ayurvedaConstitution : []),
  ].filter((d) => ['Vata', 'Pitta', 'Kapha'].includes(d))
  const pair = doshas.join('–')
  const isVataPitta = doshas.length === 2 && doshas.includes('Vata') && doshas.includes('Pitta')
  const isVataKapha = doshas.length === 2 && doshas.includes('Vata') && doshas.includes('Kapha')
  const isPittaKapha = doshas.length === 2 && doshas.includes('Pitta') && doshas.includes('Kapha')

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
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Vata:</strong> associado ao movimento e à variabilidade.
            </li>
            <li>
              <strong>Pitta:</strong> associado à transformação e ao calor.
            </li>
            <li>
              <strong>Kapha:</strong> associado à sustentação e à estabilidade.
            </li>
          </ul>
          <p>
            Na perspectiva ayurvédica, todas as pessoas apresentam os três doshas, em combinações
            diferentes. Eles ajudam a interpretar tendências do corpo e aspectos da experiência
            mental e emocional. Não são medidas biológicas nem definições fixas de personalidade.
          </p>
          <h4 className="font-semibold">Sete combinações básicas</h4>
          <p>
            Vata, Pitta, Kapha; Vata–Pitta, Vata–Kapha, Pitta–Kapha; e Vata–Pitta–Kapha. Uma
            combinação reúne qualidades dos princípios envolvidos. A ordem só indica predominância
            quando há informações que sustentem essa distinção. Um empate de respostas não confirma
            uma constituição tridosha equilibrada.
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
            Por isso, investigamos duas perguntas diferentes:{' '}
            <strong>“Como você costuma funcionar?”</strong> e{' '}
            <strong>“O que mudou no seu funcionamento?”</strong>
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
        {doshas.length > 0 ? (
          <p>
            Pela lente do Ayurveda, sua hipótese constitucional permite explorar a combinação{' '}
            <strong>{pair}</strong>: {doshas.map((d) => profiles[d].principle).join('; ')}.
          </p>
        ) : (
          <p>
            Ainda precisamos conhecer melhor suas tendências de base para oferecer uma leitura
            constitucional mais pessoal. Enquanto isso, podemos olhar para o que você já
            compartilhou e para as perguntas que ajudam nessa descoberta.
          </p>
        )}
        <p>
          Você pode se reconhecer em alguns trechos, discordar de outros e acrescentar o que estiver
          faltando. Sua experiência é o que dá sentido a este mapa.
        </p>
      </div>

      <Accordion type="multiple" className="rounded-lg border bg-card/60 px-4">
        {doshas.length > 0 && (
          <Section id="constituicao" title={`Sua constituição: conhecendo ${pair}`}>
            {isVataPitta && (
              <p>
                Talvez você reconheça em si uma mistura de curiosidade, sensibilidade e vontade de
                fazer as coisas acontecerem. Uma parte sua percebe possibilidades e se movimenta
                entre ideias. Outra parte procura clareza e um caminho para realizar o que importa.
                Essa é uma imagem tradicional para explorar como você encontra possibilidades e o
                que ajuda a transformá-las em algo concreto.
              </p>
            )}
            {isVataKapha && (
              <p>
                Essa combinação reúne movimento e estabilidade. Pode ser interessante explorar como
                sua abertura para possibilidades conversa com sua necessidade de continuidade e
                segurança. Você pode gostar de descobrir caminhos novos e precisar de tempo ou apoio
                para incorporá-los à vida.
              </p>
            )}
            {isPittaKapha && (
              <p>
                Essa combinação reúne transformação e sustentação. Pode ser interessante explorar
                como sua vontade de direcionar e realizar conversa com os recursos que ajudam você a
                continuar. Ter um objetivo claro e construir um caminho consistente podem fazer
                sentido para você.
              </p>
            )}
            {doshas.length === 3 && (
              <p>
                Uma hipótese envolvendo os três princípios convida a observar a variedade das suas
                tendências. Ela não significa equilíbrio perfeito nem ausência de necessidades de
                cuidado.
              </p>
            )}
            {doshas.map((d) => (
              <p key={d}>{profiles[d].resources}</p>
            ))}
            <p>
              Sua constituição não conta toda a sua história. Seus valores, aprendizados, vínculos e
              condições de vida também participam de quem você é. As possibilidades descritas aqui
              precisam encontrar sentido na sua experiência.
            </p>
          </Section>
        )}
        {doshas.length > 0 && (
          <Section id="corpo" title="Como essas tendências podem aparecer no corpo">
            {doshas.map((d) => (
              <p key={d}>{profiles[d].body}</p>
            ))}
            <p>
              Em uma combinação, características diferentes podem coexistir. Você não precisa
              apresentar todas elas, e uma característica isolada não define sua constituição.
            </p>
            <p>
              Sua fome costuma ser previsível? O que acontece quando adia uma refeição? Você tolera
              melhor o frio ou o calor? Seu sono muda conforme a fase da vida? Como fica sua energia
              depois de um dia cheio?
            </p>
            <p>
              Essas respostas ajudam a conhecer suas necessidades para além do nome da constituição.
            </p>
          </Section>
        )}
        <Section id="recursos" title="Suas possibilidades quando você está bem">
          <p>
            Observe situações em que suas capacidades aparecem com mais naturalidade. É quando tem
            liberdade para criar? Quando entende o propósito da tarefa? Quando há tempo suficiente,
            apoio ou um ambiente tranquilo?
          </p>
          <p>
            Conhecer suas forças também significa conhecer as condições que permitem usá-las sem se
            esgotar. Ter muitas ideias pode ser um recurso precioso. Escolher quais merecem sua
            atenção agora ajuda esse recurso a se tornar uma realização possível.
          </p>
          {doshas.map((d) => (
            <p key={d}>{profiles[d].question}</p>
          ))}
          <p>
            Se uma atividade que começou com prazer passa a trazer pressa ou cobrança, vale observar
            o momento em que isso muda. Esses padrões precisam ser compreendidos na sua história, e
            não concluídos a partir dos doshas.
          </p>
        </Section>
        <Section id="atual" title="Seu momento atual: o que mudou e o que pede cuidado">
          <p>
            Sua constituição e seu estado atual são duas camadas diferentes. Uma mudança no
            funcionamento não significa que você deixou de ser quem era. Também não podemos concluir
            que um dosha esteja baixo apenas porque ele não aparece entre as alterações destacadas.
          </p>
          <p>
            Quando a leitura atual permanece em observação, isso significa que precisamos
            compreender melhor o que mudou, há quanto tempo, com que frequência e em qual contexto.
            Informações ausentes não significam que tudo esteja equilibrado.
          </p>
          <p>
            Na linguagem tradicional, alterações de Vata podem orientar a investigação de
            irregularidade, inquietação, ressecamento ou dificuldade de repousar; alterações de
            Pitta, de calor, queimação ou intensidade; e alterações de Kapha, de lentidão, sensação
            de peso ou dificuldade de mobilização. São possibilidades educativas, não sintomas
            atribuídos automaticamente a você.
          </p>
          <p>
            Quando alterações de Vata e Kapha coexistem, uma experiência a investigar é estar
            inquieta e, ao mesmo tempo, com pouca disposição: pensar no que deseja fazer e encontrar
            dificuldade para começar, ou passar por aceleração seguida de maior esforço. Isso não
            define a causa do cansaço, da concentração ou do humor.
          </p>
          <p>
            Sono, alimentação, condições de saúde, medicamentos, demandas e experiências emocionais
            também precisam entrar na conversa. Você não precisa transformar uma dificuldade em uma
            conclusão sobre seu valor ou sua capacidade.
          </p>
        </Section>
        <Section id="digestao" title="Fome e digestão: conhecer seu ritmo antes dos cuidados">
          <p>
            O Ayurveda chama de Agni a capacidade de digestão e transformação. Nesta leitura,
            interessa investigar o ritmo da sua fome e como você se sente ao comer.
          </p>
          <p>
            Sua fome varia muito? Você chega às refeições com fome ou come principalmente pelo
            horário? Sente desconforto, estufamento ou peso depois? Há diferenças entre dias
            tranquilos e dias mais exigentes?
          </p>
          <p>
            A constituição ou a combinação do momento não basta para definir seu Agni. Também não
            permite afirmar a presença de Ama, um conceito tradicional relacionado à transformação
            incompleta, sem outros elementos. Esses conceitos não são medidas laboratoriais de
            metabolismo ou toxinas.
          </p>
          <p>
            O mais útil é construir uma descrição clara do que você realmente vive. É a partir dela
            que poderemos pensar em cuidados adequados.
          </p>
        </Section>
        <Section id="cotidiano" title="Trabalho, estudos e relações: observar sua experiência">
          <p>
            Seu mapa pode ajudar a investigar o espaço para se interessar e a estrutura para
            conseguir continuar. Experimente observar se poucas prioridades claras, tarefas em
            etapas e um lugar para registrar ideias tornam suas atividades mais possíveis.
          </p>
          <p>
            Uma ideia nova não precisa se transformar imediatamente em um compromisso. Você pode
            anotá-la e voltar a ela depois. Observe quais horários favorecem sua concentração, sem
            esperar o mesmo rendimento durante o dia inteiro.
          </p>
          <p>
            Sua constituição não define seu estilo de vínculo. Quando está cansada, precisa de
            silêncio ou companhia? Consegue explicar o que precisa antes de ultrapassar seu limite?
            Reconhecer essas necessidades ajuda a comunicá-las.
          </p>
          <p>
            Você pode dizer: “Quero conversar sobre isso, mas preciso de uma pausa para conseguir
            estar presente”. Essas descobertas vêm da sua vida e podem ser aprofundadas nas outras
            dimensões do CER.
          </p>
        </Section>
        <Section id="rotina" title="Construir uma rotina possível e viver com leveza">
          <p>
            Qual organização oferece apoio sem aumentar sua cobrança? Comece tirando da cabeça
            aquilo que está tentando lembrar. Coloque no papel, escolha o que importa nesta semana e
            distribua as tarefas em horários possíveis.
          </p>
          <p>
            Deixe espaço entre compromissos. Refeições, descanso e imprevistos também precisam caber
            na agenda. Se uma tarefa não acontecer no horário previsto, observe o motivo e encontre
            outro momento. Esse ajuste traz informação sobre sua realidade.
          </p>
          <p>
            Durante cada atividade, perceba como você está. Há tensão? Pressa? Algum conforto que
            possa acrescentar? Uma música agradável, uma pausa breve ou um ambiente acolhedor podem
            fazer parte da experiência. Você pode aprender a realizar e cultivar momentos bons
            dentro da vida que já está vivendo.
          </p>
        </Section>
        <Section id="acompanhar" title="O que observar daqui para frente">
          <p>
            Escolha poucos sinais importantes: como acorda e como sua energia muda; fome e conforto
            digestivo; sono após dias exigentes; situações que trazem presença ou esgotamento; o que
            facilita começar e continuar uma atividade.
          </p>
          <p>
            Não é necessário monitorar tudo. Escolha o suficiente para reconhecer padrões e perceber
            mudanças. Sintomas persistentes ou que estejam limitando sua vida também precisam de
            avaliação de saúde.
          </p>
          <p>
            O valor desta leitura está no que ela ajuda você a perceber. Os cuidados serão
            construídos considerando suas condições de saúde e o que cabe na sua rotina.
          </p>
          <p>
            <strong>
              O que aqui se parece comigo? O que não se parece? E o que eu gostaria de compreender
              melhor sobre mim?
            </strong>{' '}
            Suas respostas serão parte do próximo passo.
          </p>
        </Section>
        {(dimension.summary || dimension.interpretation) && (
          <Section id="leitura-registrada" title="Sua leitura registrada neste mapa">
            {dimension.summary && (
              <>
                <h4 className="font-semibold">Síntese da leitura</h4>
                <p className="whitespace-pre-wrap">{dimension.summary}</p>
              </>
            )}
            {dimension.interpretation && (
              <>
                <h4 className="font-semibold">{interpretationTitle}</h4>
                <p className="whitespace-pre-wrap">{dimension.interpretation}</p>
              </>
            )}
          </Section>
        )}
      </Accordion>
    </div>
  )
}
