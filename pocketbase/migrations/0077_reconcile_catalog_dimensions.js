// Repair already-installed catalog relations without changing response IDs or content.
migrate(
  (app) => {
    const codes = {
      corpo_fisiologia_ayurveda: 'corpo_fisiologia',
      mente_emocoes_cer: 'mente_emocoes',
      regulacao_respostas_cer: 'regulacao_respostas',
      relacoes_cer: 'relacoes',
      sexualidade_cer: 'sexualidade',
      sentido_conexao_cer: 'sentido_conexao',
      integracao_consciencia_cer: 'integracao_consciencia',
    }
    for (const code in codes) {
      // Some installations do not ship the optional transversal experience.
      let experience
      try {
        experience = app.findFirstRecordByData('cer_experiences', 'code', code)
      } catch (_) {
        continue
      }
      const dimension = app.findFirstRecordByData('cer_dimensions', 'code', codes[code])
      if (experience.getString('dimension_id') !== dimension.id) {
        experience.set('dimension_id', dimension.id)
        app.save(experience)
      }
    }
  },
  () => {
    // Retain valid references; undoing them could orphan existing responses.
  },
)
