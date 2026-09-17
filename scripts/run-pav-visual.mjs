#!/usr/bin/env node

/**
 * EXECUTOR VISUAL DO PRIMEIRO ATENDIMENTO (CER V1)
 *
 * Objetivo:
 * Realizar a conferência visual do percurso de Primeiro Atendimento no navegador real
 * (Playwright Chromium Headless) apontado estritamente para a bancada descartável local
 * (http://127.0.0.1:8090) e o app real (preview/dev).
 *
 * 8 Etapas e Capturas de Imagem (nomes fixos):
 * - 01-relato-rascunho.png (login interagente A -> /app -> 3 perguntas com texto fictício -> "Salvar Rascunho")
 * - 02-relato-enviado.png ("Enviar para Daiane")
 * - 03-prontuario-relato.png (login profissional -> prontuário de A -> relato visível com autoria "Enviado por {nome}")
 * - 04-nota-privada.png (registrar sessão manual + nota privada)
 * - 05-plano-compartilhado.png (área "Plano de Cuidado" -> criar plano com próximo passo -> ação explícita de compartilhar)
 * - 06-retorno-proximo-passo.png (login interagente A -> /app -> "Próximo Passo do Nosso Cuidado" -> 1 das 4 respostas + comentário fictício)
 * - 07-retorno-no-prontuario.png (login profissional -> card "Retornos ao Próximo Passo" com resposta e autoria)
 * - 08-interagente-b-sem-acesso.png (login interagente B -> /app mostra que plano/relato de A não aparece)
 *
 * Vídeo do fluxo:
 * Gravado pelo Playwright context com recordVideo.
 *
 * Padrão Fail-Closed / Falha Honesta:
 * Se qualquer etapa não conseguir ser completada no navegador:
 * - Registra captura do estado atual no diretório de saída
 * - Registra no log em qual etapa parou
 * - Marca a etapa como PAROU na tabela do GitHub Step Summary (etapa -> COMPLETA/PAROU)
 * - Encerra o processo com exit code 1
 * - Nada de imagens inventadas ou etapas falsamente completas.
 *
 * Regras estritas:
 * 1. SafeMutableGate obrigatório antes de qualquer escrita de semeadura na bancada descartável.
 * 2. Jamais fotografar o formulário de login com credenciais preenchidas (apenas pós-login).
 * 3. Todo conteúdo gerado é estritamente genérico e fictício.
 * 4. Zero senhas, tokens ou dados sensíveis em capturas, vídeos ou sumários.
 */

import { chromium } from '@playwright/test'
import PocketBase from 'pocketbase'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertSafeMutableTestEnvironment,
  inspectTestEnvironment,
} from '../src/services/safeMutableGate.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const ARTIFACTS_DIR =
  process.env.VISUAL_ARTIFACTS_DIR ||
  path.join(rootDir, 'output', 'demo-visual-primeiro-atendimento')
const APP_URL = process.env.APP_URL || 'http://127.0.0.1:4173'
const PB_URL = process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'

