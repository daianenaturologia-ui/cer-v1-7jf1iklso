# Cadastro pela própria interagente

Implementação preparada para revisão; ativação no backend vivo e entrega real de e-mail ainda não homologadas.

## Percurso

A profissional ativa gera um link por acompanhamento em **Link para cadastro**. A pessoa abre `/cadastro/:slug`, vê a profissional e o acompanhamento, informa nome/e-mail, escolhe e repete sua senha e escolhe vincular-se à profissional indicada.

O servidor cria somente a identidade e uma solicitação pendente. Não retorna senha nem token de autenticação. A confirmação usa o mecanismo nativo de verificação de e-mail do PocketBase. No primeiro login após a confirmação, uma transação cria matrícula, acesso da profissional, papel exclusivo de interagente e estado inicial de acolhimento; ativa a conta e marca a solicitação concluída. A pessoa segue para a jornada existente, sem senha provisória ou cadastro manual pela profissional.

## Proteções e comportamentos deliberados

- Os links são aleatórios, revogáveis e restritos à profissional e produto escolhidos no servidor. Um link ativo por profissional/produto; repetição não duplica o link.
- O cadastro não aceita escolha de papel, status, verificação ou profissional pelo corpo enviado pelo cliente. O vínculo vem do link.
- E-mails já associados a pessoa/conta recebem resposta genérica; o endpoint não altera senhas, identidade ou vínculos existentes. A pessoa deve entrar/recuperar o acesso; uma nova vinculação de conta existente continua pelo fluxo profissional anterior.
- Contas criadas por este fluxo não recebem token, papel ou matrícula antes da verificação de e-mail. O guard comum de autenticação verifica a solicitação pendente. Contas anteriores seguem seu fluxo original.
- Falhas nas transações revertem a criação parcial. Falha do transporte de e-mail mantém a conta pendente e devolve erro sem alegar entrega; a tela permite reenviar a confirmação e limpa as senhas.
- As duas novas coleções têm regras de API direta fechadas. As regras existentes de pessoas, contas, matrículas e registros clínicos não são ampliadas.
- Há limite de 30 solicitações por link/dia e campo de controle contra preenchimento automatizado. O reenvio usa a rota nativa, com suas proteções; a entrega real e a configuração do provedor precisam de conferência no ambiente vivo.
- Desativar o link bloqueia novos cadastros e ativações pendentes. Contas já ativadas permanecem vinculadas. Gerar outro link não reativa o antigo.
- Senhas ficam apenas no estado temporário do formulário e no processamento nativo do servidor; não são copiadas para armazenamento local, auditoria, relatórios ou respostas da API. As senhas são descartadas após envio/falha/troca de convite.
- O cadastro não aceita termos em nome da pessoa nem substitui as escolhas e orientações de compartilhamento já existentes na jornada.

## Verificação reproduzível

```sh
pnpm exec vitest run --config scripts/registration-vitest.config.ts
CER_POCKETBASE_BINARY=/caminho/absoluto/pocketbase python scripts/verify-self-registration.py
pnpm exec tsc --noEmit -p tsconfig.app.json
pnpm exec vite build
```

O script cria bases temporárias em loopback com todo o schema e hooks do repositório, usando exclusivamente contas sintéticas `example.invalid`. Intercepta as mensagens de verificação da bancada e exerce a confirmação nativa; não envia e-mail à Internet, não acessa Skip e não usa dados reais. Testa também rollback, quota, não duplicação, isolamento entre profissionais, recusa de cadastro por API bruta e abertura das seis dimensões pela nova interagente. A versão do binário é validada (0.26.1 ou 0.36.0).

Os testes de interface verificam link indisponível, confirmação de senha, instrução de verificação, recuperação de falha, descarte de senhas e troca de convite durante uma resposta atrasada. O teste de login anterior permanece na seleção.

## Ativação e limites

Antes de disponibilizar o fluxo, revisar e aprovar especificamente a nova forma de criação de contas no ambiente de prévia. Aplicar a migração 0092 antes de carregar o hook `on_self_registration.js`; publicar o frontend correspondente na mesma janela. Não instalar o hook de autenticação sem as duas coleções. Não executar a migração de reversão para apagar solicitações ou identidades.

Antes de distribuir links, confirmar o transporte de e-mail e o endereço de ação do template nativo no ambiente vivo e realizar um envio controlado a uma caixa autorizada. A consulta somente leitura pelo Skip não conseguiu determinar essas configurações sem acesso a segredos; elas continuam desconhecidas. Não há certificação de entrega a Gmail/Outlook, de abertura do link pelo celular ou de conclusão da jornada na prévia gerenciada.

Não há instalação em loja, mudança de credenciais de contas existentes, publicação em produção, link real gerado ou convite enviado nesta implementação.

## Correção do destino de confirmação — 27/10/2026

O teste real recebeu o e-mail, mas seu destino nativo abriu o domínio de produção ainda não publicado. O cadastro ficou `invited`, não verificado e com solicitação pendente. O hook `on_registration_verification_email.js` usa o token nativo já emitido e muda somente a mensagem de contas com solicitação de cadastro pendente: aponta para a página `/confirmar-email` da prévia. Não altera SMTP, senha, verificação, papéis ou regras. Contas anteriores sem solicitação pendente mantêm seu template nativo.

A página exige clique explícito para confirmar, chama `confirmVerification` no servidor e só apresenta sucesso após a resposta nativa. O token fica no fragmento, removido do histórico ao abrir, sem armazenamento local, logs ou login automático. Link ausente, expirado ou já usado oferece entrada e reenvio nativo sem senha. O reenvio não cria outra conta.

Implantar primeiro a página no frontend e depois o hook de e-mail, mantendo a migração0092 já aplicada. O destino confiável está fixado no domínio desta prévia para não aceitar origens arbitrárias de requisições. Antes de publicar em produção, revisar este destino, implantar a página nesse ambiente e testar um novo e-mail. Publicar produção não é parte desta correção. Links antigos não mudam: a titular deve solicitar uma mensagem nova e abrir a mais recente.

O recebimento relatado pela usuária comprova a entrega daquela mensagem, mas não prova ainda a confirmação pelo novo destino nem o primeiro login. Esses dois passos continuam dependentes do uso do link pela titular, sem alterar `verified` administrativamente.


## Destino publicado do piloto — 28/10/2026

Após publicação autorizada pela titular, o domínio `https://cer-v1-1444e.goskip.app` passou a servir o app. O destino confiável do hook de confirmação passa de prévia para esse domínio fixo, mantendo `/confirmar-email#token=...`, o token nativo, o escopo apenas de solicitações de cadastro pendentes e o template de contas anteriores. Sem origem derivada de requisição, novas permissões ou alterações de SMTP. Links antigos já enviados permanecem como foram gerados.

O ensaio REST intercepta as mensagens sintéticas em banco descartável e verifica o destino publicado, confirmação e ativação por login; não comprova entrega de e-mail real. Publicação da página e leitura visual pública são distintas do deploy do hook e da comprovação de entrega. Recuperação de senha não foi alterada com base em suposição sobre o template nativo.
