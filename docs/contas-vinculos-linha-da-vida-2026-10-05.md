# CER — contas suspensas, vínculos simultâneos e Linha da Vida

Continuação da validação autenticada registrada no commit `6360952`.

## Problemas reproduzidos e correções

Na referência PocketBase 0.26.1 com todas as migrações e hooks, o guard de alteração de conta não chamava `e.next()` e estava associado ao evento de modelo, que não transporta a autenticação da requisição como o evento de request. A operação administrativa de suspensão respondia sem persistir o novo estado. Foi movido para `onRecordUpdateRequest`, com continuação explícita nos caminhos permitidos. O teste verifica o estado efetivamente gravado, bloqueia mudança de status e pessoa pelo próprio usuário, e consulta os recursos usando tokens emitidos antes da suspensão.

A regra de atualização da Linha da Vida com `@request.body.enrollment_id:changed = false` recusava a edição pelo titular no servidor de referência, mesmo mantendo o acompanhamento. A migração 0075 usa condição explícita: campo omitido ou igual ao acompanhamento original; transferência continua bloqueada. Compartilhar e retirar compartilhamento agora são testados por PATCH do titular sem privilégios administrativos.

As regras de diário, histórico, recados, sessões, notas e Linha da Vida também passam a exigir conta ativa em cada requisição. A Linha da Vida usa person_id da conta para titularidade e alias explícito do vínculo profissional. O acesso privado/compartilhado existente é preservado; superusuários continuam sujeitos ao comportamento privilegiado da infraestrutura, não equivalente a uma conta profissional comum.

As falhas iniciais foram observadas **apenas na referência reconstruída**, não afirmadas como falhas demonstradas do Skip vivo. A correção e a migração estão no código. Não foram instaladas no banco vivo nesta etapa.

## Resultado

**51 cenários REST aprovados** no script `scripts/verify-authenticated-backend.py`, com 64 migrações de produto, uma migração temporária de fixtures e 52 hooks. Usa quatro contas fictícias com senha gerada e loopback. Não acessa registros clínicos, tokens do Skip ou IA.

Inclui os 24 cenários anteriores e amplia a matriz:

- Linha da Vida bloqueada antes das seis dimensões; evento privado legível apenas pelo titular, entre contas comuns testadas.
- Compartilhamento e retirada feitos pelo titular; profissional não altera narrativa; acompanhamento não pode ser transferido; data inexistente é recusada.
- Profissional com vínculo inativo não utiliza o vínculo ativo de outra profissional. Duas profissionais ativas leem eventos compartilhados; notas de sessão continuam restritas à autora.
- Suspensão efetivamente persiste. Token anterior não lê diário, histórico, recado, evento de vida, sessão ou nota nos cenários correspondentes; participante suspensa não altera evento/recado nem cria evento.
- Autoalteração de status e associação a outra pessoa são negadas.
- Após revogar P mantendo Q ativa, P perde acesso a sessão, nota, evento compartilhado e recado aprovado; Q conserva somente os acessos permitidos nos cenários testados.
- Backup e restauração completa da base fictícia preservam login, diário, histórico, evento privado, retirada de recado e revogação de vínculo.

O script falha ao final se algum cenário falhar; as negativas não são tratadas como validação apenas por retornar uma lista vazia em um filtro sem correspondência. Os IDs conhecidos das fixtures e a persistência são verificados. Não há backup clínico ou exportação do Skip neste ensaio.

## Reprodução e limites

```bash
CER_POCKETBASE_BINARY=/caminho/absoluto/pocketbase python scripts/verify-authenticated-backend.py
```

A bancada descarta processos e dados temporários ao finalizar. As migrações são aplicadas antes de carregar os hooks; o fluxo de alteração de conta é testado por REST com hooks carregados.

Não comprova suspensão em todas as coleções do CER, todos os hooks, arquivos protegidos, MFA, segurança da infraestrutura, contratos ou exportação de produção. Não é certificação de conformidade nem prova de equivalência do runtime do Skip.

Próximo checkpoint: ampliar a verificação para demais coleções e rotas que expõem conteúdo sensível, arquivos e convite; planejar aplicação 0075/hook no ambiente gerenciado somente após revisar compatibilidade e backup restaurável. A homologação do Skip, exportação de banco/arquivos e condições contratuais continuam pendentes. IA clínica continua desligada.