const STEP_DEFINITIONS = [
  {
    num: 1,
    id: '01-relato-rascunho',
    filename: '01-relato-rascunho.png',
    title: 'Interagente A: Relato Inicial em Rascunho',
    description: 'Login interagente A -> /app -> preenche as 3 perguntas -> Salvar Rascunho',
  },
  {
    num: 2,
    id: '02-relato-enviado',
    filename: '02-relato-enviado.png',
    title: 'Interagente A: Relato Enviado para Daiane',
    description: 'Ação explícita de Enviar para Daiane com confirmação visual',
  },
  {
    num: 3,
    id: '03-prontuario-relato',
    filename: '03-prontuario-relato.png',
    title: 'Profissional: Prontuário com Relato Recebido',
    description: 'Login profissional -> prontuário de A -> relato visível com autoria validada',
  },
  {
    num: 4,
    id: '04-nota-privada',
    filename: '04-nota-privada.png',
    title: 'Profissional: Sessão Manual e Nota Privada',
    description: 'Criação/registro de sessão manual com anotação privada confidencial',
  },
  {
    num: 5,
    id: '05-plano-compartilhado',
    filename: '05-plano-compartilhado.png',
    title: 'Profissional: Plano de Cuidado Compartilhado',
    description:
      'Área 3 Plano de Cuidado -> criar plano com próximo passo -> compartilhar explicitamente',
  },
  {
    num: 6,
    id: '06-retorno-proximo-passo',
    filename: '06-retorno-proximo-passo.png',
    title: 'Interagente A: Retorno ao Próximo Passo',
    description: 'Login interagente A -> /app -> Próximo Passo -> resposta acolhedora e comentário',
  },
  {
    num: 7,
    id: '07-retorno-no-prontuario',
    filename: '07-retorno-no-prontuario.png',
    title: 'Profissional: Retorno da Interagente no Prontuário',
    description:
      'Login profissional -> Área 1 -> card Retornos ao Próximo Passo com resposta e autoria',
  },
  {
    num: 8,
    id: '08-interagente-b-sem-acesso',
    filename: '08-interagente-b-sem-acesso.png',
    title: 'Interagente B: Isolamento Estrito',
    description:
      'Login interagente B -> /app sem acesso ao plano, relato ou dados da Interagente A',
  },
]

// Estado de cada etapa para o sumário final do GitHub
const stepStatuses = STEP_DEFINITIONS.map((def) => ({
  ...def,
  status: 'PENDENTE', // PENDENTE, COMPLETA, PAROU
  note: '',
}))

function writeGitHubSummary(allSuccess, failureReason) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY
  if (!summaryFile) return

  let md = `## 📸 Demonstração Visual: Primeiro Atendimento (CER V1)\n\n`
  md += `**Status Geral:** ${allSuccess ? '✅ SUCESSO COMPLETO' : '❌ EXECUÇÃO INTERROMPIDA'}\n\n`
  if (!allSuccess && failureReason) {
    md += `> **Motivo da interrupção:** ${failureReason}\n\n`
  }

  md += `| Etapa | Identificador | Arquivo de Captura | Estado |\n`
  md += `| :---: | :--- | :--- | :---: |\n`

  for (const s of stepStatuses) {
    const badge =
      s.status === 'COMPLETA' ? '✅ COMPLETA' : s.status === 'PAROU' ? '🛑 PAROU' : '⏳ PENDENTE'
    md += `| ${s.num} | ${s.title} | \`${s.filename}\` | ${badge} |\n`
  }

  md += `\n**Artefatos:** Capturas PNG e gravação de vídeo disponíveis no pacote \`demo-visual-primeiro-atendimento\`.\n`
  md += `*Nota de integridade: Todos os dados apresentados são fictícios e foram executados exclusivamente em bancada efêmera.*\n`

  try {
    fs.appendFileSync(summaryFile, md, 'utf8')
  } catch (err) {
    console.error('Falha ao escrever GITHUB_STEP_SUMMARY:', err)
  }
}

