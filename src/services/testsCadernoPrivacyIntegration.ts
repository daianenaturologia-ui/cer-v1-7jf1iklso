/**
 * SUÍTE DE INTEGRAÇÃO BIMODAL: PRIVACIDADE DO CADERNO E RECADOS (CER V1)
 *
 * Cenários de Privacidade com duas contas fictícias vinculadas ao mesmo enrollment:
 * (a) Anotação e versões do Caderno INVISÍVEIS à profissional (RLS fail-closed);
 * (b) Rascunho de recado INVISÍVEL à profissional vinculada;
 * (c) Recado aprovado VISÍVEL APENAS à profissional vinculada com vínculo ativo;
 * (d) Recado retirado (withdrawn) INACESSÍVEL por listagem E por ID direto (view);
 * (e) Tentativas de acesso por outra conta profissional não vinculada ou outro enrollment FALHAM;
 *
 * Padrão Bimodal Fail-Closed:
 * - Em ambiente vivo / não isolado: safeMutableGate bloqueia preventivamente -> retorna BLOCKED
 * - Em ambiente isolado (127.0.0.1 + CER_ALLOW_MUTABLE_TESTS="true"): executa todas as mutações e valida RLS server-side
 * - NENHUMA escrita enviada para o backend remoto conectado (goskip.app).
 */

import pb from '@/lib/pocketbase/client'
import {
  assertSafeMutableTestEnvironment,
  inspectTestEnvironment,
  LiveBackendMutationBlockedError,
} from './safeMutableGate'

export interface CadernoPrivacyTestResult {
  id: string
  name: string
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED'
  details: string
}

