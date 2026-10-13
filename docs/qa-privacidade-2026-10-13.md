# QA e privacidade antes do piloto — 13/10/2026

## Problema e correções

A consulta ampla de contexto para IA dependia dos filtros do servidor sem uma exclusão final de registros privados. Foi acrescentado um descarte final de participant_private e de conhecimento professional_private, também no percurso de proveniência. Um teste novo reproduziu o retorno indevido de registros privados apesar dos filtros; falhou antes da correção e passou depois. A IA ainda não está conectada ao servidor do app.

Os testes antigos confundiam leitura privada para preservar versões com divulgação em auditoria e inspecionavam o arquivo completo de sessões para proibir criação automática de notas. Agora verificam os callbacks de auditoria e a função de preparação, mantendo as proibições. Os testes de rollback extraem a função DOWN registrada, em vez de capturar também o UP. Demonstração usa jsdom e reinício explícito entre cenários, preservando o comportamento de saída sem apagar dados.

O QA não ignora mais o resultado da suíte que prova o bloqueio de escritas. Verifica tipos com tsconfig.app.json. Publicação dos relatórios do CI preserva cada arquivo durante checkout, evita mover arquivo sobre si mesmo e exige que uma tentativa de push tenha sucesso. Bancadas carregam hooks com extensão .pb.js.

O executor visual foi adaptado às rotas e controles atuais: home /, workspace /profissional/participantes, abas Sessões/Evolução, criação do encontro, campos de plano e Acompanhamento. Exige app local antes de abrir navegador; não captura o formulário de login preenchido em caso de erro. A execução visual completa permanece pendente até o CI; sintaxe válida não foi tratada como prova de todas as oito etapas.

## Evidência local

- 93 testes em 8 arquivos antigos e de privacidade aprovados.
- 230 testes de questionários em 22 arquivos aprovados.
- Pipeline QA geral: 7 etapas PASS, integração mutável BLOCKED sem autorização explícita nessa execução, nenhuma etapa FAIL. Isso é resultado parcial, não aprovação de integração.
- Tipos da aplicação, lint e build aprovados. Lint mantém avisos anteriores.
- YAML e scripts shell do workflow verificados. Sintaxe dos executores verificada.
- PocketBase 0.26.1: 19 cenários autenticados de questionários aprovados, incluindo nova autenticação com recuperação da resposta e conclusão.
- PocketBase 0.26.1: ciclo completo de convite, acesso, caderno privado, recados, sessões, Linha da Vida, revogação e backup/restauração aprovado.
- PocketBase 0.36.0: 86 cenários autenticados de cuidado/privacidade e restauração aprovados. Após restauração, login, texto do caderno, versão anterior, arquivo protegido, revogação e restrições de acesso foram preservados.

Os motores usam todas as migrations e hooks do repositório, contas estritamente fictícias, endereços loopback e bases efêmeras. Não certificam a configuração do servidor vivo do Skip. Nenhuma conta ou dado clínico real foi alterado e produção não foi publicada.

## Ainda necessário

Confirmar a execução do teste visual atual no CI, revisar a suíte de apresentação antiga do mapa e o fixture QA incompleto de Corpo. Homologar na infraestrutura do piloto convite, segundo dispositivo, retomada e regras de privacidade; conferir migrações efetivamente instaladas, backup operacional e recuperação. O PR27 permanece separado, sem integração nesta rodada. Acervo, IA, mobile/acessibilidade, voz, Google Agenda e D35 permanecem nas pendências do projeto.