async function seedDisposableDatabase() {
  console.log(
    '[SEMEADURA] Conectando como superuser na base descartável para preparar contas fictícias...',
  )
  const adminEmail = process.env.CER_BENCH_SUPERUSER_EMAIL || 'bench-admin@cer.isolated'
  const adminPass = process.env.CER_BENCH_SUPERUSER_PASSWORD || 'BenchAdminSecret123!'

  const adminPb = new PocketBase(PB_URL)
  adminPb.autoCancellation(false)

  try {
    await adminPb.collection('_superusers').authWithPassword(adminEmail, adminPass)
  } catch {
    await adminPb.admins.authWithPassword(adminEmail, adminPass)
  }

  const runId = Date.now()
  const defaultPassword = 'TestPassword123!'

  // 1. Profissional Fictícia: Dra. Daiane Fictícia
  const personProf = await adminPb.collection('persons').create({
    full_name: 'Dra. Daiane Fictícia',
    preferred_name: 'Daiane',
    email: `daiane.ficticia.${runId}@cer.local`,
  })

  const userProf = await adminPb.collection('users').create({
    email: `daiane.ficticia.${runId}@cer.local`,
    password: defaultPassword,
    passwordConfirm: defaultPassword,
    person_id: personProf.id,
    status: 'active',
  })

  await adminPb.collection('user_roles').create({
    user_id: userProf.id,
    role: 'profissional',
    is_active: true,
  })

  // 2. Interagente A Fictícia: Alice Fictícia
  const personAlice = await adminPb.collection('persons').create({
    full_name: 'Alice da Silva Fictícia',
    preferred_name: 'Alice',
    email: `alice.ficticia.${runId}@cer.local`,
  })

  const userAlice = await adminPb.collection('users').create({
    email: `alice.ficticia.${runId}@cer.local`,
    password: defaultPassword,
    passwordConfirm: defaultPassword,
    person_id: personAlice.id,
    status: 'active',
  })

  await adminPb.collection('user_roles').create({
    user_id: userAlice.id,
    role: 'interagente',
    is_active: true,
  })

  const enrollmentA = await adminPb.collection('enrollments').create({
    person_id: personAlice.id,
    status: 'active',
  })

  await adminPb.collection('professional_enrollment_access').create({
    enrollment_id: enrollmentA.id,
    professional_user_id: userProf.id,
    access_role: 'primary',
    is_active: true,
  })

  // 3. Interagente B Fictícia: Beatriz Controle Fictícia
  const personBeatriz = await adminPb.collection('persons').create({
    full_name: 'Beatriz Controle Fictícia',
    preferred_name: 'Beatriz',
    email: `beatriz.ficticia.${runId}@cer.local`,
  })

  const userBeatriz = await adminPb.collection('users').create({
    email: `beatriz.ficticia.${runId}@cer.local`,
    password: defaultPassword,
    passwordConfirm: defaultPassword,
    person_id: personBeatriz.id,
    status: 'active',
  })

  await adminPb.collection('user_roles').create({
    user_id: userBeatriz.id,
    role: 'interagente',
    is_active: true,
  })

  const enrollmentB = await adminPb.collection('enrollments').create({
    person_id: personBeatriz.id,
    status: 'active',
  })

  console.log('[SEMEADURA] Contas fictícias criadas com sucesso na bancada descartável.')
  return {
    prof: { email: userProf.email, password: defaultPassword, name: 'Daiane' },
    alice: {
      email: userAlice.email,
      password: defaultPassword,
      name: 'Alice',
      enrollmentId: enrollmentA.id,
    },
    beatriz: {
      email: userBeatriz.email,
      password: defaultPassword,
      name: 'Beatriz',
      enrollmentId: enrollmentB.id,
    },
  }
}

