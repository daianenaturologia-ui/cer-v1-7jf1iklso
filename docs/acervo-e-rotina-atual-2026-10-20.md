# Biblioteca de consulta e rotina atual

A Biblioteca da interagente agora é acervo: busca, áreas e abertura dos materiais. Ela não cria práticas, não pergunta metas e não leva tarefas ao Planner. A profissional conserva a curadoria e a inclusão de materiais no plano. Experimentos já combinados ficam em aba própria; dados anteriores não foram apagados.

Minha rotina atual é um retrato de um dia, antes do plano: momentos em ordem, horário aproximado ou em branco e atividade. Há exemplo apenas ilustrativo, rascunho local, Continuar depois, salvamento explícito e compartilhamento opcional. Não cria agenda nem recomenda novos hábitos. A profissional consulta somente o registro compartilhado, junto ao preparo do plano.

Coleção nova cer_daily_routines: uma rotina por matrícula, índice UNIQUE, titular escreve, profissional ativo vinculado lê apenas participant_shared. Migration 0089 aditiva; rollback recusa perda de registros. Hook on_daily_routine valida de 1 a 64 momentos, hora válida ou ausente e atividades não vazias de até 500 caracteres. Não muda regras, índices ou dados de coleções anteriores.

Histórico pessoal permanece consultável inclusive quando privado, sem reabrir o antigo formulário de vínculo/meta/significado/cuidados. A leitura profissional do histórico continua restrita ao compartilhado. Os termos de acompanhamento usam encontros; identificadores e contratos de armazenamento de sessões permanecem iguais.

Validação: 472 testes/64 arquivos, TypeScript e Vite passaram; 172 cenários REST autenticados em cada PocketBase oficial 0.26.1 e 0.36.0, com dados inteiramente fictícios e ambiente descartável. Novas verificações cobrem privacidade, vínculo ativo, edição exclusiva da titular, atualização parcial, troca de titular bloqueada, duplicidade, revogação do compartilhamento, horários inválidos e permanência dos dados depois de erro de salvamento. Sem publicação em produção.
