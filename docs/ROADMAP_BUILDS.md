# ROADMAP DE BUILDS — PLATAFORMA CER V1

> A construção da plataforma CER é estritamente incremental, auditável e guiada por especificações dedicadas para cada build.

---

## Histórico & Planejamento de Builds

### [x] Build 00 — Inicialização Constitucional & Fundação Estrutural (Atual)

- **Status:** Concluído / Pronto para transição.
- **Escopo:**
  - Fixação da Constituição Inicial (Prompt 00).
  - Documentação da Arquitetura Metodológica congelada e classes de privacidade.
  - Setup do modelo de dados inicial no PocketBase:
    - Coleção base `profiles` (vínculo com `users`, tipos `interagente` e `profissional`).
    - Coleção base `enrollments` (produto `acompanhamento_individual_cer`, status `pendente`/`ativa`/`encerrada`).
  - Criação de dados semente idempotentes (profissional `daiane.naturologia@gmail.com` e interagente sintético).
  - Base de tipos e contratos de acesso (RLS / Privacy by Design).
  - Ausência proposital de interfaces de usuário ou funcionalidades prematuras.

---

### [ ] Build 01 — Foundation + Auth + Roles + Enrollment (Próximo)

- **Status:** Aguardando especificação detalhada.
- **Escopo Previsto:**
  - Interface de Login e Redefinição de Acesso.
  - Contexto de Autenticação ativo com diferenciação de papéis (`interagente` vs `profissional`).
  - Tela/fluxo inicial de acolhimento e confirmação de Matrícula (Enrollment).
  - Proteção de rotas e separação de ambiência.

---

### [ ] Builds Posteriores (A Definir em Especificações Subsequentes)

- **Build 02:** Módulo Consciência (As 6 Dimensões & Coleta Inicial Qualitativa).
- **Build 03:** Mapa CER (Síntese Integrativa Versionada & Diferenciação de Hipóteses).
- **Build 04:** Equilíbrio & Realização (Desejos, Direções e Metas).
- **Build 05:** Planner & Mandala (Intenção de Vida vs. Vivência Real).
- **Build 06:** Eixo Evolução & Assistência Seletiva com IA.
