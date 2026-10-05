import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DevelopmentResourceEditor } from '@/components/DevelopmentResourceEditor'
import { PracticeSelector } from '@/components/PracticeSelector'
export function CerLibrary({ isDemo }: { isDemo: boolean }) {
  return (
    <Tabs defaultValue="educativo">
      <TabsList aria-label="Biblioteca">
        <TabsTrigger value="educativo">Desenvolvimento</TabsTrigger>
        <TabsTrigger value="clinico">Cuidado individual</TabsTrigger>
      </TabsList>
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
