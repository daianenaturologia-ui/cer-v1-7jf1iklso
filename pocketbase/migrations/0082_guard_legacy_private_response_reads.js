// Preserve content and existing authorization; fail closed for mixed legacy records.
migrate((app) => {
  const safe = '(structured_value.share_private_text_with_professional = true || (structured_value.share_private_text_with_professional = null && structured_value.private_text = null))'
  for (const name of ['experience_responses', 'experience_response_versions']) {
    const col = app.findCollectionByNameOrId(name)
    for (const operation of ['listRule', 'viewRule']) {
      if (col[operation] == null || !String(col[operation]).trim()) {
        throw new Error('Expected restricted legacy response rule: ' + name)
      }
      const currentSafe = name === 'experience_response_versions'
        ? ' && ' + safe.replace(/structured_value/g, 'response_id.structured_value')
        : ''
      col[operation] = '(' + col[operation] + ') && (respondent_user_id = @request.auth.id || (' + safe + currentSafe + '))'
    }
    app.save(col)
  }
}, () => {
  throw new Error('Reversão exige regra substituta revisada; não reabrir texto privado legado.')
})
