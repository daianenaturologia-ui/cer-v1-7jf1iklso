import React, { useState } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, KeyRound, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

interface FirstLoginPasswordChangeProps {
  onSuccess: () => void
  userEmail?: string
}

export const FirstLoginPasswordChange: React.FC<FirstLoginPasswordChangeProps> = ({
  onSuccess,
  userEmail,
}) => {
  const [newPassword, setNewPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('A sua senha definitiva deve ter no mínimo 8 caracteres.')
      return
    }

    if (newPassword !== passwordConfirm) {
      setError('A confirmação da senha não coincide com a nova senha.')
      return
    }

    setLoading(true)
    try {
      // Chama o endpoint server-side atômico registrado no backend Skip Cloud
      await pb.send('/backend/v1/cer/first-login', {
        method: 'POST',
        body: {
          newPassword,
          passwordConfirm,
        },
      })

      // Atualiza o token/registro local na authStore do PocketBase
      if (pb.authStore.record) {
        pb.authStore.record.status = 'active'
      }

      onSuccess()
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Não foi possível definir sua senha no momento. Tente novamente.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border/80 shadow-md max-w-md w-full mx-auto">
      <CardHeader className="space-y-1.5 pb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
          <KeyRound className="w-5 h-5" />
        </div>
        <CardTitle className="text-xl font-serif font-semibold">Crie sua Senha Pessoal</CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          Seja muito bem-vinda ao CER. Você entrou com uma credencial provisória. Por segurança,
          crie uma nova senha definitiva que só você conhece.
        </CardDescription>
        {userEmail && (
          <p className="text-[11px] font-mono text-muted-foreground pt-1">Conta: {userEmail}</p>
        )}
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
            <Label htmlFor="new-password" className="text-xs font-medium">
              Nova senha pessoal
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-password"
                type="password"
                placeholder="Mínimo de 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="pl-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password-confirm" className="text-xs font-medium">
              Confirme a nova senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password-confirm"
                type="password"
                placeholder="Repita a nova senha"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                className="pl-9 text-sm"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 text-[11px] text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Privacidade e Autonomia</span>
            </div>
            <p>
              Sua profissional nunca saberá ou terá acesso à sua senha definitiva. Esta credencial é
              estritamente pessoal.
            </p>
          </div>
        </CardContent>

        <CardFooter className="pt-2">
          <Button type="submit" className="w-full text-sm h-10" disabled={loading}>
            {loading ? 'Salvando...' : 'Criar minha senha e continuar'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export default FirstLoginPasswordChange
