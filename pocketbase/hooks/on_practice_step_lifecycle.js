// Hook server-side do Lote 3A: Governança, Unicidade, Imutabilidade e Zero Delete de cer_practice_steps
// Coleções monitoradas: cer_practice_steps, cer_practice_versions
//
// Regras obrigatórias:
// 1. Vínculo obrigatório à PracticeVersion existente.
// 2. Proibição de troca de practice_version_id ou de stable_step_id em update.
// 3. Unicidade de stable_step_id dentro da mesma PracticeVersion (reforço além do índice).
// 4. Congelamento dos passos: quando a PracticeVersion estiver em estado editorial que exija imutabilidade
//    ('approved', 'active', 'deprecated', 'retired'), NENHUM passo vinculado pode ser criado ou alterado.
// 5. Zero delete físico: deleteRule: null e hook rejeita qualquer exclusão.

onRecordCreate((e) => {
  const step = e.record
  const versionId = step.getString('practice_version_id')
  const stableId = step.getString('stable_step_id')

  if (!versionId) {
    throw new BadRequestError(
      'Vínculo Obrigatório: Passo exige vínculo a uma PracticeVersion (practice_version_id).',
    )
  }

  if (!stableId || !stableId.trim()) {
    throw new BadRequestError(
      'Identidade Estável Obrigatória: Passo exige stable_step_id não vazio.',
    )
  }

  // Verificar estado editorial da PracticeVersion
  let version = null
  try {
    version = $app.findFirstRecordByData('cer_practice_versions', 'id', versionId)
  } catch (_) {
    throw new BadRequestError('PracticeVersion vinculada não encontrada.')
  }

  const vStatus = version.getString('status') || 'draft'
  const isFrozen =
    vStatus === 'approved' ||
    vStatus === 'active' ||
    vStatus === 'deprecated' ||
    vStatus === 'retired'
  if (isFrozen) {
    throw new BadRequestError(
      'Congelamento Editorial Violado: A PracticeVersion está no estado "' +
        vStatus +
        '". Não é permitido criar passos em versões aprovadas ou publicadas. Crie uma nova PracticeVersion.',
    )
  }

  // Verificar unicidade de stable_step_id na mesma versão
  try {
    const existing = $app.findRecordsByFilter(
      'cer_practice_steps',
      'practice_version_id = "' + versionId + '" && stable_step_id = "' + stableId.trim() + '"',
      '',
      1,
      0,
    )
    if (existing && existing.length > 0) {
      throw new BadRequestError(
        'Unicidade Violada: Já existe um passo com o stable_step_id "' +
          stableId +
          '" nesta PracticeVersion.',
      )
    }
  } catch (err) {
    if (err && err.message && err.message.indexOf('Unicidade Violada') !== -1) {
      throw err
    }
  }

  e.next()
}, 'cer_practice_steps')

onRecordUpdate((e) => {
  const step = e.record
  const orig = step.original()
  if (!orig) {
    e.next()
    return
  }

  const origVersionId = orig.getString('practice_version_id')
  const newVersionId = step.getString('practice_version_id')
  const origStableId = orig.getString('stable_step_id')
  const newStableId = step.getString('stable_step_id')

  // Proibição de troca de vínculo relacional e identidade estável
  if (origVersionId !== newVersionId) {
    throw new BadRequestError(
      'Imutabilidade de Vínculo: Não é permitido alterar practice_version_id de um passo.',
    )
  }
  if (origStableId !== newStableId) {
    throw new BadRequestError(
      'Imutabilidade de Identidade: Não é permitido alterar stable_step_id de um passo.',
    )
  }

  // Verificar estado editorial da PracticeVersion
  let version = null
  try {
    version = $app.findFirstRecordByData('cer_practice_versions', 'id', origVersionId)
  } catch (_) {
    throw new BadRequestError('PracticeVersion vinculada não encontrada.')
  }

  const vStatus = version.getString('status') || 'draft'
  const isFrozen =
    vStatus === 'approved' ||
    vStatus === 'active' ||
    vStatus === 'deprecated' ||
    vStatus === 'retired'
  if (isFrozen) {
    throw new BadRequestError(
      'Congelamento Editorial Violado: A PracticeVersion está no estado "' +
        vStatus +
        '". Passos de versões aprovadas ou publicadas são estritamente imutáveis. Alterações exigem nova PracticeVersion.',
    )
  }

  e.next()
}, 'cer_practice_steps')

onRecordDelete((e) => {
  throw new BadRequestError(
    'Zero Delete Físico: Exclusão de passo de prática não permitida. Histórico é versionado.',
  )
}, 'cer_practice_steps')
