// Hook server-side do Build 06: Lifecycle e Versioning de cer_maps
//
// Regras e Decisões Congeladas:
// 1. Estados permitidos: draft -> published, draft -> discarded, published -> superseded.
//    Nenhuma outra transição. discarded e superseded são estados terminais.
// 2. Transições executadas SOMENTE por profissional humano autorizado:
//    - authenticated principal
//    - person_id humano vinculado a registro real em 'persons'
//    - role ativo 'profissional' em user_roles
//    - vínculo ativo em professional_enrollment_access para o enrollment
//    - AI / system / participant NUNCA publicam e NUNCA descartam.
// 3. No publish de V(n):
//    - Validar gate epistêmico completo de todos os items e sources do mapa.
//    - Atomicidade via transação ($app.runInTransaction):
//      * marcar qualquer mapa com status='published' do mesmo enrollment como 'superseded'
//      * publicar V(n) com status='published', carimbando published_at e published_by_user_id
//      * garantir que NUNCA existam dois published para o mesmo enrollment
// 4. version_number monotônico crescente por enrollment:
//    - draft novo deve ter version_number = (max existing version_number do enrollment) + 1
// 5. Imutabilidade pós-publicação / descarte:
//    - cer_maps com status 'superseded' ou 'discarded' não podem sofrer qualquer alteração
//    - cer_maps com status 'published' só pode transitar para 'superseded'
// 6. DELETE físico proibido para todos (inclusive superuser / profissional).
// 7. Auditoria mínima e técnica (MAP_CREATED, MAP_PUBLISHED, MAP_SUPERSEDED, MAP_DRAFT_DISCARDED).

onRecordCreate((e) => {
  const map = e.record
  const enrollmentId = map.getString('enrollment_id')
  const status = map.getString('status') || 'draft'
  const verNum = map.getInt('version_number')

  // Preencher created_by_user_id se ausente e vier de e.auth
  if (!map.getString('created_by_user_id') && e.auth) {
    map.set('created_by_user_id', e.auth.id)
  }

  // 1. Validar enrollment existente
  let enrollment = null
  try {
    enrollment = $app.findFirstRecordByData('enrollments', 'id', enrollmentId)
  } catch (_) {
    throw new BadRequestError('enrollment_id inválido ou inexistente.')
  }

  // 2. Somente draft pode ser criado diretamente
  if (status !== 'draft') {
    throw new BadRequestError('Um novo Mapa CER só pode ser criado no estado "draft".')
  }

  // 3. Validar autorização do profissional criador
  if (e.auth) {
    const authId = e.auth.id

    // Verificar se não é o próprio participante
    const personId = enrollment.getString('person_id')
    if (personId) {
      try {
        const pUser = $app.findFirstRecordByData('users', 'person_id', personId)
        if (pUser.id === authId) {
          throw new BadRequestError('Participante não tem permissão para criar Mapa CER.')
        }
      } catch (_) {}
    }

    // Verificar vínculo profissional ativo
    let isProfLinked = false
    try {
      const links = $app.findRecordsByFilter(
        'professional_enrollment_access',
        'enrollment_id = "' +
          enrollmentId +
          '" && professional_user_id = "' +
          authId +
          '" && is_active = true',
        '',
        1,
        0,
      )
      if (links && links.length > 0) {
        isProfLinked = true
      }
    } catch (_) {}

    if (!isProfLinked) {
      throw new BadRequestError('Profissional sem vínculo ativo para o enrollment.')
    }

    // Gate estrutural humano: person_id + user_roles profissional
    const authPersonId = e.auth.getString('person_id')
    if (!authPersonId) {
      throw new BadRequestError('Contas de sistema ou automações não podem criar Mapa CER.')
    }
    try {
      const pRecord = $app.findFirstRecordByData('persons', 'id', authPersonId)
      if (!pRecord || !pRecord.getString('full_name')) {
        throw new BadRequestError('Principal deve corresponder a uma pessoa humana cadastrada.')
      }
    } catch (_) {
      throw new BadRequestError('Pessoa humana vinculada ao principal não foi encontrada.')
    }

    let hasProfRole = false
    try {
      const roles = $app.findRecordsByFilter(
        'user_roles',
        'user_id = "' + authId + '" && is_active = true',
        '',
        10,
        0,
      )
      hasProfRole = roles.some((r) => r.getString('role') === 'profissional')
    } catch (_) {}

    if (!hasProfRole) {
      throw new BadRequestError('Somente profissionais humanos autorizados podem criar Mapa CER.')
    }
  }

  // 4. Validar version_number monotônico crescente
  let maxVer = 0
  try {
    const existingMaps = $app.findRecordsByFilter(
      'cer_maps',
      'enrollment_id = "' + enrollmentId + '"',
      '-version_number',
      1,
      0,
    )
    if (existingMaps && existingMaps.length > 0) {
      maxVer = existingMaps[0].getInt('version_number') || 0
    }
  } catch (_) {}

  const expectedVer = maxVer + 1
  if (!verNum) {
    map.set('version_number', expectedVer)
  } else if (verNum !== expectedVer) {
    throw new BadRequestError(
      'version_number inválido: próximo número de versão para este enrollment é ' +
        expectedVer +
        ' (informado: ' +
        verNum +
        ').',
    )
  }

  // Verificar se já não existe outro draft aberto para o mesmo enrollment
  try {
    const openDrafts = $app.findRecordsByFilter(
      'cer_maps',
      'enrollment_id = "' + enrollmentId + '" && status = "draft"',
      '',
      1,
      0,
    )
    if (openDrafts && openDrafts.length > 0) {
      throw new BadRequestError(
        'Já existe um rascunho (draft) em aberto para este enrollment. Finalize ou descarte o draft existente antes de criar um novo.',
      )
    }
  } catch (errDraft) {
    if (errDraft.message && errDraft.message.indexOf('Já existe um rascunho') !== -1) {
      throw errDraft
    }
  }

  e.next()
}, 'cer_maps')

