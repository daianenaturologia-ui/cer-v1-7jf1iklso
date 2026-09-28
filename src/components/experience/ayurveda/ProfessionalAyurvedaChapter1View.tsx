import React from 'react'
import {
  ProfessionalAyurvedaCorpoFisiologiaView,
  ProfessionalAyurvedaCorpoFisiologiaViewProps,
} from './ProfessionalAyurvedaCorpoFisiologiaView'

export type { ProfessionalAyurvedaCorpoFisiologiaViewProps as ProfessionalAyurvedaChapter1ViewProps }

/**
 * Reexportação retrocompatível e unificada do M4A.
 * Mantém total suporte a testes e imports existentes de ProfessionalAyurvedaChapter1View,
 * integrando os Capítulos 1 e 2 de Corpo & Fisiologia em uma única visão factual profissional.
 */
export const ProfessionalAyurvedaChapter1View: React.FC<
  ProfessionalAyurvedaCorpoFisiologiaViewProps
> = (props) => {
  return <ProfessionalAyurvedaCorpoFisiologiaView {...props} />
}

export default ProfessionalAyurvedaChapter1View
