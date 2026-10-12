# Diagnóstico e Snapshot de Configuração de Acesso — CER V1

- **Data do snapshot:** 2026-10-12
- **Versão (package.json):** `0.0.346`
- **Escopo e natureza deste registro:** Snapshot exclusivamente descritivo de configuração arquitetural (esquemas de coleções, campos, tipos, índices e regras exatas de acesso no backend PocketBase). **NENHUM registro de usuários, NENHUMA resposta clínica e NENHUMA credencial constam ou podem constar neste documento.** Nenhuma migração ou alteração de código/dados foi executada nesta tarefa.

---

## 1. Coleção `users` (auth)

Coleção de autenticação e identificação de contas do sistema.

### Campos

- `name`: text
- `avatar`: file
- `person_id`: relation → `persons`
- `status`: select (obrigatório / required) — valores permitidos: `invited` | `active` | `suspended` | `disabled`
- `mfa_enabled`: bool
- `mfa_secret`: text
- `created`: autodate (triggers: onCreate)
- `updated`: autodate (triggers: onCreate, onUpdate)

### Índices Únicos

- `idx_tokenKey__pb_users_auth_`: `CREATE UNIQUE INDEX idx_tokenKey__pb_users_auth_ ON users (tokenKey)`
- `idx_email__pb_users_auth_`: `CREATE UNIQUE INDEX idx_email__pb_users_auth_ ON users (email) WHERE email != ''`

### API Rules Exatas

- **listRule:**
  ```text
  id = @request.auth.id && @request.auth.status = 'active'
  ```
- **viewRule:**
  ```text
  id = @request.auth.id && @request.auth.status = 'active'
  ```
- **createRule:**
  ```text
  @request.auth.id != "" && @request.auth.status = "active" && ( @collection.user_roles:actor.user_id ?= @request.auth.id && @collection.user_roles:actor.is_active ?= true && (@collection.user_roles:actor.role ?= "profissional" || @collection.user_roles:actor.role ?= "admin") ) && @request.body.status = "invited" && @request.body.person_id:isset = true && @request.body.person_id != ""
  ```
  _(Exige ator profissional ou administrador ativo via `user_roles`, status da nova conta explicitamente `"invited"` e `person_id` informado e não-vazio)._
- **updateRule:**
  ```text
  id = @request.auth.id && @request.auth.status = 'active'
  ```
- **deleteRule:**
  ```text
  id = @request.auth.id && @request.auth.status = 'active'
  ```

---

## 2. Coleção `persons` (base)

Registro de identidade civil/humana vinculada às contas e aos acompanhamentos clínicos.

### Campos

- `full_name`: text (obrigatório / required)
- `preferred_name`: text
- `email`: email
- `phone`: text
- `notes`: text
- `timezone`: text
- `treatment_preference`: select — valores: `feminino` | `masculino` | `neutro` | `outro`
- `treatment_preference_custom`: text
- `avatar_presentation`: select — valores: `feminine` | `masculine`
- `avatar_skin_tone`: select — valores: `skin_01` | `skin_02` | `skin_03` | `skin_04` | `skin_05` | `skin_06`
- `avatar_hair_color`: select — valores: `hair_black` | `hair_dark_brown` | `hair_light_brown` | `hair_blonde` | `hair_red` | `hair_gray_white`
- `avatar_customization_status`: select — valores: `completed` | `deferred`
- `avatar_version`: number
- `avatar_updated_at`: date
- `created`: autodate (triggers: onCreate)
- `updated`: autodate (triggers: onCreate, onUpdate)

### Índices

- `idx_persons_full_name`: `CREATE INDEX idx_persons_full_name ON persons (full_name)`
- `idx_persons_email`: `CREATE INDEX idx_persons_email ON persons (email)`

### API Rules Exatas

- **listRule:**
  ```text
  @request.auth.id != "" && @request.auth.status = "active" && (id = @request.auth.person_id || (( @collection.user_roles:actor.user_id ?= @request.auth.id && @collection.user_roles:actor.is_active ?= true && (@collection.user_roles:actor.role ?= "profissional" || @collection.user_roles:actor.role ?= "admin") ) && (@collection.enrollments:scope.person_id ?= id && @collection.professional_enrollment_access:access.enrollment_id ?= @collection.enrollments:scope.id && @collection.professional_enrollment_access:access.professional_user_id ?= @request.auth.id && @collection.professional_enrollment_access:access.is_active ?= true)))
  ```
- **viewRule:**
  ```text
  @request.auth.id != "" && @request.auth.status = "active" && (id = @request.auth.person_id || (( @collection.user_roles:actor.user_id ?= @request.auth.id && @collection.user_roles:actor.is_active ?= true && (@collection.user_roles:actor.role ?= "profissional" || @collection.user_roles:actor.role ?= "admin") ) && (@collection.enrollments:scope.person_id ?= id && @collection.professional_enrollment_access:access.enrollment_id ?= @collection.enrollments:scope.id && @collection.professional_enrollment_access:access.professional_user_id ?= @request.auth.id && @collection.professional_enrollment_access:access.is_active ?= true)))
  ```
  _(Acesso permitido à própria pessoa ou a profissional/administrador ativo com vínculo clínico válido via `enrollments` + `professional_enrollment_access` ativo)._
