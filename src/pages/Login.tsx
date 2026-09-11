import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { AlertCircle, Lock, Mail, CheckCircle2, HelpCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FirstLoginPasswordChange } from '@/components/FirstLoginPasswordChange'
import { DevLoginHelpers } from '@/components/DevLoginHelpers'

export const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [needsFirstLoginPassword, setNeedsFirstLoginPassword] = useState(false)

  const { login, requestPasswordReset } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const authData = await login(email.trim(), password)
      // Se status for 'invited', interceptar para fluxo de primeiro acesso obrigatório
      if (authData.record?.status === 'invited') {
        setNeedsFirstLoginPassword(true)
        return
      }
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Credenciais inválidas. Verifique seu e-mail e senha.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Informe seu e-mail para solicitar a recuperação.')
      return
    }
    setError(null)
    setLoading(true)

    try {
      await requestPasswordReset(email.trim())
      setResetSent(true)
      // Item 10: Copy honesta sobre SMTP como gate operacional externo
      setSuccessMsg(
        'Caso sua conta esteja ativa e o canal de e-mail esteja habilitado, as orientações foram enviadas. Se não receber em alguns minutos ou se estiver no piloto, fale diretamente com sua profissional para redefinir seu acesso com credencial provisória.',
      )
    } catch {
      setError('Não foi possível processar a recuperação de senha no momento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">CER V1</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Desenvolvimento Humano Integral
          </p>
        </div>

        {needsFirstLoginPassword ? (
          // ============================================
          // FLUXO DE PRIMEIRO ACESSO (STATUS: INVITED)
          // ============================================
          <FirstLoginPasswordChange
            userEmail={email}
            onSuccess={() => {
              navigate(from, { replace: true })
            }}
          />
        ) : (
          <Card className="border-border/80 shadow-sm">
            {showForgot ? (
              // ============================================
              // TELA DE RECUPERAÇÃO DE SENHA (HONESTA / SEM FINGIR SMTP)
              // ============================================
              <div>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl font-semibold">Recuperar Senha</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    Recuperação de acesso à plataforma.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleForgotSubmit}>
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive" className="py-2 text-xs">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    {successMsg && (
                      <Alert className="py-2.5 text-xs border-primary/30 bg-primary/5 text-foreground space-y-1">
                        <div className="flex items-center gap-1.5 font-medium text-primary">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Solicitação registrada</span>
                        </div>
                        <AlertDescription className="text-muted-foreground leading-relaxed text-[11px]">
                          {successMsg}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="forgot-email" className="text-xs font-medium">
                        E-mail cadastrado
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="seu.email@exemplo.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-9 text-sm"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-[11px] text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <HelpCircle className="w-3.5 h-3.5 text-primary" />
                        <span>Esqueceu seu acesso durante o acompanhamento?</span>
                      </div>
                      <p>
                        Precisa de ajuda? Fale com sua profissional. Ela pode emitir uma credencial
                        temporária segura para você criar uma nova senha.
                      </p>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-2">
                    <Button
                      type="submit"
                      className="w-full text-sm"
                      disabled={loading || resetSent}
                    >
                      {loading ? 'Enviando...' : 'Enviar Solicitação'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setShowForgot(false)
                        setError(null)
                        setSuccessMsg(null)
                        setResetSent(false)
                      }}
                    >
                      Voltar ao login
                    </Button>
                  </CardFooter>
                </form>
              </div>
            ) : (
              // ============================================
              // TELA PRINCIPAL DE LOGIN (PILOT-SAFE, ZERO SENHA LITERAL)
              // ============================================
              <div>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl font-semibold">Acesso à Plataforma</CardTitle>
                  <CardDescription className="text-xs">
                    Entre com suas credenciais de acesso
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleLoginSubmit}>
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive" className="py-2 text-xs">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-medium">
                        E-mail
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu.email@exemplo.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-9 text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-xs font-medium">
                          Senha
                        </Label>
                        <button
                          type="button"
                          onClick={() => setShowForgot(true)}
                          className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Sua senha de acesso"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pl-9 text-sm"
                        />
                      </div>
                    </div>

                    {/* Helpers para ambiente de desenvolvimento local (import.meta.env.DEV apenas) */}
                    {import.meta.env.DEV && (
                      <DevLoginHelpers onSelectEmail={(selEmail) => setEmail(selEmail)} />
                    )}
                  </CardContent>

                  <CardFooter className="flex flex-col gap-3">
                    <Button type="submit" className="w-full text-sm" disabled={loading}>
                      {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                    <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                      A entrada de interagentes ocorre sob convite e acompanhamento profissional.
                      Precisa de ajuda? Fale com sua profissional.
                    </p>
                  </CardFooter>
                </form>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
export default Login
