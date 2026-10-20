import { CerPracticeLibrary } from './CerPracticeLibrary'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DevelopmentResourceEditor } from '@/components/DevelopmentResourceEditor'
import { PracticeSelector } from '@/components/PracticeSelector'
export function CerLibrary({ isDemo }: { isDemo: boolean }) {
  return (
    <Tabs defaultValue="explorar">
      <TabsList aria-label="Biblioteca">
        <TabsTrigger value="explorar">Explorar a Biblioteca</TabsTrigger>
        <TabsTrigger value="educativo">Gerenciar conteúdos</TabsTrigger>
        <TabsTrigger value="clinico">Cuidado individual</TabsTrigger>
      </TabsList>
      <TabsContent value="explorar">
        <CerPracticeLibrary />
      </TabsContent>
      <TabsContent value="educativo">
        <DevelopmentResourceEditor />
      </TabsContent>
      <TabsContent value="clinico">
        {isDemo ? (
          <p className="text-sm text-muted-foreground p-4">
            Na demonstração, combine práticas fictícias dentro do acompanhamento de Mariana.
          </p>
        ) : (
          <PracticeSelector />
        )}
      </TabsContent>
    </Tabs>
  )
}
