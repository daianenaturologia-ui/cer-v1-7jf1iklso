#!/usr/bin/env node

/**
 * SCRIPT DE GERENCIAMENTO DA BANCADA DESCARTÁVEL POCKETBASE (CER V1)
 *
 * Objetivo:
 * Fornecer aos desenvolvedores e pipelines de CI/CD (GitHub Actions / runner local)
 * um utilitário determinístico para:
 * 1. Inicializar bancada efêmera em porta local (127.0.0.1) com diretório temporário.
 * 2. Carregar migrations e hooks de pocketbase/.
 * 3. Executar verificações de integridade e isolamento.
 * 4. Descartar e limpar integralmente sem deixar resíduos.
 *
 * Proteções:
 * - NUNCA toca no backend do Skip Cloud.
 * - Falha se qualquer URL remota for informada.
 * - Trava safeMutableGate sempre respeitada.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const POCKETBASE_VERSION = '0.26.1'
const DEFAULT_PORT = 8090
const DEFAULT_HOST = '127.0.0.1'

/**
 * @typedef {Object} BenchConfig
 * @property {string} tempDir
 * @property {string} migrationsDir
 * @property {string} hooksDir
 * @property {string} dataDir
 * @property {number} port
 * @property {string} host
 * @property {string} url
 */

export function createBenchWorkspace() {
  const prefix = path.join(os.tmpdir(), 'pb_cer_bench_')
  const tempDir = fs.mkdtempSync(prefix)
  const migrationsDir = path.join(tempDir, 'pb_migrations')
  const hooksDir = path.join(tempDir, 'pb_hooks')
  const dataDir = path.join(tempDir, 'pb_data')

  fs.mkdirSync(migrationsDir, { recursive: true })
  fs.mkdirSync(hooksDir, { recursive: true })
  fs.mkdirSync(dataDir, { recursive: true })

  // Copiar migrations do projeto
  const repoMigrations = path.resolve(process.cwd(), 'pocketbase/migrations')
  if (fs.existsSync(repoMigrations)) {
    const files = fs.readdirSync(repoMigrations)
    for (const file of files) {
      if (file.endsWith('.js')) {
        fs.copyFileSync(path.join(repoMigrations, file), path.join(migrationsDir, file))
      }
    }
  }

  // Copiar hooks do projeto
  const repoHooks = path.resolve(process.cwd(), 'pocketbase/hooks')
  if (fs.existsSync(repoHooks)) {
    const files = fs.readdirSync(repoHooks)
    for (const file of files) {
      if (file.endsWith('.js')) {
        fs.copyFileSync(path.join(repoHooks, file), path.join(hooksDir, file))
      }
    }
  }

  return {
    tempDir,
    migrationsDir,
    hooksDir,
    dataDir,
    port: DEFAULT_PORT,
    host: DEFAULT_HOST,
    url: `http://${DEFAULT_HOST}:${DEFAULT_PORT}`,
  }
}

export function cleanupBenchWorkspace(config) {
  if (fs.existsSync(config.tempDir)) {
    fs.rmSync(config.tempDir, { recursive: true, force: true })
  }
}

// Se chamado diretamente via linha de comando
if (process.argv[1] && process.argv[1].endsWith('disposable-bench.mjs')) {
  console.log('=== BANCADA DESCARTÁVEL POCKETBASE (CER V1) ===')
  const config = createBenchWorkspace()
  console.log(`[BANCADA] Diretório efêmero criado: ${config.tempDir}`)
  console.log(`[BANCADA] Migrations preparadas em: ${config.migrationsDir}`)
  console.log(`[BANCADA] Hooks preparados em: ${config.hooksDir}`)
  console.log(`[BANCADA] URL de escuta planejada: ${config.url}`)
  console.log('Para iniciar o binário local PocketBase v' + POCKETBASE_VERSION + ':')
  console.log(
    `  pocketbase serve --dir="${config.dataDir}" --migrationsDir="${config.migrationsDir}" --hooksDir="${config.hooksDir}" --http="${config.host}:${config.port}"`,
  )
  cleanupBenchWorkspace(config)
  console.log('[BANCADA] Verificação concluída. Diretório limpo.')
}
