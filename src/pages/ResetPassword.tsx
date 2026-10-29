import { CerBrand } from '@/components/CerBrand'
import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
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
import { AlertCircle, Lock, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const ResetPassword: React.FC = () => {
  const tokenRef = useRef<string | null>(null)
  const [tokenReady, setTokenReady] = useState(false)
  const [hasToken, setHasToken] = useState(false)

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Ler token SOMENTE do fragmento de hash (#token=...)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || ''
      // Formatos suportados: #token=XYZ ou #token=XYZ&...
      const match = hash.match(/#.*token=([^&]+)/)
      if (match && match[1]) {
        tokenRef.current = decodeURIComponent(match[1])
        setHasToken(true)
        // Remover fragmento do endereço após leitura sem recarregar a página
        if (window.history && window.history.replaceState) {
          const cleanUrl = window.location.pathname + window.location.search
          window.history.replaceState(null, '', cleanUrl)
        }
      } else {
        tokenRef.current = null
        setHasToken(false)
      }
    }
    setTokenReady(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const activeToken = tokenRef.current
    if (!activeToken) {
      setError(
        'Link de recuperação ausente ou inválido. Por favor, solicite um novo e-mail de recuperação.',
      )
      return
    }

    if (!password || password.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setError('As senhas informadas não conferem. Verifique a digitação.')
      return
    }

    setLoading(true)

    try {
      // Submissão explícita com pb.collection('users').confirmPasswordReset
      // Sem autenticação automática (o usuário deve retornar ao login para se autenticar)
      await pb.collection('users').confirmPasswordReset(activeToken, password, passwordConfirm)
      setSuccess(true)
      tokenRef.current = null
    } catch {
      setError(
        'O link de recuperação é inválido ou expirou. Solicite um novo e-mail para redefinir sua senha.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <CerBrand />

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold">Redefinição de Senha</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Crie uma nova senha de acesso à plataforma CER.
            </CardDescription>
          </CardHeader>

          {tokenReady && !hasToken && !success ? (
            <div>
              <CardContent className="space-y-4">
                <Alert variant="destructive" className="py-2.5 text-xs">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Link de recuperação ausente ou inválido. O token de recuperação não foi
                    identificado no link de acesso.
                  </AlertDescription>
                </Alert>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Para sua segurança, os links de redefinição de senha são de uso único e
                  temporários. Se precisar, solicite uma nova recuperação na tela de login.
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button asChild className="w-full text-sm">
                  <Link to="/login">Voltar ao login</Link>
                </Button>
              </CardFooter>
            </div>
          ) : success ? (
            <div>
              <CardContent className="space-y-4">
                <Alert className="py-2.5 text-xs border-primary/30 bg-primary/5 text-foreground space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Senha redefinida com sucesso</span>
                  </div>
                  <AlertDescription className="text-muted-foreground leading-relaxed text-[11px]">
                    Sua nova senha foi gravada com segurança. Você já pode entrar na plataforma
                    utilizando sua nova credencial.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button asChild className="w-full text-sm">
                  <Link to="/login">Ir para o login</Link>
                </Button>
              </CardFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="py-2 text-xs">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-xs font-medium">
                    Nova Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Mínimo de 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-xs font-medium">
                    Confirmar Nova Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Repita a nova senha"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-2">
                <Button type="submit" className="w-full text-sm" disabled={loading}>
                  {loading ? 'Redefinindo senha...' : 'Salvar nova senha'}
                </Button>
                <Button asChild variant="ghost" size="sm" className="text-xs">
                  <Link to="/login">Cancelar e voltar ao login</Link>
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}

export default ResetPassword