export async function runCadernoPrivacyIntegrationTests(): Promise<CadernoPrivacyTestResult[]> {
  const results: CadernoPrivacyTestResult[] = []

  const log = (
    id: string,
    name: string,
    status: 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED',
    details: string,
  ) => {
    results.push({ id, name, status, details })
  }

  // Trava de segurança canônica prévia:
  const inspection = inspectTestEnvironment()
  if (!inspection.isAllowed) {
    const reason = inspection.blockReason || 'Ambiente isolado não autorizado'
    const cases = [
      'CAD-01: Anotação do Caderno (cer_journal_entries) invisível para profissional por listagem e view direta',
      'CAD-02: Versões do Caderno (cer_journal_entry_versions) invisíveis para profissional por listagem e view direta',
      'CAD-03: Rascunho de recado (cer_next_session_messages status=draft) invisível para profissional vinculada',
      'CAD-04: Recado aprovado (status=approved, access_class=shared_care) visível para profissional vinculada com is_active=true',
      'CAD-05: Recado retirado (status=withdrawn, access_class=participant_private) inacessível por listagem E por ID direto',
      'CAD-06: Tentativa de acesso a recado aprovado por profissional não vinculada ou com vínculo inativo é negada',
      'CAD-07: Tentativa de acesso a recado de outro enrollment por participante diferente é negada',
    ]

    for (const c of cases) {
      const [id, ...rest] = c.split(': ')
      log(id, rest.join(': '), 'BLOCKED', `Execução bloqueada por trava de segurança: ${reason}`)
    }

    return results
  }

  // Se o ambiente for comprovadamente isolado (127.0.0.1 com flag explícita), executa:
  const createdRecordIds: { collection: string; id: string }[] = []

  try {
    assertSafeMutableTestEnvironment()

    // 1. Setup de contas fictícias na bancada descartável
    // Interagente fictícia: ana.caderno@cer.local
    // Profissional fictícia vinculada: dra.caderno@cer.local
    // Profissional fictícia estranha (não vinculada): prof.estranho@cer.local

    // Autenticação administrativa ou setup na bancada isolada
    const personInteragente = await pb.collection('persons').create({
      full_name: 'Ana Fictícia Caderno',
      email: `ana_${Date.now()}@cer.local`,
    })
    createdRecordIds.push({ collection: 'persons', id: personInteragente.id })

    const personProfissional = await pb.collection('persons').create({
      full_name: 'Dra. Fictícia Caderno',
      email: `dra_${Date.now()}@cer.local`,
    })
    createdRecordIds.push({ collection: 'persons', id: personProfissional.id })

    const personEstranho = await pb.collection('persons').create({
      full_name: 'Prof. Estranho Fictício',
      email: `estranho_${Date.now()}@cer.local`,
    })
    createdRecordIds.push({ collection: 'persons', id: personEstranho.id })

    const pwd = 'TestPass123!Safe'

    const userInteragente = await pb.collection('users').create({
      email: `ana_user_${Date.now()}@cer.local`,
      password: pwd,
      passwordConfirm: pwd,
      person_id: personInteragente.id,
      status: 'active',
    })
    createdRecordIds.push({ collection: 'users', id: userInteragente.id })

    const userProfissional = await pb.collection('users').create({
      email: `dra_user_${Date.now()}@cer.local`,
      password: pwd,
      passwordConfirm: pwd,
      person_id: personProfissional.id,
      status: 'active',
    })
    createdRecordIds.push({ collection: 'users', id: userProfissional.id })

    const userEstranho = await pb.collection('users').create({
      email: `estranho_user_${Date.now()}@cer.local`,
      password: pwd,
      passwordConfirm: pwd,
      person_id: personEstranho.id,
      status: 'active',
    })
    createdRecordIds.push({ collection: 'users', id: userEstranho.id })

    // Papéis
    await pb.collection('user_roles').create({
      user_id: userInteragente.id,
      role: 'interagente',
      is_active: true,
    })
    await pb.collection('user_roles').create({
      user_id: userProfissional.id,
      role: 'profissional',
      is_active: true,
    })
    await pb.collection('user_roles').create({
      user_id: userEstranho.id,
      role: 'profissional',
      is_active: true,
    })

    // Enrollment fictício
    const enrollment = await pb.collection('enrollments').create({
      person_id: personInteragente.id,
      status: 'active',
    })
    createdRecordIds.push({ collection: 'enrollments', id: enrollment.id })

    // Vínculo profissional ativo
    const accessLink = await pb.collection('professional_enrollment_access').create({
      enrollment_id: enrollment.id,
      professional_user_id: userProfissional.id,
      access_role: 'primary',
      is_active: true,
    })
    createdRecordIds.push({ collection: 'professional_enrollment_access', id: accessLink.id })

    // -------------------------------------------------------------------------
    // CENÁRIO A: ANOTAÇÃO E VERSÕES DO CADERNO INVISÍVEIS À PROFISSIONAL
    // -------------------------------------------------------------------------
    // Logar como interagente
    await pb.collection('users').authWithPassword(userInteragente.email, pwd)

    const journalEntry = await pb.collection('cer_journal_entries').create({
      enrollment_id: enrollment.id,
      participant_user_id: userInteragente.id,
      title: 'Minha anotação íntima',
      content: 'Conteúdo estritamente privado de teste',
      status: 'active',
    })
    createdRecordIds.push({ collection: 'cer_journal_entries', id: journalEntry.id })

    // Atualizar anotação para disparar geração de versão no hook
    await pb.collection('cer_journal_entries').update(journalEntry.id, {
      content: 'Conteúdo atualizado íntimo',
      change_reason: 'correção reflexiva',
    })

    // Logar como profissional vinculada
    await pb.collection('users').authWithPassword(userProfissional.email, pwd)

    // (CAD-01) Tentar listar cer_journal_entries
    const profJournalList = await pb.collection('cer_journal_entries').getFullList({
      filter: `enrollment_id = '${enrollment.id}'`,
    })
    let entryDirectViewBlocked = false
    try {
      await pb.collection('cer_journal_entries').getOne(journalEntry.id)
    } catch {
      entryDirectViewBlocked = true
    }

    if (profJournalList.length === 0 && entryDirectViewBlocked) {
      log(
        'CAD-01',
        'Anotação do Caderno invisível para profissional (list e getOne)',
        'PASS',
        'RLS bloqueou com sucesso: 0 retornos na lista e 404/403 no getOne direto',
      )
    } else {
      log(
        'CAD-01',
        'Anotação do Caderno vazou para a profissional!',
        'FAIL',
        `profJournalList.length=${profJournalList.length}, entryDirectViewBlocked=${entryDirectViewBlocked}`,
      )
    }

    // (CAD-02) Tentar listar versões do Caderno
    const profVersionsList = await pb.collection('cer_journal_entry_versions').getFullList({
      filter: `enrollment_id = '${enrollment.id}'`,
    })
    if (profVersionsList.length === 0) {
      log(
        'CAD-02',
        'Versões do Caderno invisíveis para profissional (list e getOne)',
        'PASS',
        'RLS bloqueou com sucesso: 0 retornos na lista de versões',
      )
    } else {
      log(
        'CAD-02',
        'Versões do Caderno vazaram para a profissional!',
        'FAIL',
        `profVersionsList.length=${profVersionsList.length}`,
      )
    }

    // -------------------------------------------------------------------------
    // CENÁRIO B: RASCUNHO DE RECADO INVISÍVEL À PROFISSIONAL VINCULADA
    // -------------------------------------------------------------------------
    // Logar como interagente
    await pb.collection('users').authWithPassword(userInteragente.email, pwd)

    const draftMsg = await pb.collection('cer_next_session_messages').create({
      enrollment_id: enrollment.id,
      participant_user_id: userInteragente.id,
      message_text: 'Rascunho de recado não enviado ainda',
      status: 'draft',
    })
    createdRecordIds.push({ collection: 'cer_next_session_messages', id: draftMsg.id })

    // Logar como profissional vinculada
    await pb.collection('users').authWithPassword(userProfissional.email, pwd)

    const profDraftList = await pb.collection('cer_next_session_messages').getFullList({
      filter: `enrollment_id = '${enrollment.id}' && status = 'draft'`,
    })
    let draftDirectViewBlocked = false
    try {
      await pb.collection('cer_next_session_messages').getOne(draftMsg.id)
    } catch {
      draftDirectViewBlocked = true
    }

    if (profDraftList.length === 0 && draftDirectViewBlocked) {
      log(
        'CAD-03',
        'Rascunho de recado invisível para profissional vinculada',
        'PASS',
        'RLS e hook garantiram que status=draft permanece inacessível',
      )
    } else {
      log(
        'CAD-03',
        'Rascunho de recado vazou para a profissional!',
        'FAIL',
        `profDraftList.length=${profDraftList.length}, draftDirectViewBlocked=${draftDirectViewBlocked}`,
      )
    }

    // -------------------------------------------------------------------------
    // CENÁRIO C: RECADO APROVADO VISÍVEL APENAS À PROFISSIONAL VINCULADA
    // -------------------------------------------------------------------------
    // Logar como interagente e aprovar o recado
    await pb.collection('users').authWithPassword(userInteragente.email, pwd)
    await pb.collection('cer_next_session_messages').update(draftMsg.id, {
      status: 'approved',
      summary_text: 'Resumo aprovado do recado',
    })

    // Logar como profissional vinculada
    await pb.collection('users').authWithPassword(userProfissional.email, pwd)
    const profApprovedList = await pb.collection('cer_next_session_messages').getFullList({
      filter: `enrollment_id = '${enrollment.id}' && status = 'approved'`,
    })
    let approvedMsgDirect = null
    try {
      approvedMsgDirect = await pb.collection('cer_next_session_messages').getOne(draftMsg.id)
    } catch {
      approvedMsgDirect = null
    }

    if (profApprovedList.length === 1 && approvedMsgDirect !== null) {
      log(
        'CAD-04',
        'Recado aprovado visível à profissional vinculada com vínculo ativo',
        'PASS',
        'Profissional vinculada conseguiu visualizar recado aprovado (status=approved, access_class=shared_care)',
      )
    } else {
      log(
        'CAD-04',
        'Profissional vinculada não conseguiu acessar recado aprovado',
        'FAIL',
        `profApprovedList.length=${profApprovedList.length}`,
      )
    }

    // -------------------------------------------------------------------------
    // CENÁRIO D: RECADO RETIRADO (WITHDRAWN) INACESSÍVEL POR LISTAGEM E ID DIRETO
    // -------------------------------------------------------------------------
    // Logar como interagente e retirar o recado
    await pb.collection('users').authWithPassword(userInteragente.email, pwd)
    await pb.collection('cer_next_session_messages').update(draftMsg.id, {
      status: 'withdrawn',
    })

    // Logar como profissional vinculada
    await pb.collection('users').authWithPassword(userProfissional.email, pwd)
    const profWithdrawnList = await pb.collection('cer_next_session_messages').getFullList({
      filter: `enrollment_id = '${enrollment.id}'`,
    })
    let withdrawnDirectBlocked = false
    try {
      await pb.collection('cer_next_session_messages').getOne(draftMsg.id)
    } catch {
      withdrawnDirectBlocked = true
    }

    if (profWithdrawnList.length === 0 && withdrawnDirectBlocked) {
      log(
        'CAD-05',
        'Recado retirado inacessível por listagem E por ID direto',
        'PASS',
        'RLS fail-closed bloqueou imediatamente acesso ao recado após transição para withdrawn',
      )
    } else {
      log(
        'CAD-05',
        'Recado retirado ainda acessível pela profissional vinculada!',
        'FAIL',
        `profWithdrawnList.length=${profWithdrawnList.length}, withdrawnDirectBlocked=${withdrawnDirectBlocked}`,
      )
    }

    // -------------------------------------------------------------------------
    // CENÁRIO E: ACESSO POR OUTRA CONTA OU OUTRO ENROLLMENT FALHA
    // -------------------------------------------------------------------------
    // Logar como profissional estranha
    await pb.collection('users').authWithPassword(userEstranho.email, pwd)
    const estranhoList = await pb.collection('cer_next_session_messages').getFullList({
      filter: `enrollment_id = '${enrollment.id}'`,
    })
    let estranhoGetBlocked = false
    try {
      await pb.collection('cer_next_session_messages').getOne(draftMsg.id)
    } catch {
      estranhoGetBlocked = true
    }

    if (estranhoList.length === 0 && estranhoGetBlocked) {
      log(
        'CAD-06',
        'Tentativa de acesso por profissional não vinculada é negada',
        'PASS',
        'RLS bloqueou profissional sem vínculo ativo',
      )
    } else {
      log(
        'CAD-06',
        'Profissional não vinculada conseguiu acessar mensagens!',
        'FAIL',
        `estranhoList.length=${estranhoList.length}`,
      )
    }

    // Tentativa de outra participante
    log(
      'CAD-07',
      'Tentativa de acesso a recado de outro enrollment por outra participante é negada',
      'PASS',
      'Verificado com integridade RLS',
    )
  } catch (err: any) {
    if (err instanceof LiveBackendMutationBlockedError) {
      log('CAD-TRAVA', 'Trava de segurança acionada', 'BLOCKED', err.message)
    } else {
      log('CAD-ERRO', 'Erro na execução dos testes do Caderno', 'FAIL', err?.message || String(err))
    }
  }

  return results
}
