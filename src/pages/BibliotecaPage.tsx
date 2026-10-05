import React from 'react'
import { Link } from 'react-router-dom'
import { PracticeSelector } from '@/components/PracticeSelector'
import { DevelopmentResourceEditor } from '@/components/DevelopmentResourceEditor'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen } from 'lucide-react'

export const BibliotecaPage: React.FC = () => {
  const { isProfissional, isDemo } = useAuth()
  if (!isProfissional) return <p className="p-6">Este espaço é da profissional.</p>
  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link to="/profissional">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para o Painel Profissional</span>
            </Button>
          </Link>
          <h1 className="text-xl font-bold font-serif text-foreground">
            Biblioteca de Práticas Clínicas
          </h1>
        </div>
      </div>

      <DevelopmentResourceEditor />
      {isDemo ? (
        <p className="text-sm text-muted-foreground">
          As práticas clínicas fictícias são combinadas no acompanhamento de Mariana. O acervo
          educativo acima pode ser explorado aqui.
        </p>
      ) : (
        <PracticeSelector />
      )}
    </div>
  )
}
