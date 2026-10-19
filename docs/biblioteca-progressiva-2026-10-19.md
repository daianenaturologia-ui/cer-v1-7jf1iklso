# Biblioteca progressiva e prioridade de conclusão

Decisão de Daiane em 19/10/2026: concluir a primeira versão funcional do app e colocá-la em uso; produzir/revisar os materiais depois. E-books serão produtos independentes para venda avulsa no site. A ausência de materiais futuros não bloqueia o CER. O inventário editorial completo está no documento Prioridades_CER_e_materiais_futuros.docx.

## Alteração deste bloco

- Rascunho educativo pode conter somente o título. Publicação continua exigindo apresentação e instruções completas; PDF, áudio e vídeo também exigem endereço HTTPS.
- Campo opcional `material`: formato, endereço, autoria, referências e orientações de uso. Links externos abrem por escolha da pessoa, sem reprodução automática. Não há upload binário nem loja neste bloco. Recursos comerciais ou de acesso restrito não devem ser colocados no acervo educativo compartilhado.
- Busca por título/conteúdo, filtro de formato e tema na visão da interagente; busca e estado na gestão profissional. Estados vazios permitem continuar a jornada.
- Conteúdo e origem acompanham o snapshot do plano e são consultáveis na agenda. Uma nova versão usa outro registro; a profissional pode retirar a anterior. Retirada não apaga tentativas anteriores.
- Correção da leitura dos campos JSON nos hooks: os servidores reais fornecem esses valores por representação serializada, o que não estava coberto pelos antigos mocks.
- Migração 0084 é aditiva, sem modificação dos registros existentes. Permite campos incompletos em rascunho; validação da publicação permanece no hook. Corrige a expressão de imutabilidade de autoria/matrícula para `:isset` e igualdade, preservando os escopos de autorização pretendidos. Não altera listagem/visibilidade, exclusão ou papéis.

## Validação local

- TypeScript e build Vite aprovados; lint sem erros (avisos preexistentes).
- 395 testes em 50 arquivos de regressão aprovados; suíte dirigida com 31 testes.
- 120 cenários autenticados aprovados em PocketBase 0.26.1 e 0.36.0, usando migrações e hooks completos em bases descartáveis com dados sintéticos. Incluem rascunho, leitura indevida, publicação incompleta, URL executável, tentativa de outro autor, snapshot e retirada.
- A prévia hospedada foi consultada antes da alteração nas duas visões; confirmou o acervo inicial de texto e o editor anterior. A nova interface ainda não foi inspecionada na prévia. O navegador disponibilizado não abre o endereço de desenvolvimento local.

## Instalação e continuidade

Integrar somente após CI aprovado no head final. Sincronizar os arquivos no Skip e aplicar 0084 no ambiente de prévia com a sequência de instalação já estabelecida. A migração deve acompanhar os hooks e a interface; confirmar compatibilidade do runtime hospedado. Não reconstruir o cliente PocketBase nem introduzir URL padrão. Não publicar produção neste bloco.

Na prévia: criar título fictício, salvar/retomar rascunho, completar e publicar um material fictício; alternar para a interagente, buscar/filtrar, abrir material e salvar no plano/Planner; retirar da Biblioteca e confirmar preservação do registro anterior. Conferir celular e estados vazios. Links de teste devem usar somente recursos públicos de teste adequados; nenhum e-book comercial precisa ser carregado agora.

Depois seguir para simulação integral do percurso da interagente e do painel profissional, persistência e privacidade no servidor hospedado, e correção dos bloqueadores do piloto.

## Situação de envio ao final deste bloco

Implementação local e verificações concluídas. Duas tentativas de envio da branch foram rejeitadas pela revisão automática. O destino foi confirmado como público e pertencente à conexão; a segunda rejeição manteve a exigência de autorização expressa da usuária para divulgar estas alterações nesse repositório. Não foi usado outro canal para contornar o bloqueio. Não há PR novo nem instalação da alteração na prévia.

Próxima ação depende dessa autorização: enviar a branch `codex/biblioteca-materiais-progressivos` ao repositório público `daianenaturologia-ui/cer-v1-7jf1iklso`, abrir PR, conferir CI no head final e, se aprovado e autorizado, integrar e instalar somente na prévia com a migração 0084. Produção permanece fora deste bloco.

## Continuidade após autorização

Autorização expressa recebida, PR49 integrado após todos os seis jobs de CI passarem. Biblioteca instalada na prévia 0.0.398, migration0084/hook confirmados. Rascunho após recarregar, publicação incompleta bloqueada, publicação fictícia, busca sem acentos, filtro vazio, inclusão no plano/Planner, retirada e preservação do snapshot conferidos no navegador. Cliente canônico restaurado e blob independente confirmado. Produção não publicada. A próxima reorganização é o plano escrito para construção em sessões; ver `plano-desenvolvimento-sessoes-2026-10-19.md`.
