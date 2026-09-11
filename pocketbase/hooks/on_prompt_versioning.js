// Hook server-side para versionamento imutável de prompts e momentos metodológicos
// Quando um prompt é alterado ou criado com nova versão, preserva o snapshot histórico
// em cer_prompt_versions de forma que nenhuma versão antiga desapareça.

onRecordCreate((e) => {
  const record = e.record

  // Validação metodológica e de orquestração no save/criação do prompt (Build 07A)
  let schema = record.get('schema_config')
  if (typeof schema === 'string') {
    try {
      schema = JSON.parse(schema)
    } catch (_) {
      schema = {}
    }
  } else if (!schema || typeof schema !== 'object') {
    schema = {}
  }

  // 1. Validação de open_first
  if (schema.open_first && schema.open_first.enabled) {
    if (
      !schema.open_first.option_set_ref ||
      String(schema.open_first.option_set_ref).trim() === ''
    ) {
      throw new BadRequestError(
        'Configuração open_first inválida: option_set_ref é obrigatória quando enabled=true.',
      )
    }
  }

  // 2. Validação de access_destination participant-facing
  if (schema.access_destination) {
    const allowedDestinations = ['participant_private', 'participant_shared', 'shared_care']
    if (!allowedDestinations.includes(schema.access_destination)) {
      throw new BadRequestError(
        'access_destination inválido para prompt participant-facing: ' +
          schema.access_destination +
          '. Permitido apenas: participant_private, participant_shared, shared_care.',
      )
    }
  }

  // 3. Validação de grafo e integridade na experiência (se fornecido orchestration)
  const expId = record.getString('experience_id')
  if (expId) {
    let expPrompts = []
    try {
      expPrompts = $app.findRecordsByFilter(
        'cer_prompts',
        'experience_id = "' + expId + '"',
        'step_order',
        100,
        0,
      )
    } catch (_) {}

    // Montar mapa incluindo o novo prompt
    const promptList = []
    for (let i = 0; i < expPrompts.length; i++) {
      let pSchema = expPrompts[i].get('schema_config')
      if (typeof pSchema === 'string') {
        try {
          pSchema = JSON.parse(pSchema)
        } catch (_) {
          pSchema = {}
        }
      }
      promptList.push({
        id: expPrompts[i].id,
        key: (pSchema && pSchema.prompt_key) || expPrompts[i].id,
        schema: pSchema || {},
      })
    }
    const currentKey = schema.prompt_key || record.id || 'new_prompt'
    promptList.push({ id: record.id || 'new_prompt', key: currentKey, schema: schema })

    // Checar duplicação de prompt_key se fornecido
    if (schema.prompt_key) {
      const dups = promptList.filter(function (p) {
        return p.key === schema.prompt_key
      })
      if (dups.length > 1) {
        throw new BadRequestError('prompt_key duplicado na mesma experiência: ' + schema.prompt_key)
      }
    }

    // Se possui orquestração declarada, validar destinos e ausência de ciclo
    if (schema.orchestration) {
      const knownKeys = promptList.map(function (p) {
        return p.key
      })
      const routes = schema.orchestration.routes || []
      for (let r = 0; r < routes.length; r++) {
        const route = routes[r]
        if (route.then && route.then.target_prompt_key) {
          if (knownKeys.indexOf(route.then.target_prompt_key) === -1) {
            throw new BadRequestError(
              'target_prompt_key inexistente na mesma experiência: ' + route.then.target_prompt_key,
            )
          }
        }
      }
      if (schema.orchestration.fallback && schema.orchestration.fallback.target_prompt_key) {
        if (knownKeys.indexOf(schema.orchestration.fallback.target_prompt_key) === -1) {
          throw new BadRequestError(
            'fallback irresolvível: target_prompt_key inexistente na mesma experiência: ' +
              schema.orchestration.fallback.target_prompt_key,
          )
        }
      }

      // Validação de ciclo (DFS)
      const adj = {}
      for (let i = 0; i < promptList.length; i++) {
        const pk = promptList[i].key
        adj[pk] = []
        const orch = promptList[i].schema && promptList[i].schema.orchestration
        if (orch) {
          const rts = orch.routes || []
          for (let j = 0; j < rts.length; j++) {
            if (rts[j].then && rts[j].then.target_prompt_key) {
              adj[pk].push(rts[j].then.target_prompt_key)
            }
          }
          if (orch.fallback && orch.fallback.target_prompt_key) {
            adj[pk].push(orch.fallback.target_prompt_key)
          }
        }
      }

      const visited = {}
      const recStack = {}
      function hasCycle(node) {
        visited[node] = true
        recStack[node] = true
        const neighbors = adj[node] || []
        for (let k = 0; k < neighbors.length; k++) {
          const nextNode = neighbors[k]
          if (!visited[nextNode]) {
            if (hasCycle(nextNode)) return true
          } else if (recStack[nextNode]) {
            return true
          }
        }
        recStack[node] = false
        return false
      }

      for (let nodeKey in adj) {
        if (!visited[nodeKey]) {
          if (hasCycle(nodeKey)) {
            throw new BadRequestError('Loop detectado no grafo de orquestração da experiência.')
          }
        }
      }
    }
  }

  e.next()
}, 'cer_prompts')

