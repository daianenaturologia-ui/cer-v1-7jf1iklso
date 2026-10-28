// Published pilot origin, verified before enabling registration emails.
// Never derive credential destinations from request headers.
onMailerRecordVerificationSend((e) => {
  const pending = e.app.findRecordsByFilter(
    'cer_registration_requests', 'user_id = {:user} && completed = false', '', 1, 0,
    { user: e.record.id },
  )
  if (!pending.length) return e.next()
  const token = e.meta.token
  if (typeof token !== 'string' || !token) throw new Error('Confirmação indisponível.')
  const url = 'https://cer-v1-1444e.goskip.app/confirmar-email#token=' + encodeURIComponent(token)
  e.message.subject = 'Confirme seu e-mail para iniciar no CER'
  e.message.html = '<p>Seu cadastro no CER está quase pronto.</p>' +
    '<p><a href="' + url + '">Confirmar meu e-mail</a></p>' +
    '<p>Na página, confirme seu e-mail e entre com a senha que você escolheu. ' +
    'Sua profissional não recebe sua senha.</p>' +
    '<p>Se você não solicitou este cadastro, ignore esta mensagem.</p>'
  return e.next()
}, 'users')
