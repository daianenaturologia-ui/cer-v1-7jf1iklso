# Segurança e Linha da Vida — preparação de 12/10/2026

## Resultado

As quatro correções antes preservadas fora de `migrations` foram revisadas contra o schema atual e renumeradas como 0078–0081, sem recriar coleções. A ausência delas na sequência executável explicava as falhas encontradas na reconstrução do backend.

Com essas correções, os 86 cenários de `verify-authenticated-backend.py` passam na referência PocketBase 0.26.1. Os 19 cenários dos questionários também passam. Os testes usam somente fixtures fictícias em loopback, com banco descartável. A auditoria inclui convite atômico, ativação, isolamento de pessoas e matrículas, diário/histórico privados, compartilhamento e retirada de mensagens e Linha da Vida, múltiplos vínculos, suspensão com tokens anteriores, arquivos protegidos e backup/restauração dos dados fictícios.

## Mudanças

- 0078: pessoas visíveis somente ao titular ou profissional com vínculo ativo; índice de uma conta por pessoa, sem mesclar ou apagar duplicatas.
- 0079: conta ativa obrigatória nas coleções antigas de cuidado; vínculo profissional correlacionado na Linha da Vida; edição parcial de compartilhamento permitida ao titular sem mudar matrícula.
- 0080: conta ativa obrigatória para os arquivos protegidos.
- 0081: criação de contas por cliente comum bloqueada; mantém a rota de convite transacional com vínculo autorizado.

## Aplicação pendente

Este bloco está preparado para revisão, sem aplicação no servidor vivo. Antes de instalar: recuperar acesso ao Skip, conferir as migrações efetivamente aplicadas, revisar duplicatas de conta sem expor conteúdo clínico e verificar backup/recuperação. O índice recusa duplicatas; não há limpeza automática. Não considerar o sucesso da referência como homologação do servidor gerenciado.

Os jobs antigos de QA continuam com falhas próprias. O job dos questionários acrescenta a auditoria autenticada completa para tornar regressões do schema e das regras visíveis.
