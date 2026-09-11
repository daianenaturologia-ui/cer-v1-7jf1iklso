import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Code, User } from 'lucide-react'

interface DevPersona {
  name: string
  role: string
  email: string
}

// Lista de personas sintéticas conhecidas para desenvolvimento local (DEV ONLY)
// NENHUMA senha em constante, NENHUMA senha no source, NENHUMA senha em env commitado.
const DEV_PERSONAS: DevPersona[] = [
  { name: 'Ana Teste', role: 'Interagente', email: 'ana.teste@cer.app' },
  { name: 'Beatriz', role: 'Interagente', email: 'beatriz.teste@cer.app' },
  { name: 'Profissional A', role: 'Profissional', email: 'profissional.a@cer.app' },
  { name: 'Profissional B', role: 'Profissional', email: 'profissional.b@cer.app' },
  { name: 'Admin CER', role: 'Platform Admin', email: 'admin.cer@cer.app' },
]

interface DevLoginHelpersProps {
  onSelectEmail: (email: string) => void
}

/**
 * DevLoginHelpers:
 * - Apenas renderizado em import.meta.env.DEV
 * - Preenche SOMENTE o email/username no formulário
 * - A senha DEVE ser digitada manualmente pelo operador
 * - Não armazena nem preenche senhas literais
 */
export const DevLoginHelpers: React.FC<DevLoginHelpersProps> = ({ onSelectEmail }) => {
  // Guard extra em runtime: se não estiver em ambiente de desenvolvimento, não renderiza nada
  if (!import.meta.env.DEV) {
    return null
  }

  return (
    <div className="pt-2 text-[11px] text-muted-foreground space-y-2 bg-muted/40 p-3 rounded-lg border border-dashed border-border/70">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <Code className="w-3.5 h-3.5 text-primary" />
          <span>Personas de Teste (Ambiente Dev)</span>
        </div>
        <Badge variant="outline" className="text-[9px] uppercase font-mono">
          dev-only
        </Badge>
      </div>

      <p className="text-[10px] text-muted-foreground leading-normal">
        Clique para preencher o e-mail da persona. A senha de acesso deve ser digitada manualmente.
      </p>

      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
        {DEV_PERSONAS.map((p) => (
          <Button
            key={p.email}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-[10px] px-2 justify-start truncate hover:border-primary/50"
            onClick={() => onSelectEmail(p.email)}
          >
            <User className="w-3 h-3 mr-1 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {p.name} ({p.role})
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
}

export default DevLoginHelpers
