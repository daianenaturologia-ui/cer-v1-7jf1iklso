import { buildCerMapReadings } from './cerMapReadings'
import { buildConscienciaQaFixture } from './conscienciaQaFixture'
import type { CerMapReadingSnapshot } from '@/types/cerMapReadings'

export function createDemoCerMapReading(enrollmentId = 'demo-enr-01'): CerMapReadingSnapshot {
  const snapshot = buildCerMapReadings(
    buildConscienciaQaFixture(enrollmentId).responses,
    enrollmentId,
    'Mariana',
  )

  const dimensions = snapshot.dimensions.map((dim) => {
    if (dim.id === 'corpo') {
      const doshaRows = [
        { label: 'Vata percentual', text: '45%' },
        { label: 'Pitta percentual', text: '35%' },
        { label: 'Kapha percentual', text: '20%' },
      ]
      return {
        ...dim,
        summaryRows: [...doshaRows, ...dim.summaryRows],
        detailedRows: [...doshaRows, ...dim.detailedRows],
      }
    }

    if (dim.id === 'mente') {
      // 10 comportamentos canônicos com categorias variadas da escala ordinal existente
      const behaviorRows = [
        {
          label: 'insistente',
          text: 'Repete-se com frequência',
          sourcePromptKey: 'movimentos_automaticos_frequencia_p1',
        },
        {
          label: 'prestativo',
          text: 'Aparece com muita força quando estou sob pressão',
          sourcePromptKey: 'movimentos_automaticos_frequencia_p1',
        },
        {
          label: 'hiper_realizador',
          text: 'Aparece em algumas situações',
          sourcePromptKey: 'movimentos_automaticos_frequencia_p1',
        },
        {
          label: 'vitima',
          text: 'Quase nunca acontece comigo',
          sourcePromptKey: 'movimentos_automaticos_frequencia_p1',
        },
        {
          label: 'hiper_racional',
          text: 'Repete-se com frequência',
          sourcePromptKey: 'movimentos_automaticos_frequencia_p1',
        },
        {
          label: 'hipervigilante',
          text: 'Aparece com muita força quando estou sob pressão',
          sourcePromptKey: 'movimentos_automaticos_frequencia_p2',
        },
        {
          label: 'inquieto',
          text: 'Aparece em algumas situações',
          sourcePromptKey: 'movimentos_automaticos_frequencia_p2',
        },
        {
          label: 'comandante',
          text: 'Quase nunca acontece comigo',
          sourcePromptKey: 'movimentos_automaticos_frequencia_p2',
        },
        {
          label: 'evitativo',
          text: 'Ainda não sei dizer',
          sourcePromptKey: 'movimentos_automaticos_frequencia_p2',
        },
        {
          label: 'critico',
          text: 'Repete-se com frequência',
          sourcePromptKey: 'movimentos_automaticos_frequencia_p2',
        },
      ]
      return {
        ...dim,
        detailedRows: [...behaviorRows, ...dim.detailedRows],
      }
    }

    if (dim.id === 'regulacao') {
      // Reação destacada no percurso: luta ("resolver_imediatamente" / "Luta")
      const regulationRows = [
        {
          label: 'Resposta de tendência frente à sobrecarga',
          text: 'Luta: Tentar resolver e controlar imediatamente; falar firme, agir rápido.',
          sourcePromptKey: 'resposta_tendencia',
        },
      ]
      return {
        ...dim,
        detailedRows: [...regulationRows, ...dim.detailedRows],
      }
    }

    return dim
  })

  return {
    ...snapshot,
    overview: 'DADOS FICTÍCIOS — demonstração do Mapa CER interativo. ' + snapshot.overview,
    dimensions,
  }
}
