import { buildCerMapReadings } from './cerMapReadings'
import { buildConscienciaQaFixture } from './conscienciaQaFixture'

export function createDemoCerMapReading(enrollmentId = 'demo-enr-01') {
  const snapshot = buildCerMapReadings(
    buildConscienciaQaFixture(enrollmentId).responses,
    enrollmentId,
    'Mariana',
  )
  return {
    ...snapshot,
    overview: 'DADOS FICTÍCIOS — demonstração do Mapa CER interativo. ' + snapshot.overview,
  }
}
