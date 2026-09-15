# Procedimento Técnico de Execução dos Testes de Integração em PocketBase Isolado

**Projeto:** Biblioteca CER V1 — Lote 2A  
**Finalidade:** Guia operacional determinístico para inicialização, execução, verificação e descarte seguro de ambiente de testes PocketBase descartável, garantindo zero contaminação do backend vivo.

---

## 1. Versão do PocketBase Compatível e Pendências

- **Versão Derivada:** O repositório utiliza a biblioteca cliente oficial `pocketbase: "~0.26.9"` (definida em `package.json`).
- **Compatibilidade Server-Side:** Recomenda-se binário PocketBase na versão correspondente `0.26.x` (ex: `0.26.9` ou versão LTS compatível com a API v0.26).
- **Declaração de Pendência:** O repositório não embute binários executáveis do PocketBase por razões de integridade e portabilidade multiplataforma (Linux/macOS/Windows). O download do binário compatível deve ser efetuado exclusivamente no ambiente do operador de infraestrutura / CI/CD runner.

---

## 2. Inicialização em Diretório Temporário Isolado

### 2.1 Criação do Diretório Temporário Estritamente Validado

O diretório DEVE ser um caminho isolado temporário exclusivo, gerado por utilitário de sistema operacional (como `mktemp -d` no Linux/macOS) ou subpasta descartável dentro do `/tmp/`.

> **PROIBIÇÃO ABSOLUTA:** NUNCA utilizar caminhos amplos, HOME (`~`), raiz (`/`), o próprio workspace do projeto ou caminhos baseados em variáveis não resolvidas.

```bash
# Exemplo de criação segura em ambiente Unix:
TMP_PB_DIR=$(mktemp -d /tmp/pb_cer_isolated_XXXXXX)
echo "Diretório temporário criado em: ${TMP_PB_DIR}"
```

### 2.2 Estrutura do Diretório Temporário

Copie as migrations existentes e os hooks de produção para o diretório temporário:

```bash
mkdir -p "${TMP_PB_DIR}/pb_migrations"
mkdir -p "${TMP_PB_DIR}/pb_hooks"

# Copiar migrations existentes (0001 a 0045):
cp pocketbase/migrations/*.js "${TMP_PB_DIR}/pb_migrations/"

# Copiar hooks server-side de produção:
cp pocketbase/hooks/*.js "${TMP_PB_DIR}/pb_hooks/"
```

### 2.3 Inicialização do PocketBase em Porta Local

Inicie o processo localmente vinculado a loopback (`127.0.0.1`):

```bash
./pocketbase serve \
  --dir="${TMP_PB_DIR}/pb_data" \
  --migrationsDir="${TMP_PB_DIR}/pb_migrations" \
  --hooksDir="${TMP_PB_DIR}/pb_hooks" \
  --http="127.0.0.1:8090" > "${TMP_PB_DIR}/pb.log" 2>&1 &

PB_PID=$!
echo "PocketBase isolado iniciado com PID ${PB_PID}"
```

---

## 3. Aplicação das Migrations 0001–0045

O PocketBase aplica as migrations automaticamente ao inicializar com a flag `--migrationsDir`.  
Confirme no log que todas as migrations de `0001_create_schema.js` até `0045_practice_editorial_states_and_review_gate.js` foram executadas:

```bash
grep -i "migration" "${TMP_PB_DIR}/pb.log"
```

---

## 4. Criação Segura de Usuários de Teste

Para que os gates de segurança de aprovação e publicação funcionem (`reviewer ≠ author`), crie os usuários profissionais canônicos de teste:

1. `profissional.a@cer.app` (ID: `4udevnp3htcqt4v`, senha temporária de teste)
2. `profissional.b@cer.app` (ID: `zt7alkr3554z73w`, senha temporária de teste)
3. `ana.teste@cer.app` (Interagente Ana: `v6qvh4tq60yfx8i`)

---

## 5. Variáveis de Ambiente e Health Check

### 5.1 Configuração de Variáveis de Ambiente

Para que a trava `safeMutableGate` autorize a execução de mutações, configure:

```bash
export VITE_POCKETBASE_URL="http://127.0.0.1:8090"
export CER_ALLOW_MUTABLE_TESTS="true"
export CER_TEST_ENV="isolated"
```

### 5.2 Health Check

Execute uma requisição de verificação de disponibilidade antes de disparar os testes:

```bash
curl -f http://127.0.0.1:8090/api/health || {
  echo "FALHA: PocketBase isolado não respondeu ao health check!"
  kill -9 $PB_PID
  exit 1
}
```

---

## 6. Execução das Suítes de Teste

Com o ambiente isolado ativo e saudável:

```bash
# Execução da suíte de testes de práticas:
npm run test:integration

# Ou execução pelo orquestrador completo:
npm run qa:practices
```

---

## 7. Encerramento e Descarte Seguro

### 7.1 Encerramento do Processo

```bash
if [ -n "${PB_PID}" ] && kill -0 "${PB_PID}" 2>/dev/null; then
  echo "Encerrando PocketBase isolado (PID ${PB_PID})..."
  kill "${PB_PID}"
  wait "${PB_PID}" 2>/dev/null || true
fi
```

### 7.2 Validação Rígida do Caminho antes da Remoção

Para evitar qualquer risco de deleção acidental de diretórios de sistema:

```bash
# Validação explícita de segurança:
if [[ "${TMP_PB_DIR}" =~ ^/tmp/pb_cer_isolated_[A-Za-z0-9]+$ ]]; then
  echo "Removendo diretório temporário isolado: ${TMP_PB_DIR}"
  rm -rf "${TMP_PB_DIR}"
else
  echo "ERRO DE SEGURANÇA: Caminho de descarte não atende ao padrão esperado: ${TMP_PB_DIR}"
  exit 1
fi
```

### 7.3 Comprovação de Zero Acesso ao Backend Vivo

Ao término, consulte o backend remoto vivo para auditar que:

1. Nenhuma requisição mutável (POST, PUT, PATCH, DELETE) foi emitida contra o domínio de produção.
2. As 9 collections de práticas (`cer_practices`, `cer_practice_versions`, `cer_practice_evidence`, etc.) permanecem com exatamente 0 registros.
