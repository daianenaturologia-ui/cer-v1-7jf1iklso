# Questionários autenticados — 12/10/2026

## Correções

A versão 0.0.341 resolve as dimensões pelo código no banco da instalação, em vez de reutilizar IDs de uma base específica. A migração 0076 não havia passado na reconstrução completa: `dimension_id: Failed to find all relation records`. A migração 0077 também reconcilia catálogos já instalados, preservando os IDs e conteúdos das respostas.

O PocketBase 0.26.1 expõe campos JSON por `record.get()` de maneira diferente dos objetos JavaScript usados na simulação. A rota de preparação agora interpreta `getString()` explicitamente para o schema e a conclusão, corrigindo a recusa indevida de perguntas válidas e a abertura de revisões. A rota consulta o estado atual da conta antes de preparar o questionário.

## Validação

`scripts/verify-authenticated-questionnaires.py` reconstrói todas as migrações e carrega todos os hooks em um servidor local descartável. Usa somente contas fictícias e senhas aleatórias; não consulta o Skip. Verifica 19 cenários: relações do catálogo, gravação, leitura, nova autenticação, conclusão, repetição de conclusão, histórico imutável, revisão, isolamento de matrículas, bloqueio/pausa e suspensão com token existente. A suíte específica do frontend e compositor, o TypeScript do aplicativo e a compilação Vite são verificados separadamente.

O job `Authenticated questionnaire lifecycle` executa essas verificações no GitHub. Os jobs antigos continuam visíveis; não foram removidos nem convertidos em sucesso.

## Limites e próximo bloco

Ainda falta homologar a instalação no servidor gerenciado e o percurso visual autenticado na prévia. A integração no GitHub não é prova de aplicação no Skip.

Uma execução da auditoria autenticada mais ampla revelou falhas em criação de conta direta, compartilhamento parcial da Linha da Vida e suspensão em coleções antigas. O script geral interrompeu na atualização da Linha da Vida. Esses achados permanecem pendentes e impedem considerar a plataforma inteira homologada. O sucesso da suíte dos questionários não substitui essa auditoria.

Próximo bloco: tratar os achados de acesso e Linha da Vida e repetir a auditoria completa antes do piloto com dados reais.
