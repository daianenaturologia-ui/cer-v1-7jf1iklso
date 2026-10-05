# CER — auditoria de experiência e agenda semanal · 05/10/2026

## Pedido e continuidade

Daiane pediu uma agenda de segunda a sexta, anotação por clique no horário, possibilidade de Google Agenda e simplificação das duas experiências. Critério: produtividade e vida gostosa, visual limpo, arte e detalhes disponíveis quando necessários. Não repetir os testes históricos nem reiniciar questionários.

Antes de editar, o estado local estava limpo, exceto o documento não relacionado `docs/mandala-publicacao-2026-10-01.md`, preservado. A referência remota era `e881c40857b9bbe64e23b00033eaabb6cbe12a24`. Os blobs dos arquivos existentes alterados foram comparados ao remoto; conteúdos coincidentes, sem sobrescrever alterações externas.

## Auditoria dos percursos

| Área | Achado | Resultado desta entrega |
| --- | --- | --- |
| Entrada / recepção | Texto de método já aprovado; acesso e recuperação são fluxos próprios | Recepção e autenticação preservadas |
| Interagente / navegação | Botões de destino repetidos e introdução longa | Navegação curta e consistente: Jornada, Agenda, Práticas, Mandala; orientação inicial de uma frase |
| Consciência / seis dimensões / Mapa CER | Dimensões têm progresso próprio; versões do mapa e relatórios exigem manter origem e completude | Questionários, cobertura e mapas preservados; nenhuma interpretação refeita |
| Evolução da interagente | Desenvolvimento, síntese, revisão, história e plano clínico empilhados | Abas Planejar, Linha da Vida e Acompanhamento |
| Planejamento educativo | Acervo expõe lições longas; formulário longo e muitos botões por registro | Acervo com título e tema; proposta em detalhe; formulário em janela, personalização opcional recolhida; ações secundárias em Mais opções; aprendizados separados |
| Equilíbrio da interagente | Práticas, Mandala e segunda lista de Planner na mesma tela | Abas Práticas e Mandala; removida a projeção duplicada de agenda |
| Planner | Cartões não representam distribuição do tempo | Grade semanal, clique no horário, detalhes em janela, aba Sem horário, navegação semanal, dia atual, fins de semana opcionais, horários ampliáveis |
| Mandala | Mandala e histórico de aprendizado empilhados | Abas Minha Mandala e Aprendizados |
| Práticas | Destinos de navegação diferentes por página | Mesma navegação curta; respostas e consentimentos existentes preservados |
| Painel profissional | Ferramentas raras competem com participantes/sessões/acervo | Participantes, Sessões e Biblioteca expostos; IA e Auditoria no menu Ferramentas |
| Workspace profissional / Evolução | Linha da Vida, plano, ações, ciclos e retornos juntos | Abas Plano, Linha da Vida, Agenda e Revisão; sessão e demais fases preservadas |
| Agenda profissional | Lista longa misturando passos e práticas | Mesma grade semanal em leitura; apenas passos compartilhados e projeção clínica autorizada |
| Biblioteca profissional | Educação e práticas clínicas empilhadas | Abas Desenvolvimento e Cuidado individual nos dois pontos de entrada |
| Revisão de ciclo | Fluxo deliberado de participação com convite | Preservado, sem retirar consentimento ou envio explícito |
| Bancada Ayurveda / demonstração | Ferramenta técnica de inspeção e alternância de persona | Fora da experiência de rotina; não redesenhada como função do aluno |

A auditoria combina leitura do código das rotas/componentes com conferência das telas alteradas. Não significa uma homologação completa de todos os questionários, contas reais e dispositivos. Não foram acrescentados novos questionários, rankings, metas rígidas nem aprovações profissionais para notas e passos educativos.

## Agenda e arte

- Segunda a sexta por padrão. Sábado/domingo disponíveis em Visualização.
- Grade de 6h a 22h; opção de todos os horários e aviso para eventos fora da janela.
- No celular, um dia de cada vez. Na tela maior, dias lado a lado.
- Cliques nas células abrem nome, início/fim, tipo e anotação opcional. Tipos Foco, Descanso e Vida usam azul, amarelo e rosa; passos educativos e cuidado individual têm cores próprias.
- Ilustração vetorial discreta e curva orgânica no cabeçalho, sem nova dependência ou movimento obrigatório.
- Eventos simultâneos em colunas separadas, sem uma ocorrência cobrir outra.
- Uma anotação pode ser editada, concluída, reaberta, arquivada e restaurada. Não há exclusão física pelo usuário.
- Passos educativos existentes aparecem na semana quando datados; sem horário e pausados continuam disponíveis na aba correspondente. Agendar um pausado o retoma.
- Práticas clínicas continuam vinculadas à atribuição/ciclo existentes; as anotações livres não criam atribuições nem alteram regras clínicas.

## Dados e privacidade

Nova coleção `cer_planner_notes`, migração 0073 e hook `on_planner_notes`. Matrícula imutável, notas particulares, dono autenticado e ativo nas regras e hooks. Profissionais não recebem acesso às notas livres. Demonstração usa chave independente `cer-demo-planner-notes-v1`, sem backend ou reinicialização dos dados existentes.

Não há simulação de persistência local para falhas da conta real. Falha de leitura/salvamento aparece na tela. Conteúdo de passos e revisões anteriores continua na origem original.

## Google Agenda

Implementada exportação `.ics` da semana selecionada. Arquivo contém títulos e horários; não inclui anotações, contexto, reflexões nem narrativas clínicas. Não há transmissão automática à Google nem publicação de agenda privada. Importação manual é uma cópia, não sincronização.

Integração bidirecional ainda não está configurada. Depende de projeto Google Cloud do CER, Calendar API, OAuth client, origens/redirect URI, consentimento individual e implementação/homologação do armazenamento de tokens e sincronização. O plugin Google Calendar do ChatGPT não substitui a conexão de cada aluno dentro do CER.

Fontes oficiais consultadas:
- https://developers.google.com/workspace/calendar/api/auth
- https://developers.google.com/identity/protocols/oauth2/web-server
- https://support.google.com/calendar/answer/37118?hl=pt-BR

## Verificação específica

Configuração isolada `scripts/weekly-agenda-vitest.config.ts`: matemática de semana e navegação entre anos, sobreposição/meia-noite, ICS com escaping/UTF-8/intervalo, persistência e restauração, privacidade, proteção de servidor e fluxo visual de agenda. Dois testes de componentes existentes foram ajustados à navegação nova e executados porque essas telas mudaram. Nenhuma suíte histórica completa foi repetida.

Estado de publicação e conferência visual será registrado ao concluir a entrega. A homologação com usuários reais e autorização HTTP de PocketBase continua pendente; os testes de hooks usam simulação isolada.
