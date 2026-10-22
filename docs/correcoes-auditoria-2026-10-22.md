# Correções do percurso CER — 22/10/2026

Versão de código: 0.0.417. Origem: auditoria funcional com a persona fictícia Mariana, nos percursos da interagente e da profissional.

## Achados e implementação

| Achado                                                  | Correção                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F01 — conclusão herdada entre dimensões                 | Instância do ExperienceEngine identificada por matrícula e dimensão; reinicialização dos estados de conclusão, revisão e navegação. Teste troca Mente concluída por Regulação vazia.                                                                                                          |
| F02 — plano combinado não habilitava ciclos             | A criação do ciclo resolve a versão combinada para uma referência operacional, por transação no servidor. Não exige novo preenchimento. A relação development_version_id preserva a origem; notas privadas não são copiadas. Planos e ciclos anteriores permanecem.                           |
| F03 — prática compartilhada ausente e destino incorreto | Práticas, horários e convites deixam de depender da chave antiga do questionário. A demonstração usa o mesmo fluxo de consentimento e capacidade que criou a proposta. Estado vazio remete ao plano; experiências das ações recorrentes podem ser registradas no Planner.                     |
| F04 — convite de revisão ausente                        | Carregamento independente da chave do questionário. Resposta do convite permite rascunho privado neste navegador e compartilhamento explícito. Falhas de leitura apresentam recuperação, sem afirmar ausência de convites.                                                                    |
| F05 — revisões duplicadas                               | Retirada a segunda conclusão no resumo paralelo. Uma revisão por ciclo, com rascunho e conclusão no mesmo componente. Revisão concluída aparece preservada e desabilitada para nova gravação.                                                                                                 |
| F06 — interpretações desproporcionais                   | Movimentos ocasionais deixam de gerar dificuldades frequentes e conexões fortes automaticamente. Textos autorais substituem linguagem moralizante por possibilidades contextualizadas. Nomes canônicos são mantidos no gráfico e no resumo, com preferência de tratamento na visão da pessoa. |
| F07 — pergunta vazia aparecia respondida                | Resposta vazia passa a “Não respondida”, distinta de recusa e desconhecimento. Nenhuma obrigação de responder à pergunta sensível foi acrescentada.                                                                                                                                           |
| F08 — validação tardia da meta                          | Limite e contador de 160 caracteres na etapa da meta; validação antes de avançar. Rascunhos e demais campos permanecem preservados.                                                                                                                                                           |
| F09 — resumo e andamento incorretos                     | Relato do presente e carta são exibidos separadamente. Próximo passo considera a versão atual do Plano de Desenvolvimento. Retirado o indicador estático de etapa que contradizia o percurso observado.                                                                                       |
| F10 — encerramento, Ama e prioridades                   | Conclusão do capítulo 1 retorna aos capítulos com confirmação. Achado isolado de Ama aparece “Em observação”. Resumo da história prioriza os padrões interferentes indicados pela pessoa, inclusive quando não há intensidade definida. Carregamento precede a sugestão do próximo passo.     |

## Ajustes complementares

- Rotina recorrente aceita data final opcional, validada no cliente e no servidor; os registros anteriores continuam disponíveis.
- Cada ocorrência do plano permite registrar experiência, adaptação, ausência de benefício, tentativa que não aconteceu ou desejo de conversar. O padrão é privado; a pessoa escolhe compartilhar com sua profissional. A Biblioteca pública não recebe esses relatos.
- A revisão profissional consulta os relatos compartilhados das ações do plano, com datas e origem explícitas. Eles não são contados automaticamente como respostas de outro ciclo.
- O exercício de forças começa com três sugestões de cada tipo, mantendo acesso ao conjunto e às conexões pessoais. Movimentos ocasionais não são transformados em vulnerabilidades frequentes.
- Aviso da demonstração deixa de cobrir a navegação fixa. Textos técnicos e perguntas profissionais ainda não formuladas deixam de ocupar a jornada.

## Validação e limites

- Suíte de questionários e percursos usada no CI: **522 testes, 74 arquivos**, aprovada.
- Backend autenticado: **218 cenários** aprovados em cada versão de referência PocketBase **0.26.1 e 0.36.0**, com todas as migrações e hooks do repositório. Inclui plano→ciclo, repetição idempotente, negação de acesso, datas finais e ausência de notas privadas na projeção.
- TypeScript e compilação verificados. A compilação mantém avisos existentes sobre imports dinâmicos.
- A varredura ampla fora da seleção do CI identificou 56 falhas já reproduzidas no código base anterior. Essa bateria inclui contratos antigos e testes que dependem de backend; não foi tomada como evidência de falha nova nas correções.
- A publicação da prévia, a conferência visual e o percurso entre contas reais exigem sincronização com o Skip e permanecem separados da validação em bancada. Não houve publicação em produção nem alteração de permissões de contas.
- A síntese de encontros por IA continua informando quando não existe provedor configurado no servidor. Nenhum resultado de IA foi simulado como uma análise real.
