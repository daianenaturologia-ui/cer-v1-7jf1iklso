import React from 'react'
import { Link } from 'react-router-dom'
import { PracticeSelector } from '@/components/PracticeSelector'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen } from 'lucide-react'

export const BibliotecaPage: React.FC = () => {
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

      <PracticeSelector />
    </div>
  )
}
