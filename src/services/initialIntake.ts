/** Read the three answers from the existing initial-intake message format. */
export function parseInitialIntake(text: string) {
  const labels = ['O que a traz:', 'O que já a ajuda:', 'O que deseja cuidar:']
  const normalized = text.replace(/\r\n/g, '\n')
  const parts = normalized.split(/(?:^|\n\n)(O que a traz:|O que já a ajuda:|O que deseja cuidar:)\n/)
  if (parts.length === 1) return { brings: text, helps: '', cares: '' }
  const values = ['', '', '']
  for (let i = 1; i < parts.length; i += 2) {
    const index = labels.indexOf(parts[i])
    values[index] = (parts[i + 1] || '').trim()
  }
  return { brings: values[0], helps: values[1], cares: values[2] }
}
