export interface CerProtectionPatternDefinition {
  id: string
  canonicalKey: string
  baseName: string
  movementDescription: string
  genderVariants: {
    feminino: string
    masculino: string
    neutro: string
  }
}

export const CER_PROTECTION_PATTERNS: Record<string, CerProtectionPatternDefinition> = {
  insistente: {
    id: 'insistente',
    canonicalKey: 'insistente',
    baseName: 'Insistente',
    movementDescription: 'Buscar fazer tudo do jeito certo',
    genderVariants: {
      feminino: 'Insistente',
      masculino: 'Insistente',
      neutro: 'Insistente',
    },
  },
  prestativo: {
    id: 'prestativo',
    canonicalKey: 'prestativo',
    baseName: 'Prestativo',
    movementDescription: 'Cuidar das pessoas e deixar as próprias necessidades para depois',
    genderVariants: {
      feminino: 'Prestativa',
      masculino: 'Prestativo',
      neutro: 'padrão Prestativo',
    },
  },
  hiper_realizador: {
    id: 'hiper_realizador',
    canonicalKey: 'hiper_realizador',
    baseName: 'Hiper-realizador',
    movementDescription: 'Buscar valor por meio da produtividade e das conquistas',
    genderVariants: {
      feminino: 'Hiper-realizadora',
      masculino: 'Hiper-realizador',
      neutro: 'padrão Hiper-realizador',
    },
  },
  vitima: {
    id: 'vitima',
    canonicalKey: 'vitima',
    baseName: 'Vítima',
    movementDescription: 'Perder o senso de escolha ou potência diante das dificuldades',
    genderVariants: {
      feminino: 'Vítima',
      masculino: 'Vítima',
      neutro: 'Vítima',
    },
  },
  hiper_racional: {
    id: 'hiper_racional',
    canonicalKey: 'hiper_racional',
    baseName: 'Hiper-racional',
    movementDescription: 'Compreender e resolver tudo principalmente pela razão',
    genderVariants: {
      feminino: 'Hiper-racional',
      masculino: 'Hiper-racional',
      neutro: 'Hiper-racional',
    },
  },
  hipervigilante: {
    id: 'hipervigilante',
    canonicalKey: 'hipervigilante',
    baseName: 'Hipervigilante',
    movementDescription: 'Antecipar constantemente o que pode dar errado',
    genderVariants: {
      feminino: 'Hipervigilante',
      masculino: 'Hipervigilante',
      neutro: 'Hipervigilante',
    },
  },
  inquieto: {
    id: 'inquieto',
    canonicalKey: 'inquieto',
    baseName: 'Inquieto',
    movementDescription: 'Manter-se ocupado, mudar de foco ou buscar estímulos',
    genderVariants: {
      feminino: 'Inquieta',
      masculino: 'Inquieto',
      neutro: 'padrão Inquieto',
    },
  },
  comandante: {
    id: 'comandante',
    canonicalKey: 'comandante',
    baseName: 'Comandante',
    movementDescription: 'Assumir o controle para reduzir incerteza ou vulnerabilidade',
    genderVariants: {
      feminino: 'Comandante',
      masculino: 'Comandante',
      neutro: 'Comandante',
    },
  },
  evitativo: {
    id: 'evitativo',
    canonicalKey: 'evitativo',
    baseName: 'Evitativo',
    movementDescription: 'Evitar desconfortos, conflitos, decisões ou emoções difíceis',
    genderVariants: {
      feminino: 'Evitativa',
      masculino: 'Evitativo',
      neutro: 'padrão Evitativo',
    },
  },
  critico: {
    id: 'critico',
    canonicalKey: 'critico',
    baseName: 'Crítico',
    movementDescription: 'Perceber falhas e cobrar correções de si, dos outros ou das situações',
    genderVariants: {
      feminino: 'Crítica',
      masculino: 'Crítico',
      neutro: 'padrão Crítico',
    },
  },
  // Mapeamentos pelos IDs reais dos cartões em build07cPrompts.ts
  cartao_1_fazer_certo: {
    id: 'cartao_1_fazer_certo',
    canonicalKey: 'insistente',
    baseName: 'Insistente',
    movementDescription: 'Buscar fazer tudo do jeito certo',
    genderVariants: {
      feminino: 'Insistente',
      masculino: 'Insistente',
      neutro: 'Insistente',
    },
  },
  cartao_2_cuidar_pessoas: {
    id: 'cartao_2_cuidar_pessoas',
    canonicalKey: 'prestativo',
    baseName: 'Prestativo',
    movementDescription: 'Cuidar das pessoas e deixar as próprias necessidades para depois',
    genderVariants: {
      feminino: 'Prestativa',
      masculino: 'Prestativo',
      neutro: 'padrão Prestativo',
    },
  },
  cartao_3_produtividade_conquistas: {
    id: 'cartao_3_produtividade_conquistas',
    canonicalKey: 'hiper_realizador',
    baseName: 'Hiper-realizador',
    movementDescription: 'Buscar valor por meio da produtividade e das conquistas',
    genderVariants: {
      feminino: 'Hiper-realizadora',
      masculino: 'Hiper-realizador',
      neutro: 'padrão Hiper-realizador',
    },
  },
  cartao_4_perder_sensacao_escolha: {
    id: 'cartao_4_perder_sensacao_escolha',
    canonicalKey: 'vitima',
    baseName: 'Vítima',
    movementDescription: 'Perder o senso de escolha ou potência diante das dificuldades',
    genderVariants: {
      feminino: 'Vítima',
      masculino: 'Vítima',
      neutro: 'Vítima',
    },
  },
  cartao_5_compreender_pela_razao: {
    id: 'cartao_5_compreender_pela_razao',
    canonicalKey: 'hiper_racional',
    baseName: 'Hiper-racional',
    movementDescription: 'Compreender e resolver tudo principalmente pela razão',
    genderVariants: {
      feminino: 'Hiper-racional',
      masculino: 'Hiper-racional',
      neutro: 'Hiper-racional',
    },
  },
  cartao_6_antecipar_riscos: {
    id: 'cartao_6_antecipar_riscos',
    canonicalKey: 'hipervigilante',
    baseName: 'Hipervigilante',
    movementDescription: 'Antecipar constantemente o que pode dar errado',
    genderVariants: {
      feminino: 'Hipervigilante',
      masculino: 'Hipervigilante',
      neutro: 'Hipervigilante',
    },
  },
  cartao_7_novos_estimulos: {
    id: 'cartao_7_novos_estimulos',
    canonicalKey: 'inquieto',
    baseName: 'Inquieto',
    movementDescription: 'Manter-se ocupado, mudar de foco ou buscar estímulos',
    genderVariants: {
      feminino: 'Inquieta',
      masculino: 'Inquieto',
      neutro: 'padrão Inquieto',
    },
  },
  cartao_8_assumir_controle: {
    id: 'cartao_8_assumir_controle',
    canonicalKey: 'comandante',
    baseName: 'Comandante',
    movementDescription: 'Assumir o controle para reduzir incerteza ou vulnerabilidade',
    genderVariants: {
      feminino: 'Comandante',
      masculino: 'Comandante',
      neutro: 'Comandante',
    },
  },
  cartao_9_evitar_desconfortos: {
    id: 'cartao_9_evitar_desconfortos',
    canonicalKey: 'evitativo',
    baseName: 'Evitativo',
    movementDescription: 'Evitar desconfortos, conflitos, decisões ou emoções difíceis',
    genderVariants: {
      feminino: 'Evitativa',
      masculino: 'Evitativo',
      neutro: 'padrão Evitativo',
    },
  },
  cartao_10_cobrar_e_criticar: {
    id: 'cartao_10_cobrar_e_criticar',
    canonicalKey: 'critico',
    baseName: 'Crítico',
    movementDescription: 'Perceber falhas e cobrar correções de si, dos outros ou das situações',
    genderVariants: {
      feminino: 'Crítica',
      masculino: 'Crítico',
      neutro: 'padrão Crítico',
    },
  },
}

export function patternLabel(
  id: string,
  treatment: 'feminino' | 'masculino' | 'neutro' | 'outro',
): string {
  const pattern = CER_PROTECTION_PATTERNS[id]
  if (!pattern) return id

  if (treatment === 'feminino') {
    return pattern.genderVariants.feminino
  }
  if (treatment === 'masculino') {
    return pattern.genderVariants.masculino
  }
  return pattern.genderVariants.neutro
}