async function main() {
  console.log('\n======================================================================')
  console.log('  EXECUTOR VISUAL DO PRIMEIRO ATENDIMENTO — PLAYWRIGHT CHROMIUM')
  console.log('======================================================================\n')

  // Trava Canônica
  const inspection = inspectTestEnvironment(PB_URL)
  console.log(`- Backend PocketBase: ${inspection.backendUrl}`)
  console.log(`- App URL: ${APP_URL}`)
  console.log(`- Diretório de Artefatos: ${ARTIFACTS_DIR}`)
  console.log(`- Autorização SafeMutableGate: ${inspection.isAllowed}`)

  if (!inspection.isAllowed) {
    console.error('\n[ERRO FATAL] Trava de segurança safeMutableGate bloqueou a execução!')
    console.error(`Motivo: ${inspection.blockReason}`)
    writeGitHubSummary(false, `safeMutableGate: ${inspection.blockReason}`)
    process.exit(1)
  }

  assertSafeMutableTestEnvironment(PB_URL)

  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true })
  const videosDir = path.join(ARTIFACTS_DIR, 'videos')
  fs.mkdirSync(videosDir, { recursive: true })

  // 1. Semear dados na bancada efêmera
  let seed
  try {
    seed = await seedDisposableDatabase()
  } catch (err) {
    console.error('[ERRO FATAL NA SEMEADURA]:', err)
    writeGitHubSummary(false, `Falha na semeadura da bancada efêmera: ${err.message}`)
    process.exit(1)
  }

  // 2. Iniciar Playwright Chromium com gravação de vídeo
  console.log('\n[PLAYWRIGHT] Inicializando Chromium headless...')
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir: videosDir,
      size: { width: 1280, height: 800 },
    },
  })

  const page = await context.newPage()

  let currentStepIndex = 0

  async function failStep(err) {
    const failedDef = stepStatuses[currentStepIndex]
    if (failedDef) {
      failedDef.status = 'PAROU'
      failedDef.note = err?.message || String(err)
    }
    console.error(`\n[🛑 PAROU NA ETAPA ${currentStepIndex + 1}] ${failedDef?.title}:`, err)

    // Capturar tela do estado atual onde parou
    try {
      const stopPngPath = path.join(ARTIFACTS_DIR, `parou-etapa-${currentStepIndex + 1}.png`)
      await page.screenshot({ path: stopPngPath, fullPage: true })
      console.log(`[ARTEFATO] Captura do momento de parada salva em: ${stopPngPath}`)
    } catch (scErr) {
      console.error('Falha ao salvar captura de parada:', scErr)
    }

    try {
      await page.close()
      await context.close()
      await browser.close()
    } catch {
      /* ignore */
    }

    writeGitHubSummary(
      false,
      `Interrompido na etapa ${currentStepIndex + 1} (${failedDef?.title}): ${err?.message || err}`,
    )
    process.exit(1)
  }

  async function loginAs(email, password, expectedUrlFragment) {
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle' })
    // Preencher campos de login
    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[type="password"]').fill(password)
    // Clicar em Entrar
    await page.locator('button[type="submit"]:has-text("Entrar")').click()
    // Aguardar transição pós-login
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
    if (expectedUrlFragment) {
      await page.waitForURL((url) => url.pathname.includes(expectedUrlFragment), { timeout: 10000 })
    }
    await page.waitForLoadState('networkidle')
  }

  async function logout() {
    try {
      const logoutBtn = page.locator('button:has-text("Sair")').first()
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click()
        await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 10000 })
      } else {
        await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle' })
      }
    } catch {
      await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle' })
    }
  }

  try {
    // =========================================================================
    // ETAPA 1: 01-relato-rascunho.png
    // Interagente A: preencher 3 perguntas genéricas e salvar rascunho
    // =========================================================================
    currentStepIndex = 0
    console.log(`\n[ETAPA 1] ${STEP_DEFINITIONS[0].title}...`)

    await loginAs(seed.alice.email, seed.alice.password, '/app')

    // Garantir que está na home da interagente
    await page.waitForSelector('text=Seu Espaço Inicial de Acolhimento', { timeout: 15000 })

    // Preencher as 3 perguntas de acolhimento inicial com texto genérico e fictício
    const textareas = page.locator('textarea')
    await textareas
      .nth(0)
      .fill('Quero organizar melhor minha rotina de sono e momentos de descanso.')
    await textareas
      .nth(1)
      .fill('Caminhadas leves no fim da tarde e pausas para respirar com calma.')
    await textareas
      .nth(2)
      .fill('Cuidar da sensação de sobrecarga mental nas transições de trabalho.')

    // Clicar no botão "Salvar Rascunho"
    const btnDraft = page.locator('button:has-text("Salvar Rascunho")')
    await btnDraft.click()

    // Aguardar confirmação do toast de rascunho salvo
    await page.waitForSelector('text=Rascunho salvo', { timeout: 8000 })

    // Capturar UMA imagem da etapa (sem formulário de login nem senhas)
    const img1Path = path.join(ARTIFACTS_DIR, STEP_DEFINITIONS[0].filename)
    await page.screenshot({ path: img1Path, fullPage: true })
    console.log(`  -> Imagem salva: ${STEP_DEFINITIONS[0].filename}`)
    stepStatuses[0].status = 'COMPLETA'

    // =========================================================================
    // ETAPA 2: 02-relato-enviado.png
    // Interagente A: "Enviar para Daiane"
    // =========================================================================
    currentStepIndex = 1
    console.log(`\n[ETAPA 2] ${STEP_DEFINITIONS[1].title}...`)

    const btnSend = page.locator('button:has-text("Enviar para Daiane")')
    await btnSend.click()

    // Aguardar mensagem de confirmação do envio
    await page.waitForSelector('text=Relato Entregue para Daiane', { timeout: 10000 })

    const img2Path = path.join(ARTIFACTS_DIR, STEP_DEFINITIONS[1].filename)
    await page.screenshot({ path: img2Path, fullPage: true })
    console.log(`  -> Imagem salva: ${STEP_DEFINITIONS[1].filename}`)
    stepStatuses[1].status = 'COMPLETA'

    // =========================================================================
    // ETAPA 3: 03-prontuario-relato.png
    // Profissional Daiane: abrir prontuário de A e visualizar relato com autoria
    // =========================================================================
    currentStepIndex = 2
    console.log(`\n[ETAPA 3] ${STEP_DEFINITIONS[2].title}...`)

    await logout()
    await loginAs(seed.prof.email, seed.prof.password, '/profissional')

    // Na lista de participantes, navegar diretamente para o prontuário de Alice
    await page.goto(`${APP_URL}/profissional/${seed.alice.enrollmentId}`, {
      waitUntil: 'networkidle',
    })

    // No prontuário (Área 1: Resumo & Atenção), verificar que o relato de Alice aparece
    await page.waitForSelector('text=Recados da Interagente para este Encontro', { timeout: 15000 })
    await page.waitForSelector(`text=Enviado por ${seed.alice.name}`, { timeout: 10000 })

    const img3Path = path.join(ARTIFACTS_DIR, STEP_DEFINITIONS[2].filename)
    await page.screenshot({ path: img3Path, fullPage: true })
    console.log(`  -> Imagem salva: ${STEP_DEFINITIONS[2].filename}`)
    stepStatuses[2].status = 'COMPLETA'

    // =========================================================================
    // ETAPA 4: 04-nota-privada.png
    // Profissional: registrar sessão manual + nota privada
    // =========================================================================
    currentStepIndex = 3
    console.log(`\n[ETAPA 4] ${STEP_DEFINITIONS[3].title}...`)

    // No ProfessionalSessionManager, clicar em "Novo Encontro" para criar sessão manual
    const btnNovoEncontro = page.locator('button:has-text("Novo Encontro")').first()
    await btnNovoEncontro.click()

    // Aguardar feedback de agendamento ou aba de encontro atual
    await page.waitForTimeout(1000)

    // Clicar em "Iniciar Encontro" se estiver agendado
    const btnIniciar = page.locator('button:has-text("Iniciar Encontro")').first()
    if (await btnIniciar.isVisible()) {
      await btnIniciar.click()
      await page.waitForTimeout(1000)
    }

    // Preencher anotação privada da profissional
    const notaTextarea = page
      .locator('textarea[placeholder*="Espaço livre para reflexões"]')
      .first()
    await notaTextarea.fill(
      'Acolhimento inicial realizado com escuta atenta da rotina de sono e pausas diárias. Interagente demonstrou excelente receptividade para pequenos experimentos.',
    )

    // Clicar em "Salvar Anotação"
    const btnSalvarNota = page.locator('button:has-text("Salvar Anotação")').first()
    await btnSalvarNota.click()
    await page.waitForSelector('text=Nota profissional salva com sucesso', { timeout: 8000 })

    const img4Path = path.join(ARTIFACTS_DIR, STEP_DEFINITIONS[3].filename)
    await page.screenshot({ path: img4Path, fullPage: true })
    console.log(`  -> Imagem salva: ${STEP_DEFINITIONS[3].filename}`)
    stepStatuses[3].status = 'COMPLETA'

    // =========================================================================
    // ETAPA 5: 05-plano-compartilhado.png
    // Profissional: Área 3 Plano de Cuidado -> criar plano com próximo passo -> compartilhar explicitamente
    // =========================================================================
    currentStepIndex = 4
    console.log(`\n[ETAPA 5] ${STEP_DEFINITIONS[4].title}...`)

    // Navegar para Área 3 "Plano de Cuidado"
    const btnTabPlano = page.locator('button:has-text("3. Plano de Cuidado")').first()
    await btnTabPlano.click()
    await page.waitForTimeout(1000)

    // Clicar em "Criar Primeiro Plano de Cuidado" ou "Novo Plano"
    const btnNovoPlano = page
      .locator('button:has-text("Novo Plano"), button:has-text("Criar Primeiro Plano de Cuidado")')
      .first()
    await btnNovoPlano.click()

    // Preencher o modal de novo plano
    await page
      .locator('input[placeholder*="Direção de cuidado"], input[placeholder*="Fortalecimento"]')
      .first()
      .fill('Ritmo de descanso consciente e pausas restaurativas')
    await page
      .locator('input[placeholder*="Intenção Terapêutica"]')
      .first()
      .fill('Estabelecer ritmo suave de pausas durante a rotina diária')
    await page.locator('button:has-text("Salvar Rascunho")').first().click()

    await page.waitForSelector('text=Rascunho de Plano de Cuidado criado com sucesso', {
      timeout: 10000,
    })

    // Adicionar uma prioridade ao plano
    const btnAddPrio = page.locator('button:has-text("Adicionar Prioridade")').first()
    await btnAddPrio.click()
    await page
      .locator('input[placeholder*="Título do Foco"]')
      .first()
      .fill('Pausa de 5 minutos para respiração consciente')
    await page
      .locator('textarea[placeholder*="Detalhes ou contextualização"]')
      .first()
      .fill('Experimentar uma pausa breve no meio da tarde para descanso somático.')
    await page.locator('button:has-text("Adicionar Prioridade")').last().click()

    await page.waitForSelector('text=Prioridade adicionada ao plano', { timeout: 8000 })

    // Ativar o plano
    const btnAtivar = page.locator('button:has-text("Ativar Plano")').first()
    if (await btnAtivar.isVisible()) {
      await btnAtivar.click()
      await page.waitForSelector('text=Plano de Cuidado ativado com sucesso', { timeout: 8000 })
    }

    // Ação explícita de compartilhar plano com a participante
    const btnShare = page
      .locator(`button:has-text("Compartilhar plano com ${seed.alice.name}")`)
      .first()
    await btnShare.click()

    // No modal de preview obrigatório, selecionar canal pelo aplicativo se disponível e confirmar
    await page.waitForSelector('text=Preview Obrigatório de Apresentação', { timeout: 8000 })
    const btnCanalApp = page.locator('button:has-text("Pelo Aplicativo")').first()
    if (await btnCanalApp.isVisible()) {
      await btnCanalApp.click()
    }
    const btnConfirmarShare = page
      .locator(`button:has-text("Compartilhar plano com ${seed.alice.name}")`)
      .last()
    await btnConfirmarShare.click()

    await page.waitForSelector(
      'text=Plano de Cuidado apresentado para a participante com sucesso',
      { timeout: 10000 },
    )

    const img5Path = path.join(ARTIFACTS_DIR, STEP_DEFINITIONS[4].filename)
    await page.screenshot({ path: img5Path, fullPage: true })
    console.log(`  -> Imagem salva: ${STEP_DEFINITIONS[4].filename}`)
    stepStatuses[4].status = 'COMPLETA'

    // =========================================================================
    // ETAPA 6: 06-retorno-proximo-passo.png
    // Interagente A: login -> /app -> Próximo Passo -> 1 das 4 respostas + comentário
    // =========================================================================
    currentStepIndex = 5
    console.log(`\n[ETAPA 6] ${STEP_DEFINITIONS[5].title}...`)

    await logout()
    await loginAs(seed.alice.email, seed.alice.password, '/app')

    // Localizar a seção "Próximo Passo do Nosso Cuidado"
    await page.waitForSelector('text=Próximo Passo do Nosso Cuidado', { timeout: 15000 })

    // Selecionar uma das 4 opções acolhedoras (ex: "quero tentar")
    const btnQueroTentar = page.locator('button:has-text("quero tentar")').first()
    await btnQueroTentar.click()

    // Preencher comentário fictício
    const commentArea = page.locator('textarea[placeholder*="Como você imagina tentar"]').first()
    await commentArea.fill('Gostei da proposta e vou começar amanhã no período da tarde.')

    // Enviar retorno para Daiane
    const btnSendRetorno = page.locator('button:has-text("Enviar retorno para Daiane")').first()
    await btnSendRetorno.click()

    await page.waitForSelector('text=Retorno acolhido', { timeout: 8000 })

    const img6Path = path.join(ARTIFACTS_DIR, STEP_DEFINITIONS[5].filename)
    await page.screenshot({ path: img6Path, fullPage: true })
    console.log(`  -> Imagem salva: ${STEP_DEFINITIONS[5].filename}`)
    stepStatuses[5].status = 'COMPLETA'

    // =========================================================================
    // ETAPA 7: 07-retorno-no-prontuario.png
    // Profissional Daiane: prontuário de A -> card "Retornos ao Próximo Passo" com resposta e autoria
    // =========================================================================
    currentStepIndex = 6
    console.log(`\n[ETAPA 7] ${STEP_DEFINITIONS[6].title}...`)

    await logout()
    await loginAs(seed.prof.email, seed.prof.password, '/profissional')

    // Ir para prontuário de A
    await page.goto(`${APP_URL}/profissional/${seed.alice.enrollmentId}`, {
      waitUntil: 'networkidle',
    })

    // Na Área 1 (Resumo & Atenção), verificar card "Retornos ao Próximo Passo"
    await page.waitForSelector('text=Retornos ao Próximo Passo', { timeout: 15000 })
    await page.waitForSelector('text=quero tentar', { timeout: 10000 })
    await page.waitForSelector(`text=Enviado por ${seed.alice.name}`, { timeout: 10000 })

    const img7Path = path.join(ARTIFACTS_DIR, STEP_DEFINITIONS[6].filename)
    await page.screenshot({ path: img7Path, fullPage: true })
    console.log(`  -> Imagem salva: ${STEP_DEFINITIONS[6].filename}`)
    stepStatuses[6].status = 'COMPLETA'

    // =========================================================================
    // ETAPA 8: 08-interagente-b-sem-acesso.png
    // Interagente B: login -> /app -> isolamento estrito: plano/relato de A não aparecem
    // =========================================================================
    currentStepIndex = 7
    console.log(`\n[ETAPA 8] ${STEP_DEFINITIONS[7].title}...`)

    await logout()
    await loginAs(seed.beatriz.email, seed.beatriz.password, '/app')

    // Confirmar que Beatriz está em seu espaço
    await page.waitForSelector(`text=Olá, ${seed.beatriz.name}`, { timeout: 15000 })

    // Garantir que o plano de Alice e o relato enviado de Alice NÃO aparecem para Beatriz
    const bodyText = await page.locator('body').innerText()
    const planoAliceVazou = bodyText.includes('Ritmo de descanso consciente e pausas restaurativas')
    const relatoAliceVazou = bodyText.includes('Quero organizar melhor minha rotina de sono')

    if (planoAliceVazou || relatoAliceVazou) {
      throw new Error(
        `Isolamento violado: dados de Alice vazaram para Beatriz! (plano=${planoAliceVazou}, relato=${relatoAliceVazou})`,
      )
    }

    const img8Path = path.join(ARTIFACTS_DIR, STEP_DEFINITIONS[7].filename)
    await page.screenshot({ path: img8Path, fullPage: true })
    console.log(`  -> Imagem salva: ${STEP_DEFINITIONS[7].filename}`)
    stepStatuses[7].status = 'COMPLETA'

    console.log('\n======================================================================')
    console.log('  TODAS AS 8 ETAPAS FORAM CONCLUÍDAS COM SUCESSO NO NAVEGADOR REAL!')
    console.log('======================================================================\n')

    await page.close()
    await context.close()
    await browser.close()

    writeGitHubSummary(true, null)
    process.exit(0)
  } catch (err) {
    await failStep(err)
  }
}

main()
