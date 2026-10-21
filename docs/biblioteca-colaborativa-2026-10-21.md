# Biblioteca CER colaborativa

O acervo continua disponível para consulta. Uma área própria comunica que a Biblioteca está em construção e recebe práticas criadas pelas pessoas: título, tema e duração opcionais, passo a passo, experiência pessoal e nome ou apelido de publicação. Não importa campos do Mapa, da Linha da Vida, da Mandala ou do plano.

Rascunhos ficam privados. Enviar requer confirmação explícita de avaliação por Daiane e publicação posterior. A fila de curadoria permite aprovar a versão visualizada, solicitar ajustes com devolutiva e retirar uma publicação. Aprovação tem confirmação final; decisões ficam em auditoria. Revisões usam controle de versão e transação: não se pode aprovar uma versão desatualizada. Editar uma prática aprovada a retira do feed até nova aprovação. Cada publicação revisada recebe uma conversa própria, para não atribuir comentários antigos a instruções alteradas.

Comentários são publicados somente após confirmação específica do público, com nome escolhido e texto de até 2.000 caracteres. Outros usuários autenticados veem somente esses campos, data, identificação do comentário e a indicação de autoria própria. O autor pode retirar o comentário; Daiane pode moderar com motivo registrado. Comentários de práticas retiradas não podem ser lidos nem adicionados.

## Acesso e implantação

A migration 0090 cria cinco coleções novas, com todas as regras de API direta bloqueadas: cer_library_curators, cer_library_submissions, cer_library_posts, cer_library_comments e cer_library_reviews. Não altera coleções clínicas, regras, contas ou papéis existentes. A designação de curadoria é configurada explicitamente na instalação, somente para a conta existente da profissional Daiane após conferir conta ativa e papel profissional ativo. A migration não embute identificação pessoal, não cria conta e não atribui curadoria automaticamente aos profissionais. Na ausência da designação, a fila permanece bloqueada.

O hook on_library_community registra POST /backend/v1/cer/library. Ele recarrega o status da conta, confere curadoria em cada operação, valida conteúdo, pagina as listas e retorna apenas objetos explícitos; APIs diretas não expõem vínculos de autoria ou dados clínicos. Publicação e retirada são transacionais. A reversão da migration recusa apagar contribuições/auditorias existentes. O ambiente demo simula todo o fluxo localmente e não contata o banco vivo.

## Evidências

489 testes em 66 arquivos, TypeScript da aplicação e build Vite passaram. Inclui criação de rascunho, consentimento, devolutiva, aprovação explícita, preservação do formulário em falha, edição após aprovação e comentários com retirada. 208 cenários autenticados passaram em cada PocketBase 0.26.1 e 0.36.0: acesso entre pessoas, APIs diretas bloqueadas, profissional sem curadoria, versões desatualizadas, campos extras rejeitados, cópia pública sem IDs de conta, comentários de prática retirada, suspensão de conta e rollback integral de publicação com falha injetada.

A pré-verificação do Skip confirmou ordinal 0090 livre, coleções/rota ausentes e a conta de Daiane ativa com papel profissional ativo. Instalação limitada à prévia; sem fixtures no banco vivo e sem publicação de produção.