onRecordUpdate((e) => {
  const record = e.record
  const orig = record.original()

  // Validação metodológica e de orquestração no update do prompt (Build 07A)
  let schema = record.get('schema_config')
  if (typeof schema === 'string') {
    try {
      schema = JSON.parse(schema)
    } catch (_) {
      schema = {}
    }
  } else if (!schema || typeof schema !== 'object') {
    schema = {}
  }

  // 1. Validação de open_first
  if (schema.open_first && schema.open_first.enabled) {
    if (
      !schema.open_first.option_set_ref ||
      String(schema.open_first.option_set_ref).trim() === ''
    ) {
      throw new BadRequestError(
        'Configuração open_first inválida: option_set_ref é obrigatória quando enabled=true.',
      )
    }
  }

  // 2. Validação de access_destination participant-facing
  if (schema.access_destination) {
    const allowedDestinations = ['participant_private', 'participant_shared', 'shared_care']
    if (!allowedDestinations.includes(schema.access_destination)) {
      throw new BadRequestError(
        'access_destination inválido para prompt participant-facing: ' +
          schema.access_destination +
          '. Permitido apenas: participant_private, participant_shared, shared_care.',
      )
    }
  }

  // 3. Validação de grafo e integridade na experiência
  const expId = record.getString('experience_id') || (orig ? orig.getString('experience_id') : '')
  if (expId) {
    let expPrompts = []
    try {
      expPrompts = $app.findRecordsByFilter(
        'cer_prompts',
        'experience_id = "' + expId + '"',
        'step_order',
        100,
        0,
      )
    } catch (_) {}

    const promptList = []
    for (let i = 0; i < expPrompts.length; i++) {
      if (expPrompts[i].id === record.id) continue // substituir pelo atual
      let pSchema = expPrompts[i].get('schema_config')
      if (typeof pSchema === 'string') {
        try {
          pSchema = JSON.parse(pSchema)
        } catch (_) {
          pSchema = {}
        }
      }
      promptList.push({
        id: expPrompts[i].id,
        key: (pSchema && pSchema.prompt_key) || expPrompts[i].id,
        schema: pSchema || {},
      })
    }
    const currentKey = schema.prompt_key || record.id
    promptList.push({ id: record.id, key: currentKey, schema: schema })

    if (schema.prompt_key) {
      const dups = promptList.filter(function (p) {
        return p.key === schema.prompt_key
      })
      if (dups.length > 1) {
        throw new BadRequestError('prompt_key duplicado na mesma experiência: ' + schema.prompt_key)
      }
    }

    if (schema.orchestration) {
      const knownKeys = promptList.map(function (p) {
        return p.key
      })
      const routes = schema.orchestration.routes || []
      for (let r = 0; r < routes.length; r++) {
        const route = routes[r]
        if (route.then && route.then.target_prompt_key) {
          if (knownKeys.indexOf(route.then.target_prompt_key) === -1) {
            throw new BadRequestError(
              'target_prompt_key inexistente na mesma experiência: ' + route.then.target_prompt_key,
            )
          }
        }
      }
      if (schema.orchestration.fallback && schema.orchestration.fallback.target_prompt_key) {
        if (knownKeys.indexOf(schema.orchestration.fallback.target_prompt_key) === -1) {
          throw new BadRequestError(
            'fallback irresolvível: target_prompt_key inexistente na mesma experiência: ' +
              schema.orchestration.fallback.target_prompt_key,
          )
        }
      }

      // Validação de ciclo (DFS)
      const adj = {}
      for (let i = 0; i < promptList.length; i++) {
        const pk = promptList[i].key
        adj[pk] = []
        const orch = promptList[i].schema && promptList[i].schema.orchestration
        if (orch) {
          const rts = orch.routes || []
          for (let j = 0; j < rts.length; j++) {
            if (rts[j].then && rts[j].then.target_prompt_key) {
              adj[pk].push(rts[j].then.target_prompt_key)
            }
          }
          if (orch.fallback && orch.fallback.target_prompt_key) {
            adj[pk].push(orch.fallback.target_prompt_key)
          }
        }
      }

      const visited = {}
      const recStack = {}
      function hasCycle(node) {
        visited[node] = true
        recStack[node] = true
        const neighbors = adj[node] || []
        for (let k = 0; k < neighbors.length; k++) {
          const nextNode = neighbors[k]
          if (!visited[nextNode]) {
            if (hasCycle(nextNode)) return true
          } else if (recStack[nextNode]) {
            return true
          }
        }
        recStack[node] = false
        return false
      }

      for (let nodeKey in adj) {
        if (!visited[nodeKey]) {
          if (hasCycle(nodeKey)) {
            throw new BadRequestError('Loop detectado no grafo de orquestração da experiência.')
          }
        }
      }
    }
  }

  if (orig) {
    const origVer = orig.getInt('version') || 1
    const newVer = record.getInt('version') || origVer

    let origData = orig
    try {
      origData = $app.findFirstRecordByData('cer_prompts', 'id', record.id)
    } catch (_) {}

    const textChanged =
      (origData ? origData.getString('prompt_text') : orig.getString('prompt_text')) !==
      record.getString('prompt_text')
    const schemaChanged =
      JSON.stringify(origData ? origData.get('schema_config') : orig.get('schema_config')) !==
      JSON.stringify(record.get('schema_config'))
    const typeChanged =
      (origData ? origData.getString('component_type') : orig.getString('component_type')) !==
      record.getString('component_type')

    if (textChanged || schemaChanged || typeChanged || newVer > origVer) {
      if (newVer <= origVer) {
        record.set('version', origVer + 1)
      }

      try {
        const versionsCol = $app.findCollectionByNameOrId('cer_prompt_versions')
        const pvRec = new Record(versionsCol)
        pvRec.set('prompt_id', record.id)
        pvRec.set(
          'moment_id',
          (origData ? origData.getString('moment_id') : '') ||
            orig.getString('moment_id') ||
            record.getString('moment_id'),
        )
        pvRec.set('version_number', origVer)
        pvRec.set(
          'prompt_type',
          (origData ? origData.getString('component_type') : '') ||
            orig.getString('component_type') ||
            record.getString('component_type'),
        )
        pvRec.set(
          'prompt_text',
          (origData ? origData.getString('prompt_text') : '') || orig.getString('prompt_text'),
        )
        pvRec.set(
          'helper_text',
          (origData ? origData.getString('helper_text') : '') || orig.getString('helper_text'),
        )
        pvRec.set(
          'schema_config',
          origData ? origData.get('schema_config') : orig.get('schema_config'),
        )
        pvRec.set(
          'is_required',
          origData ? origData.getBool('is_required') : orig.getBool('is_required'),
        )
        pvRec.set('change_reason', 'Snapshot metodológico histórico pré-edição')
        $app.save(pvRec)
      } catch (err) {
        // não bloqueia se já existir versão correspondente
      }
    }
  }

  e.next()
}, 'cer_prompts')

onRecordAfterCreateSuccess((e) => {
  e.next()

  try {
    const record = e.record
    const versionsCol = $app.findCollectionByNameOrId('cer_prompt_versions')

    // Verificar se já tem versão gravada
    let existingV = null
    try {
      const list = $app.findRecordsByFilter(
        'cer_prompt_versions',
        'prompt_id = "' + record.id + '" && version_number = ' + (record.getInt('version') || 1),
        '',
        1,
        0,
      )
      if (list && list.length > 0) existingV = list[0]
    } catch (_) {}

    if (!existingV) {
      const pvRec = new Record(versionsCol)
      pvRec.set('prompt_id', record.id)
      pvRec.set('moment_id', record.getString('moment_id'))
      pvRec.set('version_number', record.getInt('version') || 1)
      pvRec.set('prompt_type', record.getString('component_type'))
      pvRec.set('prompt_text', record.getString('prompt_text'))
      pvRec.set('helper_text', record.getString('helper_text'))
      pvRec.set('schema_config', record.get('schema_config'))
      pvRec.set('is_required', record.getBool('is_required'))
      pvRec.set('change_reason', 'Criação inicial do prompt')
      $app.save(pvRec)
    }
  } catch (_) {}
}, 'cer_prompts')
