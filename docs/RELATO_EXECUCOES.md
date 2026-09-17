# Relato Automático das Execuções do GitHub Actions

Este documento descreve o canal de relato de execuções do GitHub Actions no projeto **CER V1**. O canal permite que o próprio projeto, agentes ou desenvolvedores leiam os resultados de todas as automações via Git padrão, sem depender de token de API do GitHub, sem abrir a interface web e sem solicitar capturas de tela à usuária (Daiane).

---

## 1. Como Funciona a Arquitetura

O workflow do GitHub Actions (`.github/workflows/disposable-bench.yml`) executa 4 jobs:

1. **General QA Practices** (`qa-general`): Pipeline de 9 etapas (testes unitários, trava de segurança, inspeção de ambiente, integrações, regressões, lint, typecheck e build).
2. **Caderno Privacy Proof** (`caderno-privacy-proof`): Prova de privacidade e isolamento RLS dos cenários `CAD-01` a `CAD-07`.
3. **Primeiro Atendimento Verification** (`primeiro-atendimento-verification`): Verificações funcionais reais de API dos cenários `PAV-01` a `PAV-06`.
4. **Visual Demo — Primeiro Atendimento** (`visual-demo-primeiro-atendimento`): Conferência visual no navegador Chromium (Playwright) em 8 etapas com capturas e vídeo.

Cada um desses jobs possui uma etapa final com `if: always()`, que:

- Constrói um objeto JSON estruturado com o resultado da execução.
- Atualiza o arquivo correspondente no branch órfão/dedicado **`run-status`** do repositório.
- Realiza push autenticado com o `GITHUB_TOKEN` padrão do workflow (`permissions: contents: write`).
- Utiliza a flag `[skip ci]` na mensagem de commit para evitar loops ou execuções recursivas indesejadas.
- Aplica retry com rebase caso múltiplos jobs façam push simultâneo.

---

## 2. Arquivos de Status no Branch `run-status`

O branch `run-status` mantém a versão mais recente dos relatórios de cada job:

| Arquivo            | Job de Origem                      | Conteúdo Principal                                                                                                                              |
| :----------------- | :--------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| `caderno.json`     | Caderno Privacy Proof              | SHA do commit, status do job, data/hora UTC e resultados individuais dos cenários **CAD-01** a **CAD-07** (PASS, FAIL, BLOCKED, NÃO EXECUTADO). |
| `pav.json`         | Primeiro Atendimento Verification  | SHA do commit, status do job, data/hora UTC e resultados individuais dos cenários **PAV-01** a **PAV-06** (PASS, FAIL, BLOCKED, NÃO EXECUTADO). |
| `visual-demo.json` | Visual Demo — Primeiro Atendimento | SHA do commit, status do job, data/hora UTC e resultados das **8 etapas visuais** da demonstração no navegador.                                 |
| `qa.json`          | General QA Practices               | SHA do commit, status do job, data/hora UTC, conclusão geral do pipeline e status de cada uma das 9 etapas de QA.                               |

---

## 3. Como Consultar os Resultados via Git

Para ler os resultados diretamente pelo terminal ou ferramentas de automação, utilize os comandos do Git:

### Atualizar referências remotas do branch:

```bash
git fetch origin run-status
```

### Consultar o relatório de privacidade do Caderno (CAD-01..CAD-07):

```bash
git show origin/run-status:caderno.json
```

### Consultar a verificação funcional do Primeiro Atendimento (PAV-01..PAV-06):

```bash
git show origin/run-status:pav.json
```

### Consultar a demonstração visual (8 etapas):

```bash
git show origin/run-status:visual-demo.json
```

### Consultar o pipeline de QA Geral:

```bash
git show origin/run-status:qa.json
```

### Filtrar apenas status dos cenários com `jq` (opcional):

```bash
git show origin/run-status:pav.json | jq '.scenarios[] | {id, status, details}'
```

### Ver histórico de atualizações dos status:

```bash
git log -n 5 --oneline origin/run-status
```

---

## 4. Política de Segurança e Privacidade

- **Sem segredos expostos:** Os relatórios JSON contêm exclusivamente identificadores de teste, nomes descritivos públicos, status de asserção e o SHA do commit.
- **Zero credenciais:** Nenhuma senha, token de superuser ou conteúdo de banco de dados é registrado nos JSONs.
- **Fail-closed:** Se um job falhar antes de iniciar sua suíte (ex: falha de download ou compilação), a etapa `if: always()` registra o job com `conclusion: "failure"` e os cenários como `NÃO EXECUTADO` ou `FAIL`.
