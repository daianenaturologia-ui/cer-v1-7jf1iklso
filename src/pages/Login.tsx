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
import { AlertCircle, Lock, Mail, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const { login, requestPasswordReset } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(email.trim(), password)
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
      setSuccessMsg('Se o e-mail estiver cadastrado, as instruções seguras foram enviadas.')
    } catch {
      setError('Não foi possível processar a recuperação de senha no momento.')
    } finally {
      setLoading(false)
    }
  }

  // Preenchimento rápido para testes com os novos dados sintéticos
  const fillCredentials = (quickEmail: string) => {
    setEmail(quickEmail)
    setPassword('Skip@Pass')
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

        <Card className="border-border/80 shadow-sm">
          {showForgot ? (
            // ============================================
            // TELA DE RECUPERAÇÃO DE SENHA
            // ============================================
            <div>
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl font-semibold">Recuperar Senha</CardTitle>
                <CardDescription className="text-xs">
                  Enviaremos um link seguro e temporário para redefinir sua credencial.
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
                    <Alert className="py-2 text-xs border-primary/30 bg-primary/5 text-primary">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <AlertDescription>{successMsg}</AlertDescription>
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
                </CardContent>

                <CardFooter className="flex flex-col gap-2">
                  <Button type="submit" className="w-full text-sm" disabled={loading || resetSent}>
                    {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
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
                    }}
                  >
                    Voltar ao login
                  </Button>
                </CardFooter>
              </form>
            </div>
          ) : (
            // ============================================
            // TELA PRINCIPAL DE LOGIN
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
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Seleção rápida de dados sintéticos do Build 01 */}
                  <div className="pt-2 text-[11px] text-muted-foreground space-y-1.5 bg-muted/40 p-2.5 rounded-lg border border-border/40">
                    <p className="font-medium text-foreground">Acessos Sintéticos (Build 01):</p>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-1.5 truncate"
                        onClick={() => fillCredentials('ana.teste@cer.app')}
                      >
                        Ana Teste (Interagente)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-1.5 truncate"
                        onClick={() => fillCredentials('beatriz.teste@cer.app')}
                      >
                        Beatriz (Interagente)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-1.5 truncate"
                        onClick={() => fillCredentials('profissional.a@cer.app')}
                      >
                        Profissional A
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-1.5 truncate"
                        onClick={() => fillCredentials('profissional.b@cer.app')}
                      >
                        Profissional B
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-1.5 col-span-2 truncate"
                        onClick={() => fillCredentials('admin.cer@cer.app')}
                      >
                        Admin CER (Platform Admin)
                      </Button>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3">
                  <Button type="submit" className="w-full text-sm" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                  <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                    A entrada de interagentes ocorre sob convite e acompanhamento profissional.
                  </p>
                </CardFooter>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
export default Login
