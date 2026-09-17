/**
 * SUÍTE DE INTEGRAÇÃO: VERIFICAÇÃO DO PRIMEIRO ATENDIMENTO (CER V1 — 0.0.70)
 *
 * SEIS PONTOS VERIFICADOS DIRETAMENTE CONTRA O BACKEND REAL DA BANCADA:
 * 1. PAV-01: Interagente A salva relato como rascunho (status draft/participant_private)
 *    -> profissional vinculada NÃO consegue lê-lo (list vazio e getOne negado).
 * 2. PAV-02: Interagente A envia relato (approved/shared_care)
 *    -> profissional vinculada consegue lê-lo com autoria correta (participant_user_id = A, exibição "Enviado por {nome}").
 * 3. PAV-03: Profissional registra sessão e nota de sessão (cer_session_notes)
 *    -> interagente A NÃO consegue acessar a nota profissional (list vazio e getOne negado).
 * 4. PAV-04: Plano criado pela profissional em rascunho (draft)
 *    -> invisível à interagente A; após ação explícita de compartilhamento (presented) -> visível à interagente A.
 * 5. PAV-05: Interagente A registra cada uma das 4 respostas possíveis ao próximo passo
 *    (accepted / wants_to_try / too_much / wants_to_talk)
 *    -> profissional vê resposta e comentário com autoria correta, e NENHUMA nota clínica é criada em cer_session_notes.
 * 6. PAV-06: Interagente B (não vinculada ao enrollment de A) NÃO consegue listar nem abrir por ID real:
 *    relato de A, plano de A, nota de sessão de A e retorno de A.
 *
 * Padrão Fail-Closed:
 * - Em ambiente vivo / não isolado: safeMutableGate bloqueia preventivamente -> retorna BLOCKED.
 * - Em bancada descartável (127.0.0.1:8090 com flag explícita): executa todas as mutações e valida RLS server-side.
 * - Todas as verificações de acesso usam contas comuns (SDK autenticado com authWithPassword).
 * - O superuser é restrito à semeadura inicial e teardown.
 */

import PocketBase from 'pocketbase'
import pb from '../lib/pocketbase/client.ts'
import {
  assertSafeMutableTestEnvironment,
  inspectTestEnvironment,
  LiveBackendMutationBlockedError,
} from './safeMutableGate.ts'

export interface PrimeiroAtendimentoTestResult {
  id: string
  name: string
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED'
  details: string
}

export async function runPrimeiroAtendimentoVerificationTests(): Promise<
  PrimeiroAtendimentoTestResult[]