onRecordAfterCreateSuccess((e) => {
  e.next()
  try {
    const map = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const creatorId = map.getString('created_by_user_id') || (e.auth ? e.auth.id : '')
    if (creatorId) {
      audit.set('actor_user_id', creatorId)
    }
    audit.set('action', 'MAP_CREATED')
    audit.set('resource_type', 'cer_maps')
    audit.set('resource_id', map.id)
    audit.set('enrollment_id', map.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_map_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        map_id: map.id,
        version_number: map.getInt('version_number'),
        status: map.getString('status'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_maps')

onRecordUpdate((e) => {
  const map = e.record
  const orig = map.original()
  if (!orig) {
    e.next()
    return
  }

  const origStatus = orig.getString('status')
  const newStatus = map.getString('status')
  const enrollmentId = orig.getString('enrollment_id')

  // Não permitir mudar enrollment_id, version_number ou created_by_user_id
  if (map.getString('enrollment_id') !== orig.getString('enrollment_id')) {
    throw new BadRequestError('enrollment_id é imutável no Mapa CER.')
  }
  if (map.getInt('version_number') !== orig.getInt('version_number')) {
    throw new BadRequestError('version_number é imutável no Mapa CER.')
  }
  if (map.getString('created_by_user_id') !== orig.getString('created_by_user_id')) {
    throw new BadRequestError('created_by_user_id é imutável no Mapa CER.')
  }

  // 1. Estados terminais: discarded e superseded são IMUTÁVEIS
  if (origStatus === 'discarded') {
    throw new BadRequestError('Um Mapa CER descartado não pode ser modificado nem reativado.')
  }
  if (origStatus === 'superseded') {
    throw new BadRequestError('Um Mapa CER substituído (superseded) é histórico e imutável.')
  }

  // 2. Se já estava 'published':
  if (origStatus === 'published') {
    // published só pode sofrer transição para 'superseded'
    if (newStatus !== 'published' && newStatus !== 'superseded') {
      throw new BadRequestError(
        'Um Mapa CER publicado só pode transitar para o estado "superseded".',
      )
    }
    if (newStatus === 'published') {
      // Nenhum campo do published pode ser alterado
      if (map.getString('published_at') !== orig.getString('published_at')) {
        throw new BadRequestError('published_at é imutável após a publicação.')
      }
      if (map.getString('published_by_user_id') !== orig.getString('published_by_user_id')) {
        throw new BadRequestError('published_by_user_id é imutável após a publicação.')
      }
    }
  }

  // 3. Se estava 'draft':
  if (origStatus === 'draft') {
    // Transições permitidas: draft -> draft, draft -> published, draft -> discarded
    if (newStatus !== 'draft' && newStatus !== 'published' && newStatus !== 'discarded') {
      throw new BadRequestError('Transição inválida para draft do Mapa CER: "' + newStatus + '".')
    }

    // Se estiver transitando de estado (para published ou discarded):
    if (newStatus === 'published' || newStatus === 'discarded') {
      // Exige profissional humano autenticado com gate estrutural Build 05
      if (!e.auth) {
        throw new BadRequestError('Transição de status exige profissional humano autenticado.')
      }

      const authId = e.auth.id
      const authPersonId = e.auth.getString('person_id')
      if (!authPersonId) {
        throw new BadRequestError(
          'Contas de sistema ou automações sem person_id não podem alterar status do Mapa CER.',
        )
      }
      try {
        const pRecord = $app.findFirstRecordByData('persons', 'id', authPersonId)
        if (!pRecord || !pRecord.getString('full_name')) {
          throw new BadRequestError(
            'Principal deve corresponder a uma pessoa humana física cadastrada.',
          )
        }
      } catch (_) {
        throw new BadRequestError('Pessoa humana vinculada ao principal não foi encontrada.')
      }

      // Vínculo profissional ativo
      let isProfLinked = false
      try {
        const links = $app.findRecordsByFilter(
          'professional_enrollment_access',
          'enrollment_id = "' +
            enrollmentId +
            '" && professional_user_id = "' +
            authId +
            '" && is_active = true',
          '',
          1,
          0,
        )
        if (links && links.length > 0) {
          isProfLinked = true
        }
      } catch (_) {}

      if (!isProfLinked) {
        throw new BadRequestError('Profissional sem vínculo ativo para o enrollment deste mapa.')
      }

      // Role profissional ativo
      let hasProfRole = false
      try {
        const roles = $app.findRecordsByFilter(
          'user_roles',
          'user_id = "' + authId + '" && is_active = true',
          '',
          10,
          0,
        )
        hasProfRole = roles.some((r) => r.getString('role') === 'profissional')
      } catch (_) {}

      if (!hasProfRole) {
        throw new BadRequestError(
          'Transição de status exige profissional autorizado com role profissional ativo.',
        )
      }

      // Se for transição para 'published':
      if (newStatus === 'published') {
        // Validação completa dos items e sources do mapa antes de autorizar o publish
        const items = $app.findRecordsByFilter(
          'cer_map_items',
          'map_id = "' + map.id + '"',
          'position',
          500,
          0,
        )

        // Validar epistemic gate em cada item e em cada source
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const section = item.getString('section')
          const itemSources = $app.findRecordsByFilter(
            'cer_map_item_sources',
            'map_item_id = "' + item.id + '"',
            '',
            100,
            0,
          )

          // Regra do item 18: section = o_que_reconheci_sobre_mim
          // Exige autoria/recognition participante suficiente:
          // participant_recognition com makes_sense | partially_makes_sense | wants_to_add OU
          // KI com epistemic_source participant_report | participant_recognition com legitimidade compatível.
          // PROIBIDO como sustentação isolada: professional_observation, framework_reading, recurrence_association,
          // pattern_hypothesis/integrative_hypothesis não reconhecidas, does_not_recognize.
          if (section === 'o_que_reconheci_sobre_mim') {
            let hasParticipantAuth = false
            for (let s = 0; s < itemSources.length; s++) {
              const src = itemSources[s]
              const sType = src.getString('source_type')
              if (sType === 'participant_recognition') {
                const rId = src.getString('recognition_id')
                if (rId) {
                  try {
                    const rRec = $app.findFirstRecordByData(
                      'cer_participant_recognitions',
                      'id',
                      rId,
                    )
                    const rType = rRec.getString('recognition_type')
                    if (
                      rType === 'makes_sense' ||
                      rType === 'partially_makes_sense' ||
                      rType === 'wants_to_add'
                    ) {
                      hasParticipantAuth = true
                      break
                    }
                  } catch (_) {}
                }
              } else if (sType === 'knowledge_item') {
                const kiId = src.getString('knowledge_item_id')
                if (kiId) {
                  try {
                    const kiRec = $app.findFirstRecordByData('cer_knowledge_items', 'id', kiId)
                    const epistemicSource = kiRec.getString('epistemic_source')
                    const kiStatus = kiRec.getString('status')
                    if (
                      (epistemicSource === 'participant_report' ||
                        epistemicSource === 'participant_recognition') &&
                      kiStatus !== 'not_confirmed' &&
                      kiStatus !== 'withdrawn' &&
                      kiStatus !== 'discarded'
                    ) {
                      hasParticipantAuth = true
                      break
                    }
                  } catch (_) {}
                }
              }
            }
            if (itemSources.length > 0 && !hasParticipantAuth) {
              throw new BadRequestError(
                'A seção "O que reconheci sobre mim" exige fundamentação em autoria ou reconhecimento da participante.',
              )
            }
          }

          // Validar observing isolado (item 13):
          // KI status=observing isolado NÃO pode sustentar sozinho Map Item publicado
          for (let s = 0; s < itemSources.length; s++) {
            const src = itemSources[s]
            if (src.getString('source_type') === 'knowledge_item') {
              const kiId = src.getString('knowledge_item_id')
              if (kiId) {
                try {
                  const kiRec = $app.findFirstRecordByData('cer_knowledge_items', 'id', kiId)
                  if (kiRec.getString('status') === 'observing') {
                    // Verificar se existe outra legitimação no mesmo item
                    const hasOtherLegitimation = itemSources.some((other) => {
                      if (other.id === src.id) return false
                      if (other.getString('source_type') === 'participant_recognition') {
                        const recId = other.getString('recognition_id')
                        if (recId) {
                          try {
                            const recRec = $app.findFirstRecordByData(
                              'cer_participant_recognitions',
                              'id',
                              recId,
                            )
                            const rt = recRec.getString('recognition_type')
                            return (
                              rt === 'makes_sense' ||
                              rt === 'partially_makes_sense' ||
                              rt === 'depends_on_context'
                            )
                          } catch (_) {}
                        }
                      }
                      if (other.getString('source_type') === 'knowledge_item') {
                        const oKiId = other.getString('knowledge_item_id')
                        try {
                          const oKi = $app.findFirstRecordByData('cer_knowledge_items', 'id', oKiId)
                          return oKi.getString('status') !== 'observing'
                        } catch (_) {}
                      }
                      return false
                    })

                    if (!hasOtherLegitimation) {
                      throw new BadRequestError(
                        'Conhecimento em observação (observing) não pode sustentar sozinho um item publicado sem legitimação adicional.',
                      )
                    }
                  }
                } catch (kiErr) {
                  if (kiErr.message && kiErr.message.indexOf('observing') !== -1) {
                    throw kiErr
                  }
                }
              }
            }
          }
        }

        // Carimbar published_at e published_by_user_id
        if (!map.getString('published_at')) {
          map.set('published_at', new Date().toISOString())
        }
        map.set('published_by_user_id', authId)

        // Superar atomicamente qualquer mapa publicado anteriormente para o mesmo enrollment
        // Usar $app.runInTransaction para atomicidade estrita
        $app.runInTransaction((txApp) => {
          const currentPubs = txApp.findRecordsByFilter(
            'cer_maps',
            'enrollment_id = "' +
              enrollmentId +
              '" && status = "published" && id != "' +
              map.id +
              '"',
            '',
            10,
            0,
          )
          for (let p = 0; p < currentPubs.length; p++) {
            const pubRec = currentPubs[p]
            pubRec.set('status', 'superseded')
            txApp.save(pubRec)

            // Registrar auditoria de superseded
            try {
              const auditCol = txApp.findCollectionByNameOrId('audit_events')
              const aRec = new Record(auditCol)
              aRec.set('actor_user_id', authId)
              aRec.set('action', 'MAP_SUPERSEDED')
              aRec.set('resource_type', 'cer_maps')
              aRec.set('resource_id', pubRec.id)
              aRec.set('enrollment_id', enrollmentId)
              aRec.set('timestamp', new Date().toISOString())
              aRec.set('result', 'success')
              aRec.set('request_context', 'server_map_publish_supersede')
              aRec.set(
                'metadata',
                JSON.stringify({
                  superseded_map_id: pubRec.id,
                  superseded_version: pubRec.getInt('version_number'),
                  superseded_by_map_id: map.id,
                  superseded_by_version: map.getInt('version_number'),
                }),
              )
              txApp.save(aRec)
            } catch (_) {}
          }
        })
      }
    }
  }

  e.next()
}, 'cer_maps')

onRecordAfterUpdateSuccess((e) => {
  e.next()
  try {
    const map = e.record
    const orig = map.original()
    const origStatus = orig ? orig.getString('status') : ''
    const newStatus = map.getString('status')

    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const actorId = e.auth ? e.auth.id : map.getString('created_by_user_id')
    if (actorId) {
      audit.set('actor_user_id', actorId)
    }

    let action = 'MAP_UPDATED'
    if (origStatus === 'draft' && newStatus === 'published') {
      action = 'MAP_PUBLISHED'
    } else if (origStatus === 'draft' && newStatus === 'discarded') {
      action = 'MAP_DRAFT_DISCARDED'
    } else if (newStatus === 'superseded' && origStatus !== 'superseded') {
      action = 'MAP_SUPERSEDED'
    }

    audit.set('action', action)
    audit.set('resource_type', 'cer_maps')
    audit.set('resource_id', map.id)
    audit.set('enrollment_id', map.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_map_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        map_id: map.id,
        version_number: map.getInt('version_number'),
        previous_status: origStatus,
        new_status: newStatus,
        published_by_user_id: map.getString('published_by_user_id') || undefined,
        published_at: map.getString('published_at') || undefined,
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_maps')

onRecordDelete((e) => {
  throw new BadRequestError(
    'Exclusão física de Mapa CER não permitida. Altere o status para "discarded" para preservar o histórico auditável.',
  )
}, 'cer_maps')