- **createRule:**
  ```text
  @request.auth.id != "" && @request.auth.status = "active" && ( @collection.user_roles:actor.user_id ?= @request.auth.id && @collection.user_roles:actor.is_active ?= true && (@collection.user_roles:actor.role ?= "profissional" || @collection.user_roles:actor.role ?= "admin") )
  ```
  _(Criação restrita a profissional ou administrador ativo via `user_roles`)._
- **updateRule:**
  ```text
  @request.auth.id != "" && @request.auth.status = "active" && (id = @request.auth.person_id || (( @collection.user_roles:actor.user_id ?= @request.auth.id && @collection.user_roles:actor.is_active ?= true && (@collection.user_roles:actor.role ?= "profissional" || @collection.user_roles:actor.role ?= "admin") ) && (@collection.enrollments:scope.person_id ?= id && @collection.professional_enrollment_access:access.enrollment_id ?= @collection.enrollments:scope.id && @collection.professional_enrollment_access:access.professional_user_id ?= @request.auth.id && @collection.professional_enrollment_access:access.is_active ?= true))) && (@request.body.email:isset = false || @request.body.email = email)
  ```
  _(Mesma autorização de visualização e leitura com salvaguarda estrita de imutabilidade do e-mail: o e-mail não pode ser alterado por update)._

---

## 3. Coleção `cer_practice_version_assets` (base)

Coleção que armazena os arquivos e mídias de apoio às práticas e intervenções.

### Campos

- `practice_version_id`: relation (obrigatório / required) → `cer_practice_versions`
- `asset_type`: select (obrigatório / required) — valores: `audio` | `document` | `video` | `external_link`
- `role`: text
- `file`: file (**CAMPO DE ARQUIVO PROTEGIDO**)
- `url_identifier`: text
- `title`: text
- `sort_order`: number
- `created`: autodate (triggers: onCreate)
- `updated`: autodate (triggers: onCreate, onUpdate)

> **Nota sobre o campo `file` protegido:**
> Conforme documentado em `docs/primeiro-acesso-arquivos-recuperacao-2026-10-05.md` e testado na migração pendente `0076_harden_protected_asset_status.js` (`col.fields.getByName('file').protected`), o campo `file` desta coleção possui flag de proteção ativa no motor do PocketBase. Isso exige token de arquivo autorizado emitido pelo backend para download, impedindo enumeração pública ou acesso não autenticado.

### Índices

- `idx_cpva_version`: `CREATE INDEX idx_cpva_version ON cer_practice_version_assets (practice_version_id)`
- `idx_cpva_type`: `CREATE INDEX idx_cpva_type ON cer_practice_version_assets (asset_type)`
- `idx_cpva_sort`: `CREATE INDEX idx_cpva_sort ON cer_practice_version_assets (sort_order)`

### API Rules Exatas

- **listRule:**
  ```text
  @request.auth.id != '' && (@request.auth.user_roles_via_user_id.role ?= 'profissional' || practice_version_id.cer_practice_assignments_via_practice_version_id.participant_user_id ?= @request.auth.id || practice_version_id.cer_resource_recommendations_via_resource_version_id.participant_user_id ?= @request.auth.id)
  ```
- **viewRule:**
  ```text
  @request.auth.id != '' && (@request.auth.user_roles_via_user_id.role ?= 'profissional' || practice_version_id.cer_practice_assignments_via_practice_version_id.participant_user_id ?= @request.auth.id || practice_version_id.cer_resource_recommendations_via_resource_version_id.participant_user_id ?= @request.auth.id)
  ```
  _(Acesso permitido a profissional ou à participante destinatária via atribuições de práticas `cer_practice_assignments` ou recomendações de recursos `cer_resource_recommendations`)._
- **createRule:**
  ```text
  @request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional'
  ```
- **updateRule:**
  ```text
  @request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional'
  ```

---

## 4. Estado de Migrações

- **Última migração aplicada no backend ativo:** `0077_reconcile_catalog_dimensions.js`
- **Próximo ordinal livre para novas migrações:** `0078`

### Migrações Pendentes (`pocketbase/pending_migrations/`)

O repositório mantém em diretório isolado (`pocketbase/pending_migrations/`, preservadas a partir do commit `73ca614`) quatro propostas de hardening de segurança:

1. `0074_harden_identity_access.js`
2. `0075_harden_care_account_status.js`
3. `0076_harden_protected_asset_status.js`
4. `0077_require_atomic_account_invitation.js`

### ⚠️ ALERTA DE CONFLITO DE ORDINAIS

Existe um **conflito direto de ordinais numéricos (0074 a 0077)** entre os arquivos do diretório `pending_migrations` e as migrações que foram efetivamente aplicadas na base ativa:

