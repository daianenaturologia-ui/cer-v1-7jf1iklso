# Primeiro uso após o cadastro — 27/10/2026

## Falha reproduzida e correção

O acolhimento fechava a tela e gravava um marcador local antes de atualizar `journey_states`. A regra efetiva dessa coleção permite atualização direta somente à profissional vinculada; portanto a gravação da interagente era recusada e o erro era ignorado. Um navegador podia aparentar conclusão enquanto o servidor e o painel permaneciam no acolhimento inicial.

O endpoint autenticado `POST /backend/v1/cer/onboarding/complete` conclui apenas o acolhimento da própria interagente ativa, na sua matrícula ativa. Recarrega conta e vínculo no servidor, exige papel de interagente, preserva os metadados, registra a conclusão e avança somente de onboarding para consciousness. Tentativas repetidas não duplicam nem reiniciam etapas avançadas. A profissional, outra interagente e chamadas anônimas não concluem a etapa em nome da titular. As regras da coleção permanecem fechadas para alterações diretas arbitrárias.

A interface espera a confirmação do servidor antes de sair. Em caso de falha, mantém o último momento, mostra erro e permite tentar novamente. O marcador local só tem autoridade na demonstração; um marcador antigo não oculta acolhimento real ainda pendente. Não altera senha, confirmação de e-mail, papéis, consentimentos ou respostas.

## Evidência e limites

- 19 testes de interface/serviços passaram: acolhimento, falha e repetição, retomada de questionário e resumo profissional.
- 87 verificações REST autenticadas em cada PocketBase0.26.1 e0.36.0, com schema completo e identidades descartáveis em loopback. Incluem confirmação do cadastro, conclusão do acolhimento, nova autenticação, primeira resposta parcial, leitura da resposta exata pela profissional vinculada e bloqueio de leitura pela outra profissional. A resposta marcada privada deixa de ser legível à profissional e continua acessível à autora. Isso não certifica todo o histórico de privacidade do app.
- Tipos e build aprovados. Lint afetado sem erros; avisos anteriores em InteragenteHome e bundle não foram tratados como corrigidos.
- Conferência visual autenticada na prévia: a profissional abriu a nova matrícula correta, com 0/6 dimensões, sem relato ou direção compartilhados e sem respostas herdadas da Julia. Consulta administrativa confirmou onboarding/nao_iniciado e zero respostas/experiências nessa matrícula naquele momento.

A conta fictícia nova foi criada e acessada pela usuária no navegador dela; essa sessão não é compartilhada com o controle remoto. A validação REST acima usou contas descartáveis, não fingiu acesso visual à conta nova e não criou progressos nela por administração. O percurso visual completo na conta nova continua dependente de uma sessão de interagente disponível ao controle.

Implantar o hook na prévia antes do frontend correspondente. Não executar migrações, não abrir regras da coleção e não marcar o acolhimento da titular como concluído por administração. Preservar a página e o hook de confirmação de e-mail da versão0.0.433. Nenhuma publicação em produção está incluída.
