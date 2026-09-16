// Hook server-side de integridade e imutabilidade de cer_journal_entry_versions
// Garante que versões prévias nunca sejam alteradas ou deletadas após a inserção.

onRecordCreate((e) => {
  const record = e.record
  // access_class SEMPRE participant_private
  record.set('access_class', 'participant_private')
  e.next()
}, 'cer_journal_entry_versions')

onRecordUpdate((e) => {
  throw new BadRequestError(
    'Versões históricas do Caderno são imutáveis e não podem ser alteradas.',
  )
}, 'cer_journal_entry_versions')

onRecordDelete((e) => {
  throw new BadRequestError(
    'Versões históricas do Caderno são imutáveis e não podem ser excluídas.',
  )
}, 'cer_journal_entry_versions')