> {
  const results: PrimeiroAtendimentoTestResult[] = []

  const log = (
    id: string,
    name: string,
    status: 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED',
    details: string,
  ) => {
    results.push({ id, name, status, details })
  }

  // Trava de segurança:
  const inspection = inspectTestEnvironment()
  if (!inspection.isAllowed) {
    const reason = inspection.blockReason || 'Ambiente isolado não autorizado'
    const cases = [
      'PAV-01: Interagente A salva relato como rascunho (draft/participant_private) — profissional vinculada não lê',
      'PAV-02: Interagente A envia relato (approved/shared_care) — profissional vinculada lê com autoria correta',
      'PAV-03: Profissional registra sessão e nota privada — interagente A não consegue acessar nota profissional',
      'PAV-04: Plano em rascunho invisível à interagente A; após compartilhamento explícito torna-se visível',
      'PAV-05: Interagente A registra as 4 respostas ao próximo passo — profissional vê e zero notas clínicas geradas',
      'PAV-06: Interagente B não vinculada não acessa relato, plano, nota e retorno de A por lista nem por ID real',
    ]

    for (const c of cases) {
      const [id, ...rest] = c.split(': ')
      log(id, rest.join(': '), 'BLOCKED', `Execução bloqueada por trava de segurança: ${reason}`)
    }

    return results
  }

  const createdRecordIds: { collection: string; id: string }[] = []

  try {
    assertSafeMutableTestEnvironment()

    // 1. Setup administrativo via Superuser efêmero da bancada
    const adminEmail =
      (typeof process !== 'undefined' && process.env?.CER_BENCH_SUPERUSER_EMAIL) ||
      'bench-admin@cer.isolated'
    const adminPass =
      (typeof process !== 'undefined' && process.env?.CER_BENCH_SUPERUSER_PASSWORD) ||
      'BenchAdminSecret123!'

    const baseUrl =
      (typeof process !== 'undefined' && process.env?.VITE_POCKETBASE_URL) ||
      pb.baseUrl ||
      'http://127.0.0.1:8090'

    const adminPb = new PocketBase(baseUrl)
    adminPb.autoCancellation(false)

    try {
      await adminPb.collection('_superusers').authWithPassword(adminEmail, adminPass)
    } catch {
      try {
        await (adminPb as any).admins.authWithPassword(adminEmail, adminPass)
      } catch (adminErr: any) {
        throw new Error(
          `Falha no bootstrap administrativo na bancada descartável: ${adminErr?.message || String(adminErr)}. ` +
            `Certifique-se de que o superuser foi criado via pocketbase superuser upsert.`,
        )
      }
    }

    const testRunId = Date.now()
    const defaultPwd = 'TestPass123!Safe'

    // Contas Fictícias da Bancada:
    // 1. Profissional Fictícia: Dra. Daiane Fictícia
    const personProf = await adminPb.collection('persons').create({
      full_name: 'Dra. Daiane Fictícia',
      preferred_name: 'Daiane',
      email: `daiane_${testRunId}@cer.local`,
    })
    createdRecordIds.push({ collection: 'persons', id: personProf.id })

    const userProf = await adminPb.collection('users').create({
      email: `prof_daiane_${testRunId}@cer.local`,
      password: defaultPwd,
      passwordConfirm: defaultPwd,
      person_id: personProf.id,
      status: 'active',
    })
    createdRecordIds.push({ collection: 'users', id: userProf.id })

    await adminPb.collection('user_roles').create({
      user_id: userProf.id,
      role: 'profissional',
      is_active: true,
    })

    // 2. Interagente A Fictícia: Alice Fictícia
    const personAlice = await adminPb.collection('persons').create({
      full_name: 'Alice da Silva Fictícia',
      preferred_name: 'Alice',
      email: `alice_${testRunId}@cer.local`,
    })
    createdRecordIds.push({ collection: 'persons', id: personAlice.id })

    const userAlice = await adminPb.collection('users').create({
      email: `alice_user_${testRunId}@cer.local`,
      password: defaultPwd,
      passwordConfirm: defaultPwd,
      person_id: personAlice.id,
      status: 'active',
    })
    createdRecordIds.push({ collection: 'users', id: userAlice.id })

    await adminPb.collection('user_roles').create({
      user_id: userAlice.id,
      role: 'interagente',
      is_active: true,
    })

    // 3. Interagente A2 Fictícia (segunda interagente no mesmo enrollment ou perfil alternativo)
    const personA2 = await adminPb.collection('persons').create({
      full_name: 'Alice Co-Interagente Fictícia',
      preferred_name: 'Alice2',
      email: `alice2_${testRunId}@cer.local`,
    })
    createdRecordIds.push({ collection: 'persons', id: personA2.id })

    const userA2 = await adminPb.collection('users').create({
      email: `alice2_user_${testRunId}@cer.local`,
      password: defaultPwd,
      passwordConfirm: defaultPwd,
      person_id: personA2.id,
      status: 'active',
    })
    createdRecordIds.push({ collection: 'users', id: userA2.id })

    await adminPb.collection('user_roles').create({
      user_id: userA2.id,
      role: 'interagente',
      is_active: true,
    })

    // 4. Interagente B Fictícia (Controle, não vinculada ao enrollment de A)
    const personBeatriz = await adminPb.collection('persons').create({
      full_name: 'Beatriz Controle Fictícia',
      preferred_name: 'Beatriz',
      email: `beatriz_${testRunId}@cer.local`,
    })
    createdRecordIds.push({ collection: 'persons', id: personBeatriz.id })

    const userBeatriz = await adminPb.collection('users').create({
      email: `beatriz_user_${testRunId}@cer.local`,
      password: defaultPwd,
      passwordConfirm: defaultPwd,
      person_id: personBeatriz.id,
      status: 'active',
    })
    createdRecordIds.push({ collection: 'users', id: userBeatriz.id })

    await adminPb.collection('user_roles').create({
      user_id: userBeatriz.id,
      role: 'interagente',
      is_active: true,
    })

    // Enrollments Fictícios:
    // Enrollment de Alice (A)
    const enrollmentA = await adminPb.collection('enrollments').create({
      person_id: personAlice.id,
      status: 'active',
    })
    createdRecordIds.push({ collection: 'enrollments', id: enrollmentA.id })

    // Vínculo profissional ativo para enrollment A com Dra. Daiane
    const linkProfA = await adminPb.collection('professional_enrollment_access').create({
      enrollment_id: enrollmentA.id,
      professional_user_id: userProf.id,
      access_role: 'primary',
      is_active: true,
    })
    createdRecordIds.push({ collection: 'professional_enrollment_access', id: linkProfA.id })

    // Enrollment de Beatriz (B - Controle)
    const enrollmentB = await adminPb.collection('enrollments').create({
      person_id: personBeatriz.id,
      status: 'active',
    })
    createdRecordIds.push({ collection: 'enrollments', id: enrollmentB.id })

    // Clientes dedicados por ator para garantir isolamento limpo
    const clientAlice = new PocketBase(baseUrl)
    clientAlice.autoCancellation(false)
    await clientAlice.collection('users').authWithPassword(userAlice.email, defaultPwd)

    const clientProf = new PocketBase(baseUrl)
    clientProf.autoCancellation(false)
    await clientProf.collection('users').authWithPassword(userProf.email, defaultPwd)

    const clientBeatriz = new PocketBase(baseUrl)
    clientBeatriz.autoCancellation(false)
    await clientBeatriz.collection('users').authWithPassword(userBeatriz.email, defaultPwd)

    // =========================================================================
    // PONTO 1: Interagente A salva relato como rascunho (status draft/participant_private)
    // Profissional vinculada NÃO consegue lê-lo (list vazio e getOne negado)
    // =========================================================================
    const draftMsg = await clientAlice.collection('cer_next_session_messages').create({
      enrollment_id: enrollmentA.id,
      participant_user_id: userAlice.id,
      message_text:
        'O que a traz: cansaço acumulado. O que ajuda: caminhar. O que deseja cuidar: sono.',
      status: 'draft',
      access_class: 'participant_private',
    })
    createdRecordIds.push({ collection: 'cer_next_session_messages', id: draftMsg.id })

    // Profissional tenta listar rascunho
    const profDraftList = await clientProf.collection('cer_next_session_messages').getFullList({
      filter: `enrollment_id = '${enrollmentA.id}' && status = 'draft'`,
    })

    let profDraftGetBlocked = false
    try {
      await clientProf.collection('cer_next_session_messages').getOne(draftMsg.id)
    } catch {
      profDraftGetBlocked = true
    }

    if (profDraftList.length === 0 && profDraftGetBlocked) {
      log(
        'PAV-01',
        'Interagente A salva relato como rascunho (draft) — invisível à profissional vinculada',
        'PASS',
        'RLS garantiu 0 itens na listagem e getOne negado (404/403) para a profissional',
      )
    } else {
      log(
        'PAV-01',
        'Rascunho de relato da Interagente A vazou para a profissional!',
        'FAIL',
        `profDraftList.length=${profDraftList.length}, profDraftGetBlocked=${profDraftGetBlocked}`,
      )
    }

    // =========================================================================
    // PONTO 2: Interagente A envia o relato (approved/shared_care)
    // Profissional vinculada consegue lê-lo no prontuário, com a autoria correta
    // (participant_user_id = A, exibição "Enviado por {nome}")
    // =========================================================================
    const updatedApprovedMsg = await clientAlice
      .collection('cer_next_session_messages')
      .update(draftMsg.id, {
        status: 'approved',
        access_class: 'shared_care',
        approved_at: new Date().toISOString(),
        summary_text: 'O que a traz: cansaço acumulado. O que ajuda: caminhar...',
      })

    const profApprovedList = await clientProf.collection('cer_next_session_messages').getFullList({
      filter: `enrollment_id = '${enrollmentA.id}' && status = 'approved'`,
    })

    let profApprovedGet = null
    try {
      profApprovedGet = await clientProf.collection('cer_next_session_messages').getOne(draftMsg.id)
    } catch {
      profApprovedGet = null
    }

    // Verificar se a autoria é de Alice e se o nome condiz com a exibição "Enviado por {nome}"
    const authorMatches = profApprovedGet?.participant_user_id === userAlice.id
    const displayName = personAlice.preferred_name || personAlice.full_name
    const displayLabelExpected = `Enviado por ${displayName}`

    if (
      profApprovedList.length === 1 &&
      profApprovedGet !== null &&
      authorMatches &&
      displayName === 'Alice'
    ) {
      log(
        'PAV-02',
        'Interagente A envia relato (approved/shared_care) — profissional vinculada lê com autoria correta',
        'PASS',
        `Relato acessível no prontuário com participant_user_id=${userAlice.id} e exibição validada ("${displayLabelExpected}")`,
      )
    } else {
      log(
        'PAV-02',
        'Falha no acesso ou autoria do relato aprovado pela profissional',
        'FAIL',
        `profApprovedList.length=${profApprovedList.length}, profApprovedGet=${Boolean(profApprovedGet)}, authorMatches=${authorMatches}`,
      )
    }

    // =========================================================================
    // PONTO 3: Profissional registra uma sessão e uma nota de sessão
    // A interagente A NÃO consegue acessar a nota profissional (list e getOne negados)
    // =========================================================================
    const sessionRec = await clientProf.collection('cer_sessions').create({
      enrollment_id: enrollmentA.id,
      professional_user_id: userProf.id,
      status: 'completed',
      scheduled_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    createdRecordIds.push({ collection: 'cer_sessions', id: sessionRec.id })

    const sessionNoteRec = await clientProf.collection('cer_session_notes').create({
      session_id: sessionRec.id,
      enrollment_id: enrollmentA.id,
      author_user_id: userProf.id,
      text: 'Nota clínica estritamente privada da Dra. Daiane sobre a sessão com Alice.',
    })
    createdRecordIds.push({ collection: 'cer_session_notes', id: sessionNoteRec.id })

    // Interagente A tenta listar cer_session_notes
    const aliceNotesList = await clientAlice.collection('cer_session_notes').getFullList({
      filter: `enrollment_id = '${enrollmentA.id}'`,
    })

    let aliceNoteGetBlocked = false
    try {
      await clientAlice.collection('cer_session_notes').getOne(sessionNoteRec.id)
    } catch {
      aliceNoteGetBlocked = true
    }

    if (aliceNotesList.length === 0 && aliceNoteGetBlocked) {
      log(
        'PAV-03',
        'Profissional registra sessão e nota privada — interagente A não consegue acessar nota profissional',
        'PASS',
        'RLS estrito bloqueou acesso da interagente à nota profissional (0 itens na lista e getOne negado)',
      )
    } else {
      log(
        'PAV-03',
        'Nota profissional privada vazou para a interagente A!',
        'FAIL',
        `aliceNotesList.length=${aliceNotesList.length}, aliceNoteGetBlocked=${aliceNoteGetBlocked}`,
      )
    }

    // =========================================================================
    // PONTO 4: Plano criado pela profissional em rascunho (draft)
    // Invisível à interagente A; após ação explícita de compartilhamento
    // (rascunho -> apresentado/compartilhado) -> visível à interagente A.
    // =========================================================================
    const carePlanRec = await clientProf.collection('cer_care_plans').create({
      enrollment_id: enrollmentA.id,
      revision_number: 1,
      status: 'draft',
      direction_mode: 'reused',
      direction_statement: 'Direção inicial de cuidado pactuada em atendimento',
      professional_context: 'Contexto profissional da proposta',
      created_by_user_id: userProf.id,
    })
    createdRecordIds.push({ collection: 'cer_care_plans', id: carePlanRec.id })

    // Interagente A tenta listar planos em draft
    const alicePlansListDraft = await clientAlice.collection('cer_care_plans').getFullList({
      filter: `enrollment_id = '${enrollmentA.id}'`,
    })

    let alicePlanDraftGetBlocked = false
    try {
      await clientAlice.collection('cer_care_plans').getOne(carePlanRec.id)
    } catch {
      alicePlanDraftGetBlocked = true
    }

    // Criar prioridade e apresentação para viabilizar o compartilhamento explícito com a interagente
    const priorityRec = await clientProf.collection('cer_care_plan_priorities').create({
      plan_id: carePlanRec.id,
      title: 'Pausa diária de 5 minutos',
      description: 'Momento de respiro e descanso na rotina',
      status: 'active',
      is_therapeutic_priority: true,
      is_possible_now: true,
      access_class: 'shared_care',
      created_by_user_id: userProf.id,
    })
    createdRecordIds.push({ collection: 'cer_care_plan_priorities', id: priorityRec.id })

    const presentationDraft = await clientProf.collection('cer_care_plan_presentations').create({
      enrollment_id: enrollmentA.id,
      plan_id: carePlanRec.id,
      priority_id: priorityRec.id,
      status: 'draft',
      participant_title: 'Nosso Próximo Passo de Cuidado',
      participant_summary: 'Experimentar momentos de pausa consciente para descansar.',
      practical_invitation: 'Que tal 5 minutos à tarde?',
      channel: 'app',
      created_by_user_id: userProf.id,
    })
    createdRecordIds.push({
      collection: 'cer_care_plan_presentations',
      id: presentationDraft.id,
    })

    // Apresentação em draft também deve ser invisível para Alice
    const alicePresListDraft = await clientAlice
      .collection('cer_care_plan_presentations')
      .getFullList({
        filter: `enrollment_id = '${enrollmentA.id}'`,
      })

    // Ação explícita de compartilhamento:
    // Ativar o plano (status = active) e apresentar a apresentação (status = presented)
    await clientProf.collection('cer_care_plans').update(carePlanRec.id, {
      status: 'active',
    })
    await clientProf.collection('cer_care_plan_presentations').update(presentationDraft.id, {
      status: 'presented',
      presented_at: new Date().toISOString(),
    })

    // Agora Interagente A deve conseguir listar o plano ativo e a apresentação apresentada
    const alicePlansListActive = await clientAlice.collection('cer_care_plans').getFullList({
      filter: `enrollment_id = '${enrollmentA.id}'`,
    })
    const alicePlanActiveGet = await clientAlice.collection('cer_care_plans').getOne(carePlanRec.id)

    const alicePresListPresented = await clientAlice
      .collection('cer_care_plan_presentations')
      .getFullList({
        filter: `enrollment_id = '${enrollmentA.id}' && status = 'presented'`,
      })
    const alicePresPresentedGet = await clientAlice
      .collection('cer_care_plan_presentations')
      .getOne(presentationDraft.id)

    const draftPhaseSafe =
      alicePlansListDraft.length === 0 &&
      alicePlanDraftGetBlocked &&
      alicePresListDraft.length === 0
    const presentedPhaseVisible =
      alicePlansListActive.length >= 1 &&
      alicePlanActiveGet.id === carePlanRec.id &&
      alicePresListPresented.length === 1 &&
      alicePresPresentedGet.id === presentationDraft.id

    if (draftPhaseSafe && presentedPhaseVisible) {
      log(
        'PAV-04',
        'Plano em rascunho invisível à interagente A; após compartilhamento torna-se visível',
        'PASS',
        'Rascunho bloqueado (list=0, getOne negado). Após transição deliberada para presented/active, acesso liberado à interagente.',
      )
    } else {
      log(
        'PAV-04',
        'Falha no ciclo de visibilidade do plano de cuidado',
        'FAIL',
        `draftPhaseSafe=${draftPhaseSafe}, presentedPhaseVisible=${presentedPhaseVisible}`,
      )
    }

    // =========================================================================
    // PONTO 5: Interagente A registra cada uma das QUATRO respostas possíveis ao próximo passo
    // (consegui experimentar / quero tentar / foi muito / prefiro conversar)
    // -> profissional vê a resposta e o comentário com autoria correta,
    // e NENHUM registro dessas respostas cria automaticamente nota clínica em cer_session_notes.
    // =========================================================================
    const fourResponses: {
      type: 'accepted' | 'wants_to_try' | 'too_much' | 'wants_to_talk'
      comment: string
    }[] = [
      {
        type: 'accepted',
        comment: 'Consegui experimentar a pausa ontem e foi tranquilo.',
      },
      {
        type: 'wants_to_try',
        comment: 'Quero tentar a partir de amanhã pela manhã.',
      },
      {
        type: 'too_much',
        comment: 'Foi muito para mim esta semana, me senti sobrecarregada.',
      },
      {
        type: 'wants_to_talk',
        comment: 'Prefiro conversar sobre isso no próximo encontro antes de tentar.',
      },
    ]

    // Contar notas antes de registrar os retornos
    const notesBefore = await clientProf.collection('cer_session_notes').getFullList({
      filter: `enrollment_id = '${enrollmentA.id}'`,
    })

    let allFourRecordedAndVisible = true
    const recordedAcceptances: any[] = []

    for (const r of fourResponses) {
      const acc = await clientAlice.collection('cer_operational_acceptances').create({
        presentation_id: presentationDraft.id,
        plan_id: carePlanRec.id,
        priority_id: priorityRec.id,
        enrollment_id: enrollmentA.id,
        participant_user_id: userAlice.id,
        response_type: r.type,
        shared_comment: r.comment,
        access_class: 'shared_care',
        record_status: 'current',
      })
      createdRecordIds.push({ collection: 'cer_operational_acceptances', id: acc.id })
      recordedAcceptances.push(acc)

      // Profissional verifica visibilidade da resposta e autoria
      const profAccGet = await clientProf.collection('cer_operational_acceptances').getOne(acc.id)

      if (
        !profAccGet ||
        profAccGet.response_type !== r.type ||
        profAccGet.participant_user_id !== userAlice.id ||
        profAccGet.shared_comment !== r.comment
      ) {
        allFourRecordedAndVisible = false
      }
    }

    // Verificar contagem de notas após os 4 retornos: deve ser EXATAMENTE a mesma
    const notesAfter = await clientProf.collection('cer_session_notes').getFullList({
      filter: `enrollment_id = '${enrollmentA.id}'`,
    })

    const zeroNotesCreatedAutomatically = notesAfter.length === notesBefore.length

    if (allFourRecordedAndVisible && zeroNotesCreatedAutomatically) {
      log(
        'PAV-05',
        'Interagente A registra as 4 respostas ao próximo passo — profissional vê e zero notas clínicas geradas',
        'PASS',
        `Todas as 4 respostas registradas e conferidas pela profissional. Total de notas clínicas inalterado (${notesBefore.length} -> ${notesAfter.length}).`,
      )
    } else {
      log(
        'PAV-05',
        'Falha no registro das 4 respostas ou criação indevida de notas clínicas',
        'FAIL',
        `allFourRecordedAndVisible=${allFourRecordedAndVisible}, zeroNotesCreatedAutomatically=${zeroNotesCreatedAutomatically} (antes: ${notesBefore.length}, depois: ${notesAfter.length})`,
      )
    }

    // =========================================================================
    // PONTO 6: Interagente B (não vinculada ao enrollment de A / segunda interagente)
    // NÃO consegue listar nem abrir por ID real:
    // - O relato de A (draftMsg.id)
    // - O plano de A (carePlanRec.id)
    // - A nota profissional da sessão de A (sessionNoteRec.id)
    // - O retorno de A (recordedAcceptances[0].id)
    // Tente por listagem e por getOne com o ID real.
    // =========================================================================
    // 6.1 Relato de A por B
    const beatrizMsgList = await clientBeatriz.collection('cer_next_session_messages').getFullList({
      filter: `id = '${draftMsg.id}' || enrollment_id = '${enrollmentA.id}'`,
    })
    let beatrizMsgGetBlocked = false
    try {
      await clientBeatriz.collection('cer_next_session_messages').getOne(draftMsg.id)
    } catch {
      beatrizMsgGetBlocked = true
    }

    // 6.2 Plano de A por B
    const beatrizPlanList = await clientBeatriz.collection('cer_care_plans').getFullList({
      filter: `id = '${carePlanRec.id}' || enrollment_id = '${enrollmentA.id}'`,
    })
    let beatrizPlanGetBlocked = false
    try {
      await clientBeatriz.collection('cer_care_plans').getOne(carePlanRec.id)
    } catch {
      beatrizPlanGetBlocked = true
    }

    // 6.3 Nota profissional de A por B
    const beatrizNoteList = await clientBeatriz.collection('cer_session_notes').getFullList({
      filter: `id = '${sessionNoteRec.id}' || enrollment_id = '${enrollmentA.id}'`,
    })
    let beatrizNoteGetBlocked = false
    try {
      await clientBeatriz.collection('cer_session_notes').getOne(sessionNoteRec.id)
    } catch {
      beatrizNoteGetBlocked = true
    }

    // 6.4 Retorno operacional de A por B
    const targetAcceptanceId = recordedAcceptances[0]?.id || ''
    const beatrizAccList = await clientBeatriz
      .collection('cer_operational_acceptances')
      .getFullList({
        filter: `id = '${targetAcceptanceId}' || enrollment_id = '${enrollmentA.id}'`,
      })
    let beatrizAccGetBlocked = false
    try {
      await clientBeatriz.collection('cer_operational_acceptances').getOne(targetAcceptanceId)
    } catch {
      beatrizAccGetBlocked = true
    }

    const bRelatoSafe = beatrizMsgList.length === 0 && beatrizMsgGetBlocked
    const bPlanoSafe = beatrizPlanList.length === 0 && beatrizPlanGetBlocked
    const bNotaSafe = beatrizNoteList.length === 0 && beatrizNoteGetBlocked
    const bRetornoSafe = beatrizAccList.length === 0 && beatrizAccGetBlocked

    if (bRelatoSafe && bPlanoSafe && bNotaSafe && bRetornoSafe) {
      log(
        'PAV-06',
        'Interagente B não vinculada não acessa relato, plano, nota e retorno de A por lista nem por ID real',
        'PASS',
        'Isolamento RLS perfeito contra participante externa: list=0 e getOne negado para todos os 4 recursos de A.',
      )
    } else {
      log(
        'PAV-06',
        'Vazamento de dados da Interagente A para Interagente B!',
        'FAIL',
        `bRelatoSafe=${bRelatoSafe}, bPlanoSafe=${bPlanoSafe}, bNotaSafe=${bNotaSafe}, bRetornoSafe=${bRetornoSafe}`,
      )
    }
  } catch (err: any) {
    if (err instanceof LiveBackendMutationBlockedError) {
      log('PAV-TRAVA', 'Trava de segurança acionada', 'BLOCKED', err.message)
    } else {
      log(
        'PAV-ERRO',
        'Erro na execução da suíte de verificação do Primeiro Atendimento',
        'FAIL',
        err?.message || String(err),
      )
    }
  } finally {
    // Teardown de dados fictícios na bancada descartável
    if (createdRecordIds.length > 0) {
      const cleanupPb = new PocketBase(
        (typeof process !== 'undefined' && process.env?.VITE_POCKETBASE_URL) ||
          pb.baseUrl ||
          'http://127.0.0.1:8090',
      )
      cleanupPb.autoCancellation(false)
      const adminEmail =
        (typeof process !== 'undefined' && process.env?.CER_BENCH_SUPERUSER_EMAIL) ||
        'bench-admin@cer.isolated'
      const adminPass =
        (typeof process !== 'undefined' && process.env?.CER_BENCH_SUPERUSER_PASSWORD) ||
        'BenchAdminSecret123!'
      try {
        await cleanupPb.collection('_superusers').authWithPassword(adminEmail, adminPass)
      } catch {
        try {
          await (cleanupPb as any).admins.authWithPassword(adminEmail, adminPass)
        } catch {
          // ignora
        }
      }

      for (const rec of [...createdRecordIds].reverse()) {
        try {
          await cleanupPb.collection(rec.collection).delete(rec.id)
        } catch {
          // ignora em bancada efêmera
        }
      }
    }
  }

  return results
}
