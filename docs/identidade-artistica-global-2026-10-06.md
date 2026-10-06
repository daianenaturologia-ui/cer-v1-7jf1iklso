# CER — identidade artística em todo o aplicativo

Entrega visual autorizada por Daiane em 06/10/2026, mantendo a direção aprovada no dia anterior: botânica, verde, terracota, tipografia Lora, palavras selecionadas em destaque e leitura confortável. Não há alteração metodológica, clínica ou de permissões.

## Implementação

`CerArtwork.tsx` reúne seis desenhos vetoriais leves: folhas, flor, sol, ondas, caminho e broto. Os desenhos são decorativos (`aria-hidden`, sem foco e sem capturar cliques), variam de forma estável por contexto e identificador React e não leem respostas ou dados pessoais.

- Diálogos, confirmações, painéis laterais e drawers recebem uma faixa artística em espaço próprio, sem cobrir campos ou títulos. As caixas centrais têm margem no celular e limite de altura com rolagem. Fechamento da interface em português.
- Cartões recebem arte no cabeçalho; quando não há cabeçalho, o primeiro conteúdo recebe a faixa. Não se acrescenta outra faixa a cada conteúdo subsequente.
- Agenda, desenvolvimento, Mandala, experimentos e Linha da Vida têm introduções com hierarquia e destaques explícitos nos textos estáticos. Respostas livres, notas e relatos não são transformados automaticamente.
- Os modais customizados identificados, as telas profissionais e a abertura de questionários também receberam elementos da mesma família.
- Mantidos controles de teclado; foco visível, espaço entre linhas, palavras que quebram corretamente e redução de movimento respeitada.

Inventário estático: 24 usos de `DialogContent`, 1 de `SheetContent`, 97 de `CardHeader` e 113 de `CardContent`. As primitivas de confirmação e drawer também estão preparadas, embora sem usos diretos encontrados neste inventário. Isso é cobertura de componentes, não alegação de visita manual a cada estado de todas as telas.

## Revisão da experiência

A agenda segunda–sexta e a visão de um dia no celular já existiam e foram preservadas. A conexão com Google continua sendo exportação manual de ICS, não sincronização automática. A navegação por abas e os detalhes sob demanda foram preservados. Não foram acrescentados novos botões por causa da arte.

## Verificação realizada

- 16 testes aprovados em `scripts/weekly-agenda-vitest.config.ts`, incluindo edição, persistência, privacidade e agenda profissional sem notas privadas.
- 2 testes aprovados: `LifeJourney.test.tsx` e `InteragenteMapProgress.test.tsx`, pela configuração `scripts/initial-map-vitest.config.ts`.
- `tsc --noEmit -p tsconfig.app.json` aprovado. O comando na raiz sem projeto não substitui essa verificação.
- Build de produção aprovado; permanecem avisos anteriores de chunks grandes e imports dinâmicos.
- CSS compilado contém largura válida `calc(100% - 2rem)` e limite de altura em `dvh`.

Código salvo na branch remota `cer-art-20261006`, commit `21a0eb64a5d0c7d38f5506751720c78ad36b7899`; os 22 arquivos de `src/` foram comparados com a implementação local após fetch. Main não foi atualizado por esta entrega local.

## Aplicação ao Skip

Foi solicitada aplicação somente do diff visual de `src/`, sem sincronizar main inteira e sem instalar migrações/hooks pendentes. A tentativa de obter o diff por URL foi interrompida; o patch completo foi fornecido diretamente na conversa do projeto. A verificação visual e o resultado dessa aplicação devem ser registrados depois de sua conclusão, sem presumir que envio de uma instrução equivale a instalação.

Backup/restauração do backend e as correções de segurança pendentes continuam no fluxo separado com o Skip. Esta entrega não ativa IA nem modifica registros reais.
