import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ConfirmEmail() {
  const [token, setToken] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get('token') || '',
  )
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    // Fragment never reaches the HTTP server; remove it from browser history too.
    window.history.replaceState(
      window.history.state,
      '',
      window.location.pathname + window.location.search,
    )
  }, [])
  async function confirm() {
    if (!token || busy) return
    setBusy(true)
    setError('')
    try {
      await pb.collection('users').confirmVerification(token, { requestKey: null })
      setConfirmed(true)
    } catch {
      setError(
        'Não foi possível confirmar este link. Ele pode ter expirado ou já ter sido utilizado. Tente entrar ou solicite uma nova confirmação abaixo.',
      )
    } finally {
      setToken('')
      setBusy(false)
    }
  }
  async function resend(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await pb.collection('users').requestVerification(email.trim(), { requestKey: null })
      setMessage(
        'Se houver uma conta aguardando confirmação com este e-mail, você receberá uma nova mensagem. Abra a mais recente e confira também Spam e Lixo eletrônico.',
      )
    } catch {
      setError(
        'Não foi possível solicitar a confirmação agora. Aguarde um pouco e tente novamente.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="min-h-screen bg-background px-5 py-12">
      <section className="mx-auto max-w-md space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm tracking-widest text-primary">
          CER · DESENVOLVIMENTO COM CONSCIÊNCIA
        </p>
        <h1 className="font-serif text-3xl">
          {confirmed ? 'E-mail confirmado' : 'Confirme seu e-mail'}
        </h1>
        {confirmed ? (
          <>
            <p>Agora entre com o e-mail e a senha que você escolheu para iniciar sua jornada.</p>
            <Button asChild>
              <Link to="/login">Entrar na minha jornada</Link>
            </Button>
          </>
        ) : (
          <>
            {token ? (
              <>
                <p>Confirme abaixo para concluir a verificação do seu cadastro no CER.</p>
                <Button disabled={busy} onClick={() => void confirm()}>
                  {busy ? 'Confirmando…' : 'Confirmar meu e-mail'}
                </Button>
              </>
            ) : (
              <p>
                Abra o link da mensagem mais recente para confirmar seu cadastro. Se o link anterior
                não abriu ou expirou, solicite outro abaixo.
              </p>
            )}
            {error && <p role="alert">{error}</p>}
            {message && <p role="status">{message}</p>}
            <form onSubmit={resend} className="space-y-3">
              <Label htmlFor="confirmation-email">E-mail usado no cadastro</Label>
              <Input
                id="confirmation-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
              <Button variant="outline" disabled={busy || !email.trim()} type="submit">
                Solicitar nova confirmação
              </Button>
            </form>
            <Link className="block text-sm underline" to="/login">
              Já confirmei meu e-mail · Entrar
            </Link>
          </>
        )}
      </section>
    </main>
  )
}
