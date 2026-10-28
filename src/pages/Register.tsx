import React, { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { selfRegistration, type RegistrationInfo } from '@/services/selfRegistration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const { slug = '' } = useParams()
  const [info, setInfo] = useState<RegistrationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [fullName, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [acceptLink, setAccept] = useState(false)
  const [website, setWebsite] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const generation = useRef(0)
  useEffect(() => {
    generation.current += 1
    let active = true
    setInfo(null)
    setLoading(true)
    setError('')
    setSent(false)
    setName('')
    setEmail('')
    setPassword('')
    setConfirm('')
    setShowPassword(false)
    setShowConfirm(false)
    setAccept(false)
    setWebsite('')
    setNotice('')
    setBusy(false)
    selfRegistration
      .info(slug)
      .then((value) => {
        if (active) setInfo(value)
      })
      .catch(() => {
        if (active)
          setError(
            'Não foi possível abrir este cadastro. Confira o link com sua profissional ou tente novamente mais tarde.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
      generation.current += 1
    }
  }, [slug])
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (password !== passwordConfirm) {
      setError('As senhas precisam ser iguais.')
      return
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError(
        'Essa combinação de caracteres torna a senha longa demais. Use uma senha um pouco menor.',
      )
      return
    }
    setBusy(true)
    const requestGeneration = generation.current
    try {
      await selfRegistration.register({
        slug,
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        passwordConfirm,
        acceptLink,
        website,
      })
      if (generation.current !== requestGeneration) return
      setPassword('')
      setConfirm('')
      setShowPassword(false)
      setShowConfirm(false)
      setSent(true)
    } catch {
      if (generation.current !== requestGeneration) return
      setPassword('')
      setConfirm('')
      setShowPassword(false)
      setShowConfirm(false)
      setError(
        'Não foi possível concluir ou confirmar o envio. Seus dados de nome e e-mail continuam aqui. Se já enviou o cadastro, use Reenviar confirmação; caso contrário, tente novamente.',
      )
    } finally {
      if (generation.current === requestGeneration) setBusy(false)
    }
  }
  async function resend() {
    const requestGeneration = generation.current
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await selfRegistration.resend(email)
      if (generation.current !== requestGeneration) return
      setNotice(
        'Se houver uma conta aguardando confirmação, você receberá um e-mail. Confira também o spam. Se já possui acesso, entre ou recupere sua senha.',
      )
    } catch {
      if (generation.current !== requestGeneration) return
      setError('Não foi possível solicitar o e-mail agora. Aguarde um pouco e tente novamente.')
    } finally {
      if (generation.current === requestGeneration) setBusy(false)
    }
  }
  return (
    <main className="min-h-screen bg-background px-5 py-12">
      <section className="mx-auto max-w-md space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm tracking-widest text-primary">
          CER · DESENVOLVIMENTO COM CONSCIÊNCIA
        </p>
        <h1 className="font-serif text-3xl">Seu primeiro passo</h1>
        {loading ? (
          <p role="status">Conferindo seu convite…</p>
        ) : (
          info && (
            <>
              <p>
                Crie sua conta para iniciar <strong>{info.productName}</strong> com{' '}
                <strong>{info.professionalName}</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                Você escolhe sua senha e confirma seu e-mail. Depois, sua jornada estará vinculada à
                profissional indicada aqui. As escolhas de compartilhamento continuam disponíveis no
                percurso.
              </p>
              {sent ? (
                <div className="space-y-4">
                  <h2 className="font-serif text-xl">Confira seu e-mail</h2>
                  <p>
                    Se o cadastro foi criado, enviamos uma confirmação para {email}. Abra a
                    mensagem, confirme seu e-mail e volte para entrar. Se já tem uma conta, use seu
                    acesso ou recupere a senha.
                  </p>
                  <p className="text-sm font-medium text-primary">
                    O primeiro acesso só será liberado depois de confirmar seu e-mail. Confira
                    também Spam e Lixo eletrônico.
                  </p>
                  <Button asChild>
                    <Link to="/login">Já confirmei meu e-mail · Entrar</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <Label htmlFor="registration-name">Nome completo</Label>
                    <Input
                      id="registration-name"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={160}
                      disabled={busy}
                    />
                  </div>
                  <div>
                    <Label htmlFor="registration-email">E-mail</Label>
                    <Input
                      id="registration-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      maxLength={254}
                      disabled={busy}
                    />
                  </div>
                  <div>
                    <Label htmlFor="registration-password">Crie sua senha</Label>
                    <div className="relative">
                      <Input
                        id="registration-password"
                        type={showPassword ? 'text' : 'password'}
                        className="pr-12"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={10}
                        maxLength={64}
                        required
                        disabled={busy}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-10 w-10"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        aria-controls="registration-password"
                        aria-pressed={showPassword}
                        disabled={busy}
                        onClick={() => setShowPassword((visible) => !visible)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use pelo menos 10 caracteres. Sua profissional não recebe essa senha.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="registration-confirm">Repita sua senha</Label>
                    <div className="relative">
                      <Input
                        id="registration-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        className="pr-12"
                        autoComplete="new-password"
                        value={passwordConfirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        minLength={10}
                        maxLength={64}
                        disabled={busy}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-10 w-10"
                        aria-label={
                          showConfirm
                            ? 'Ocultar confirmação de senha'
                            : 'Mostrar confirmação de senha'
                        }
                        aria-controls="registration-confirm"
                        aria-pressed={showConfirm}
                        disabled={busy}
                        onClick={() => setShowConfirm((visible) => !visible)}
                      >
                        {showConfirm ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div aria-hidden="true" className="hidden">
                    <input
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={acceptLink}
                      onChange={(e) => setAccept(e.target.checked)}
                      required
                      disabled={busy}
                    />
                    Quero iniciar meu acompanhamento com {info.professionalName} e vincular minha
                    conta a essa profissional.
                  </label>
                  <Button type="submit" className="w-full" disabled={busy || !acceptLink}>
                    {busy ? 'Preparando sua conta…' : 'Criar minha conta'}
                  </Button>
                </form>
              )}
              {email.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void resend()}
                >
                  Reenviar confirmação
                </Button>
              )}
            </>
          )
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm">
            {notice}
          </p>
        )}
        <p className="text-sm">
          <Link className="underline text-primary" to="/login">
            Já tenho conta · Entrar
          </Link>
        </p>
      </section>
    </main>
  )
}
