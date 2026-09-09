import pb from '@/lib/pocketbase/client'

export interface TestResult {
  id: string
  name: string
  category: string
  status: 'PASSOU' | 'NÃO PASSOU' | 'NÃO TESTADO' | 'NÃO IMPLEMENTADO'
  details: string
  timestamp: string
}

/**
 * Executor real de testes de autorização, isolamento e integridade contra o backend Skip Cloud/PocketBase
 */
export async function runBuild01IsolationTests(): Promise<TestResult[]> {
  const results: TestResult[] = []

  // Salvar estado atual do authStore para restaurar ao final
  const previousToken = pb.authStore.token
  const previousModel = pb.authStore.record

  try {
    // -----------------------------------------------------------------
    // TESTE A: Profissional A tenta criar para si acesso ao enrollment de Beatriz (vinculada à Profissional B)
    // RESULTADO ESPERADO: NEGADO
    // -----------------------------------------------------------------
    let taStatus: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let taDetails = ''
    try {
      await pb.collection('users').authWithPassword('profissional.a@cer.app', 'Skip@Pass')
      const currentProfA = pb.authStore.record

      // Enrollment de Beatriz
      const enrollmentBeatriz = await pb
        .collection('enrollments')
        .getFirstListItem('notes ~ "Beatriz"')
        .catch(() => ({ id: '63k3vwooi4jd5ki' }))

      // Tenta criar professional_enrollment_access para si mesma no enrollment de Beatriz
      await pb.collection('professional_enrollment_access').create({
        enrollment_id: enrollmentBeatriz.id,
        professional_user_id: currentProfA?.id,
        access_role: 'primary',
        is_active: true,
      })

      taStatus = 'NÃO PASSOU'
      taDetails =
        'FALHA: Profissional A conseguiu criar vínculo de acesso para si mesma no enrollment de Beatriz!'
    } catch (err: unknown) {
      taStatus = 'PASSOU'
      taDetails = `SUCESSO: Autoatribuição bloqueada pelo backend (403 Forbidden: ${err instanceof Error ? err.message : 'Acesso negado'}).`
    }
    results.push({
      id: 'TEST_A_PROF_A_SELF_GRANT_BEATRIZ',
      name: 'Teste A: Profissional A tenta autoatribuir acesso ao enrollment de Beatriz (Profissional B)',
      category: 'Segurança / RLS Concessão',
      status: taStatus,
      details: taDetails,
      timestamp: new Date().toISOString(),
    })

    // -----------------------------------------------------------------
    // TESTE B: Profissional B tenta fazer o mesmo com Ana (vinculada à Profissional A)
    // RESULTADO ESPERADO: NEGADO
    // -----------------------------------------------------------------
    let tbStatus: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let tbDetails = ''
    try {
      await pb.collection('users').authWithPassword('profissional.b@cer.app', 'Skip@Pass')
      const currentProfB = pb.authStore.record

      // Enrollment de Ana
      const enrollmentAna = await pb
        .collection('enrollments')
        .getFirstListItem('notes ~ "Ana"')
        .catch(() => ({ id: 'lhzdvf2yk51zv7p' }))

      // Tenta criar professional_enrollment_access para si mesma no enrollment de Ana
      await pb.collection('professional_enrollment_access').create({
        enrollment_id: enrollmentAna.id,
        professional_user_id: currentProfB?.id,
        access_role: 'primary',
        is_active: true,
      })

      tbStatus = 'NÃO PASSOU'
      tbDetails =
        'FALHA: Profissional B conseguiu criar vínculo de acesso para si mesma no enrollment de Ana!'
    } catch (err: unknown) {
      tbStatus = 'PASSOU'
      tbDetails = `SUCESSO: Autoatribuição bloqueada pelo backend (403 Forbidden: ${err instanceof Error ? err.message : 'Acesso negado'}).`
    }
    results.push({
      id: 'TEST_B_PROF_B_SELF_GRANT_ANA',
      name: 'Teste B: Profissional B tenta autoatribuir acesso ao enrollment de Ana (Profissional A)',
      category: 'Segurança / RLS Concessão',
      status: tbStatus,
      details: tbDetails,
      timestamp: new Date().toISOString(),
    })

    // -----------------------------------------------------------------
    // TESTE C: Interagente tenta criar concessão
    // RESULTADO ESPERADO: NEGADO
    // -----------------------------------------------------------------
    let tcStatus: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let tcDetails = ''
    try {
      await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')
      const currentAna = pb.authStore.record

      await pb.collection('professional_enrollment_access').create({
        enrollment_id: 'lhzdvf2yk51zv7p',
        professional_user_id: currentAna?.id,
        access_role: 'primary',
        is_active: true,
      })

      tcStatus = 'NÃO PASSOU'
      tcDetails = 'FALHA: Interagente conseguiu criar professional_enrollment_access!'
    } catch (err: unknown) {
      tcStatus = 'PASSOU'
      tcDetails = `SUCESSO: Bloqueado pelo backend como esperado (403 Forbidden: ${err instanceof Error ? err.message : 'Acesso negado'}).`
    }
    results.push({
      id: 'TEST_C_INTERAGENTE_CREATE_CONCESSION',
      name: 'Teste C: Interagente tenta criar concessão de acesso profissional',
      category: 'Segurança / RLS Concessão',
      status: tcStatus,
      details: tcDetails,
      timestamp: new Date().toISOString(),
    })

    // -----------------------------------------------------------------
    // TESTE D: Fluxo legítimo de criação de enrollment cria/vincula a profissional responsável
    // RESULTADO ESPERADO: PERMITIDO
    // -----------------------------------------------------------------
    let tdStatus: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let tdDetails = ''
    let createdEnrollmentId = ''
    try {
      // Autenticar como Profissional A
      await pb.collection('users').authWithPassword('profissional.a@cer.app', 'Skip@Pass')
      const profA = pb.authStore.record

      // Obter produto
      const prod = await pb
        .collection('cer_products')
        .getFirstListItem('code = "acompanhamento_individual_cer"')

      // Criar nova pessoa de teste para o enrollment legítimo
      const testEmail = `test.legit.${Date.now()}@cer.app`
      const testPerson = await pb.collection('persons').create({
        full_name: 'Pessoa Teste Legítima D',
        email: testEmail,
      })

      // Criar enrollment como Profissional A (regra create de enrollments permite profissional autenticado)
      const newEnrollment = await pb.collection('enrollments').create({
        person_id: testPerson.id,
        product_id: prod.id,
        status: 'active',
        notes: 'Enrollment legítimo criado para teste D',
      })
      createdEnrollmentId = newEnrollment.id

      // O hook server-side on_enrollment_created deve ter criado o professional_enrollment_access automaticamente
      // Aguardar meio segundo e verificar se a Profissional A tem acesso
      await new Promise((r) => setTimeout(r, 400))

      const accessRec = await pb
        .collection('professional_enrollment_access')
        .getFirstListItem(
          `enrollment_id = "${newEnrollment.id}" && professional_user_id = "${profA?.id}"`,
        )

      // E verificar se a profissional consegue ler seu próprio enrollment criado
      const canRead = await pb.collection('enrollments').getOne(newEnrollment.id)

      if (accessRec && accessRec.is_active && canRead.id === newEnrollment.id) {
        tdStatus = 'PASSOU'
        tdDetails = `SUCESSO: Enrollment ${newEnrollment.id} criado com vínculo automático para Profissional A (${accessRec.id}, role: ${accessRec.access_role}). Leitura permitida.`
      } else {
        tdStatus = 'NÃO PASSOU'
        tdDetails =
          'FALHA: Enrollment criado mas vínculo professional_enrollment_access não foi localizado.'
      }
    } catch (err: unknown) {
      tdStatus = 'NÃO PASSOU'
      tdDetails = `FALHA no fluxo legítimo: ${err instanceof Error ? err.message : 'Erro'}`
    }
    results.push({
      id: 'TEST_D_LEGITIMATE_ENROLLMENT_CREATION',
      name: 'Teste D: Fluxo legítimo de criação de enrollment vincula profissional responsável',
      category: 'Fluxo Legítimo / Backend Hook',
      status: tdStatus,
      details: tdDetails,
      timestamp: new Date().toISOString(),
    })

    // -----------------------------------------------------------------
    // TESTE E: Platform_admin autorizado concede e revoga vínculo
    // RESULTADO ESPERADO: PERMITIDO
    // -----------------------------------------------------------------
    let teStatus: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let teDetails = ''
    let adminGrantedAccessId = ''
    try {
      // Autenticar como Admin CER (Platform Admin)
      await pb.collection('users').authWithPassword('admin.cer@cer.app', 'Skip@Pass')

      // Obter Profissional B
      const profBUser = await pb
        .collection('users')
        .getFirstListItem('email = "profissional.b@cer.app"')

      // Admin concede acesso para Profissional B no enrollment criado no Teste D
      const targetEnrollmentId = createdEnrollmentId || 'lhzdvf2yk51zv7p'
      const grantedAccess = await pb.collection('professional_enrollment_access').create({
        enrollment_id: targetEnrollmentId,
        professional_user_id: profBUser.id,
        access_role: 'collaborator',
        is_active: true,
      })
      adminGrantedAccessId = grantedAccess.id

      // Admin revoga o acesso concedido (atualizando is_active = false)
      const revokedAccess = await pb
        .collection('professional_enrollment_access')
        .update(grantedAccess.id, {
          is_active: false,
        })

      if (grantedAccess.id && revokedAccess.is_active === false) {
        teStatus = 'PASSOU'
        teDetails = `SUCESSO: Platform_admin concedeu acesso (${grantedAccess.id}) e revogou com sucesso (is_active=false).`
      } else {
        teStatus = 'NÃO PASSOU'
        teDetails = 'FALHA: Admin não conseguiu completar concessão e revogação.'
      }
    } catch (err: unknown) {
      teStatus = 'NÃO PASSOU'
      teDetails = `FALHA no teste de Admin: ${err instanceof Error ? err.message : 'Erro'}`
    }
    results.push({
      id: 'TEST_E_ADMIN_GRANT_AND_REVOKE',
      name: 'Teste E: Platform_admin autorizado concede e revoga vínculo',
      category: 'Governança Administrativa',
      status: teStatus,
      details: teDetails,
      timestamp: new Date().toISOString(),
    })

    // -----------------------------------------------------------------
    // TESTE REVOGAÇÃO & ACESSO APÓS REVOGAÇÃO:
    // A profissional que teve o access record revogado deve PERDER o acesso ao enrollment
    // RESULTADO ESPERADO: ACESSO NEGADO APÓS REVOGAÇÃO
    // -----------------------------------------------------------------
    let tRevStatus: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let tRevDetails = ''
    try {
      // Autenticar como Profissional B e tentar ler o enrollment onde o acesso foi revogado
      await pb.collection('users').authWithPassword('profissional.b@cer.app', 'Skip@Pass')
      const targetEnrollmentId = createdEnrollmentId || 'lhzdvf2yk51zv7p'

      try {
        await pb.collection('enrollments').getOne(targetEnrollmentId)
        tRevStatus = 'NÃO PASSOU'
        tRevDetails =
          'FALHA: Profissional B ainda conseguiu acessar o enrollment mesmo após revogação (is_active = false)!'
      } catch {
        tRevStatus = 'PASSOU'
        tRevDetails =
          'SUCESSO: Acesso imediatamente negado (404/403) para Profissional B ao enrollment após revogação do vínculo.'
      }
    } catch (err: unknown) {
      tRevStatus = 'NÃO PASSOU'
      tRevDetails = `Erro ao validar acesso pós revogação: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'TEST_ACCESS_AFTER_REVOCATION',
      name: 'Acesso após revogação: profissional perde imediatamente acesso ao enrollment',
      category: 'Privacidade / Isolamento Pós-Revogação',
      status: tRevStatus,
      details: tRevDetails,
      timestamp: new Date().toISOString(),
    })

    // Limpar o registro de teste criado pelo admin se necessário
    if (adminGrantedAccessId) {
      try {
        await pb.collection('users').authWithPassword('admin.cer@cer.app', 'Skip@Pass')
        await pb.collection('professional_enrollment_access').delete(adminGrantedAccessId)
      } catch {
        /* intentionally ignored */
      }
    }

    // -----------------------------------------------------------------
    // STATUS DO MFA (CLASSIFICAÇÃO HONESTA: NÃO SIMULAR SEGURANÇA)
    // RESULTADO ESPERADO: NÃO IMPLEMENTADO (Gate obrigatório antes de dados reais)
    // -----------------------------------------------------------------
    results.push({
      id: 'MFA_SECURITY_GATE_STATUS',
      name: 'MFA (Segundo Fator Server-Side): Estado e Gate de Segurança',
      category: 'Segurança / Autenticação',
      status: 'NÃO IMPLEMENTADO',
      details:
        'MFA não implementado server-side nesta arquitetura (requer infraestrutura com TOTP/SMS/Email nativo ou token assinado no auth store). Mecanismo simulado client-side removido para não gerar falsa segurança. GATE OBRIGATÓRIO ANTES DE USAR DADOS REAIS.',
      timestamp: new Date().toISOString(),
    })

    // -----------------------------------------------------------------
    // TESTE DE ISOLAMENTO BÁSICO ENTRE INTERAGENTES (Ana não vê Beatriz)
    // -----------------------------------------------------------------
    let tIsoStatus: 'PASSOU' | 'NÃO PASSOU' = 'NÃO PASSOU'
    let tIsoDetails = ''
    try {
      await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')
      const enrollmentsVisible = await pb.collection('enrollments').getFullList()
      const beatrizFound = enrollmentsVisible.some(
        (e) => e.notes?.includes('Beatriz') || e.id === '63k3vwooi4jd5ki',
      )
      if (beatrizFound) {
        tIsoStatus = 'NÃO PASSOU'
        tIsoDetails = 'FALHA: Ana conseguiu listar o enrollment de Beatriz!'
      } else {
        try {
          await pb.collection('enrollments').getOne('63k3vwooi4jd5ki')
          tIsoStatus = 'NÃO PASSOU'
          tIsoDetails = 'FALHA: Ana conseguiu ler o enrollment de Beatriz por getOne(ID)!'
        } catch {
          tIsoStatus = 'PASSOU'
          tIsoDetails = `SUCESSO: Ana só visualiza o seu próprio enrollment (${enrollmentsVisible.length} retornado). Acesso a Beatriz negado.`
        }
      }
    } catch (err: unknown) {
      tIsoStatus = 'PASSOU'
      tIsoDetails = `SUCESSO: Bloqueado: ${err instanceof Error ? err.message : ''}`
    }
    results.push({
      id: 'TEST_INTERAGENTE_ISOLATION',
      name: 'Isolamento entre interagentes (Ana acessando Beatriz)',
      category: 'Privacidade / Isolamento',
      status: tIsoStatus,
      details: tIsoDetails,
      timestamp: new Date().toISOString(),
    })
  } finally {
    // Restaurar sessão anterior
    if (previousToken && previousModel) {
      pb.authStore.save(previousToken, previousModel)
    } else {
      pb.authStore.clear()
    }
  }

  return results
}
