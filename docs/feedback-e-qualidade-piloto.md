# Feedback e qualidade do piloto

Interagentes precisam poder relatar tanto dificuldades no app quanto percepções do processo de acompanhamento. O registro pertence à autora e ao acompanhamento escolhido. Não é anônimo nem público. A profissional primária ativa acessa o conteúdo; outras interagentes, outras profissionais e profissionais desvinculadas não acessam. Notas internas de revisão não voltam no DTO da autora. O formulário explica destinatário, identificação, limite de 3.000 caracteres e revisão semanal sem acompanhamento em tempo real.

## Caminhos e confirmação de gravação

- `/feedback`: assuntos Uso do app e Meu processo de acompanhamento; lista de relatos e situação Recebido/Em análise/Análise concluída.
- `/profissional/qualidade`: caixa paginada, acesso ao acompanhamento, notas internas, situação e relatórios semanais.
- Links disponíveis no topo das páginas autenticadas. Demonstração não envia feedbacks ou telemetria reais.
- POST autenticado `/backend/v1/cer/quality`; nenhuma das três coleções novas permite API bruta ao usuário.
- A identidade, profissional destinatária e situação inicial são determinadas pelo servidor. Campo forjado não altera esses valores.
- Limite de dez relatos por autora em 24 horas. Reenvio idêntico usa chave estável para não duplicar quando a resposta da rede se perde. A interface preserva texto/chave na tentativa incerta e só limpa após resposta positiva. Recarregar/fechar antes do envio não preserva o rascunho.

## Detecção e recuperação limitadas

Erros de renderização, eventos globais error/unhandledrejection, falhas de conclusão do acolhimento e de envio/carregamento de feedback geram apenas código enumerado, área enumerada e versão fixa do recurso. Não se enviam mensagens de exceção, stack traces, caminhos/queries, e-mails, tokens, respostas ou texto terapêutico. O vínculo técnico é derivado da própria matrícula e profissional primária. Falhas antes de autenticação, antes do carregamento do monitor ou sem vínculo único podem não ser registradas.

Deduplicação em memória por sessão/código/área, máximo de vinte chaves por sessão e trinta ocorrências por conta em 24 horas no servidor. Falha do monitor é suprimida para não gerar uma cadeia de rejeições. Não há fila offline persistente. O limite é proteção operacional, não contagem estatisticamente completa de todos os incidentes.

A recuperação automática repete uma leitura de qualidade no máximo uma vez em falha de rede/5xx. Não repete escritas incertas, não altera respostas, progresso, planos ou permissões e não edita código. A tela de recuperação de erro explica a limitação do conteúdo ainda não enviado e exige escolha da pessoa para remontar a tela. Mudanças de código passam por reprodução, teste e revisão; percepções do processo terapêutico são avaliadas pela profissional.

## Auditoria semanal nativa

`cronAdd('cer_pilot_weekly_quality', '0 11 * * 1', ...)`: segunda 11h UTC / 8h Brasília. Agendador padrão UTC do PocketBase; confirmar suporte/listagem e execução na plataforma hospedada, não apenas a existência do arquivo. O job agrega a semana anterior fechada, com início na segunda 00h Brasília, e recupera até quatro semanas após indisponibilidade. Nenhum relatório vazio retroativo. Índice único profissional/semana impede duplicação. Relatório automático mantém contagens por assunto e código técnico, pendências na geração e campo separado de ciência profissional. Não copia texto terapêutico para a auditoria automática nem declara o sistema saudável por ausência de erros registrados.

O painel exige revisão humana dos relatos e fornece situação e anotação interna. Marcar relatório como revisado não corrige nem certifica uma falha. Esta primeira versão não transforma texto livre em comandos, não pede a uma IA para interpretar casos clínicos e não executa código proposto por feedback.

## Implantação e validação

Migração 0093 cria apenas `cer_pilot_feedback`, `cer_pilot_incidents`, `cer_pilot_weekly_audits`, campos e índices com regras fechadas. Aplicá-la antes de carregar o hook. Confirmar job registrado e pipeline de build; somente prévia. Preservar correções 433/434, client.ts canônico, dados anteriores, SMTP, credenciais e papéis. Não publicar produção nesta etapa.

`scripts/verify-self-registration.py` executa banco completo, contas sintéticas em loopback e interceptação de e-mails. Cobre cadastro e início existentes, feedback/idempotência/quota, isolamento e desvinculação, DTO sem nota interna, telemetria sem texto arbitrário, registro e execução real do cron, contagens da semana e idempotência. O preparo temporal do cron usa SQLite somente no banco descartável para retroagir registros sintéticos: não há acesso direto a banco vivo nem contorno de autenticação no produto.

`scripts/quality-vitest.config.ts` cobre interface de envio com erro/reenvio e confirmação do servidor, recuperação limitada de leitura e ausência de retry automático de escrita, isolamento demo e telemetria mínima. Não certifica percurso visual completo autenticado na prévia, que continua dependendo de sessão legítima de interagente disponível no navegador de testes.

## Correção do empacotamento após o teste visual

O teste enviado pela usuária mostrou envio incerto seguido de falha na leitura. O diagnóstico técnico, sem consultar registros pessoais, encontrou `ReferenceError: __spreadValues is not defined at feedbackDTO` no runtime. A fonte contém object spread, mas o empacotamento o transforma em chamada a um helper de módulo. Os handlers do PocketBase são serializados em contextos isolados: helpers externos ao callback não ficam disponíveis (documentação: https://pocketbase.io/docs/js-overview/#handlers-scope).

O DTO agora é construído por atribuições condicionais, mantendo notas internas somente no fluxo profissional autorizado. O objeto de parâmetros do cron usa `Object.assign` no próprio callback. Não há mudança de schema, regras, propriedade, cotas, dados ou idempotência.

Os ensaios anteriores executavam diretamente o JavaScript fonte e não cobriam esse passo de empacotamento. `scripts/compile-pilot-quality-bench.cjs` usa o TypeScript instalado para gerar um artefato ES5 com o mesmo tipo de dependência externa, que então é carregado no PocketBase real. Não é o compilador exato do Skip: é uma regressão de isolamento que reproduziu o problema com `__assign` na fonte anterior, inclusive após a gravação da linha sintética. A fonte corrigida passa também pelo artefato compilado.

Execução, sempre em banco descartável e com mensagens interceptadas:

```sh
node scripts/compile-pilot-quality-bench.cjs /tmp/cer-quality-hook-bench.js
CER_QUALITY_HOOK_ARTIFACT=/tmp/cer-quality-hook-bench.js CER_POCKETBASE_BINARY=/path/to/pocketbase python scripts/verify-self-registration.py
```

Confirmar a leitura pelo painel profissional após deploy antes de pedir reenvio à autora: uma falha da resposta após o commit não prova ausência de gravação. Não corrigir isso inserindo outro feedback por administração.
