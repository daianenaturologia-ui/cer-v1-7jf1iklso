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
import { AlertCircle, Lock, Mail } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch {
      setError('Credenciais inválidas. Verifique seu e-mail e senha.')
    } finally {
      setLoading(false)
    }
  }

  // Preenchimento rápido para ambiente de desenvolvimento com seeds sintéticas
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
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold">Acesso à Plataforma</CardTitle>
            <CardDescription className="text-xs">
              Entre com suas credenciais de acesso
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
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

              <div className="pt-2 text-[11px] text-muted-foreground space-y-1 bg-muted/40 p-2.5 rounded-lg border border-border/40">
                <p className="font-medium text-foreground">Acesso Sintético (Desenvolvimento):</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[11px] px-2"
                    onClick={() => fillCredentials('daiane.naturologia@gmail.com')}
                  >
                    Profissional
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[11px] px-2"
                    onClick={() => fillCredentials('interagente.demo@cer.app')}
                  >
                    Interagente
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
        </Card>
      </div>
    </div>
  )
}
export default Login