- **0074 aplicada:** `0074_create_resource_exercises.js` (vs. `0074_harden_identity_access.js` pendente)
- **0075 aplicada:** `0075_create_goal_roadmaps.js` (vs. `0075_harden_care_account_status.js` pendente)
- **0076 aplicada:** `0076_live_questionnaire_catalog.js` (vs. `0076_harden_protected_asset_status.js` pendente)
- **0077 aplicada:** `0077_reconcile_catalog_dimensions.js` (vs. `0077_require_atomic_account_invitation.js` pendente)

> **Diretiva de Operação:** Os arquivos em `pocketbase/pending_migrations/` **NUNCA** devem ser movidos para `pocketbase/migrations/` com seus nomes e números originais. Quando autorizada sua aplicação, cada um deles deverá ser renumerado sequencialmente a partir do ordinal livre `0078` (ex.: `0078_...`, `0079_...`, `0080_...`, `0081_...`), após revisão das regras já estabelecidas nas migrações e atualizações intervenientes (`updated_users.js`, `updated_persons.js`).

---

## 5. Convite e Acesso (Hooks e Rotas de Backend)

O ciclo de criação de contas de participantes e controle de acesso opera em nível de backend (pb_hooks) de forma atômica e auditada.

### Hook Ativo de Convite

- **Arquivo:** `pocketbase/hooks/on_invite_participant.js`
- **Rota registrada:** `POST /backend/v1/cer/invite-participant`
- **Segurança e Operação:**
  - Exige autenticação de conta profissional ou administradora ativa (`@request.auth.status === 'active' && user_roles.role IN ('profissional', 'admin')`).
  - Execução 100% transacional via `e.app.runInTransaction`.
  - Não efetua envio de e-mails em plaintext via SMTP desprotegido; gera e devolve a credencial temporária (`temporaryCredential` / `tempPasswordGenerated`) apenas na criação inicial para entrega por canal humano seguro.
  - Impede apropriação silenciosa de identidades (`persons` sem conta ou com vínculos divergentes) e bloqueia duplicação de cadastros.
  - Cria simultaneamente o registro em `persons` (se novo), `users` (em status `invited`), `enrollments` (ativo para o produto indicado), `professional_enrollment_access` (vínculo primário ativo), `user_roles` (`interagente`) e inicializa a jornada em `journey_states` com registro em `audit_events`.

### Hooks Relacionados de Ciclo de Vida e Acesso

- **`on_first_login.js`** (`POST /backend/v1/cer/first-login`): Permite à usuária convidada (status `invited`), autenticada com sua credencial temporária, definir sua senha definitiva (mínimo 8 caracteres) e transicionar atomicamente a conta de `invited` para `active`, registrando auditoria (`FIRST_LOGIN_COMPLETED`). O alvo é estritamente o próprio usuário autenticado.
- **`on_reset_access.js`** (`POST /backend/v1/cer/reset-participant-access`): Permite ao profissional ativo, no escopo comprovado de acompanhamento ativo da participante (`professional_enrollment_access` ativo), redefinir o acesso da interagente gerando nova credencial temporária e retornando o status para `invited`. Nega ação caso a conta esteja suspensa ou desabilitada (exigindo revisão administrativa) e nunca loga nem persiste a senha em plaintext.
- **`on_user_status_guard.js`**: Hook de proteção sobre atualizações da coleção `users` (`onRecordUpdateRequest`). Impede auto-promoção ou corrupção de status pelo próprio usuário comum (bloqueia transições não autorizadas de `status` e alterações arbitrárias de `person_id`).
- **`on_prof_access_created.js`**: Hook de auditoria pós-criação em `professional_enrollment_access` (`PROFESSIONAL_ACCESS_GRANTED`).
- **`on_prof_access_hardening.js`**: Hook que bloqueia qualquer deleção física (`onRecordDelete`) de registros na coleção `professional_enrollment_access`. Exige revogação lógica via `is_active = false`.
- **`on_prof_access_revoked.js`**: Hook de auditoria disparado quando `is_active` é alterado para `false` (`PROFESSIONAL_ACCESS_REVOKED`).

---

## 6. Estado de Backup e Recuperação

- **Situação de ferramentas gerenciadas:** Não há ferramentas gerenciadas de backup ou restauração (backup/restore point-in-time) expostas ou acessíveis diretamente via painel/interface de desenvolvedor neste ambiente de execução Skip Cloud / PocketBase.
- **Papel deste snapshot:** Conforme registrado em `docs/primeiro-acesso-arquivos-recuperacao-2026-10-05.md`, a preservação das configurações, regras de acesso (API rules), integridade de índices e esquemas de dados depende do versionamento rigoroso e rastreável dos arquivos de migração e de documentos de diagnóstico como este snapshot (`docs/diagnostico-config-acesso-2026-10-12.md`).
- **Salvaguardas:** Nenhuma base clínica de produção foi clonada para ambientes não autorizados e nenhuma credencial ou segredo foi gravado no repositório.
