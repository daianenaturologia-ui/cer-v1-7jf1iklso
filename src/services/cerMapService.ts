/**
 * Build 06: Serviço Principal do Mapa CER (cerMapService)
 *
 * Gerencia CRUD seguro de Mapas CER:
 * - listPublishedByEnrollment (participante)
 * - listAllByEnrollment (profissional)
 * - getCurrentPublishedMap (mapa ativo do enrollment)
 * - getDraftMap (draft em aberto do enrollment)
 * - createDraftMap (criação de rascunho V1 ou nova versão)
 * - createNextDraftFromPublished (copia snapshots, positions, recreates source links com version anchors)
 * - addMapItem (adiciona item a draft)
 * - updateMapItemDraft (atualiza texto ou posição em draft)
 * - reorderMapItems (reordena itens em draft)
 * - linkMapItemSource (vincula fonte compatível a item de draft)
 * - publishMap (gate completo + atomic supersede do published anterior)
 * - discardDraftMap (descarte irreversível de rascunho)
 */

import pb from '@/lib/pocketbase/client'
import {
  CerMapRecord,
  CerMapItemRecord,
  CerMapItemSourceRecord,
  CerMapSection,
  CerMapSourceType,
} from '@/types/cer'

export interface CreateMapItemInput {
  map_id: string
  section: CerMapSection
  item_text: string
  position: number
}

export interface LinkSourceInput {
  map_item_id: string
  source_type: CerMapSourceType
  knowledge_item_id?: string
  recognition_id?: string
  presentation_id?: string
  knowledge_version_number?: number
  knowledge_version_id?: string
}

export const cerMapService = {
  /**
   * Obtém o Mapa publicado ativo da interagente (Participante Display)
   */
  async getCurrentPublishedMap(
    enrollmentId: string,
  ): Promise<(CerMapRecord & { items: CerMapItemRecord[] }) | null> {
    if (!enrollmentId) return null

    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.getCurrentPublishedMap(enrollmentId)
    }

    try {
      const maps = await pb.collection('cer_maps').getList<CerMapRecord>(1, 1, {
        filter: `enrollment_id = "${enrollmentId}" && status = "published"`,
        sort: '-version_number',
      })

      if (maps.items.length === 0) return null
      const map = maps.items[0]

      const items = await pb.collection('cer_map_items').getFullList<CerMapItemRecord>({
        filter: `map_id = "${map.id}"`,
        sort: 'position',
      })

      return {
        ...map,
        items,
      }
    } catch {
      return null
    }
  },

  /**
   * Obtém o rascunho ativo do enrollment se houver (para o profissional)
   */
  async getDraftMap(enrollmentId: string): Promise<
    | (CerMapRecord & {
        items: (CerMapItemRecord & { sources?: CerMapItemSourceRecord[] })[]
      })
    | null
  > {
    if (!enrollmentId) return null

    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.getDraftMap(enrollmentId)
    }

    try {
      const drafts = await pb.collection('cer_maps').getList<CerMapRecord>(1, 1, {
        filter: `enrollment_id = "${enrollmentId}" && status = "draft"`,
        sort: '-version_number',
      })

      if (drafts.items.length === 0) return null
      const map = drafts.items[0]

      const items = await pb.collection('cer_map_items').getFullList<CerMapItemRecord>({
        filter: `map_id = "${map.id}"`,
        sort: 'position',
      })

      // Buscar fontes de cada item
      const itemsWithSources: (CerMapItemRecord & {
        sources?: CerMapItemSourceRecord[]
      })[] = []
      for (const it of items) {
        const sources = await pb
          .collection('cer_map_item_sources')
          .getFullList<CerMapItemSourceRecord>({
            filter: `map_item_id = "${it.id}"`,
            expand: 'knowledge_item_id,recognition_id,presentation_id,knowledge_version_id',
          })
        itemsWithSources.push({
          ...it,
          sources,
        })
      }

      return {
        ...map,
        items: itemsWithSources,
      }
    } catch {
      return null
    }
  },

  /**
   * Lista todos os mapas do enrollment (visão do profissional com histórico)
   */
  async listAllMaps(enrollmentId: string): Promise<CerMapRecord[]> {
    if (!enrollmentId) return []
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.listAllMaps(enrollmentId)
    }
    return await pb.collection('cer_maps').getFullList<CerMapRecord>({
      filter: `enrollment_id = "${enrollmentId}"`,
      sort: '-version_number',
    })
  },

  /**
   * Cria um novo draft do Mapa CER (V1 inicial)
   */
  async createInitialDraft(enrollmentId: string, userId: string): Promise<CerMapRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.createInitialDraft(enrollmentId, userId)
    }
    return await pb.collection('cer_maps').create<CerMapRecord>({
      enrollment_id: enrollmentId,
      version_number: 1,
      status: 'draft',
      created_by_user_id: userId,
    })
  },

  /**
   * Cria próxima versão em draft a partir do mapa publicado atual (Item 26)
   * - Cria draft V(n+1)
   * - Copia item_text snapshots
   * - Copia position e section
   * - Recria source links preservando version anchors
   * - V(n) permanece intocado
   */
  async createNextDraftFromPublished(
    publishedMapId: string,
    userId: string,
  ): Promise<CerMapRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.createNextDraftFromPublished(publishedMapId, userId)
    }
    const pubMap = await pb.collection('cer_maps').getOne<CerMapRecord>(publishedMapId)
    if (pubMap.status !== 'published') {
      throw new Error('Somente mapas publicados podem gerar nova versão de rascunho.')
    }

    const nextVer = pubMap.version_number + 1

    // 1. Criar novo draft
    const newDraft = await pb.collection('cer_maps').create<CerMapRecord>({
      enrollment_id: pubMap.enrollment_id,
      version_number: nextVer,
      status: 'draft',
      created_by_user_id: userId,
    })

    // 2. Copiar items do mapa publicado
    const oldItems = await pb.collection('cer_map_items').getFullList<CerMapItemRecord>({
      filter: `map_id = "${pubMap.id}"`,
      sort: 'position',
    })

    for (const oldIt of oldItems) {
      const newItem = await pb.collection('cer_map_items').create<CerMapItemRecord>({
        map_id: newDraft.id,
        section: oldIt.section,
        item_text: oldIt.item_text,
        position: oldIt.position,
        created_by_user_id: userId,
      })

      // Copiar fontes preservando version anchors
      const oldSources = await pb
        .collection('cer_map_item_sources')
        .getFullList<CerMapItemSourceRecord>({
          filter: `map_item_id = "${oldIt.id}"`,
        })

      for (const oSrc of oldSources) {
        await pb.collection('cer_map_item_sources').create({
          map_item_id: newItem.id,
          source_type: oSrc.source_type,
          knowledge_item_id: oSrc.knowledge_item_id || undefined,
          recognition_id: oSrc.recognition_id || undefined,
          presentation_id: oSrc.presentation_id || undefined,
          knowledge_version_number: oSrc.knowledge_version_number || undefined,
          knowledge_version_id: oSrc.knowledge_version_id || undefined,
        })
      }
    }

    return newDraft
  },

  /**
   * Adiciona um item ao draft
   */
  async addMapItem(input: CreateMapItemInput, userId: string): Promise<CerMapItemRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.addMapItem(input, userId)
    }
    return await pb.collection('cer_map_items').create<CerMapItemRecord>({
      map_id: input.map_id,
      section: input.section,
      item_text: input.item_text,
      position: input.position,
      created_by_user_id: userId,
    })
  },

  /**
   * Atualiza texto ou posição de um item no draft
   */
  async updateMapItemDraft(
    itemId: string,
    data: { item_text?: string; position?: number },
  ): Promise<CerMapItemRecord> {
    return await pb.collection('cer_map_items').update<CerMapItemRecord>(itemId, data)
  },

  /**
   * Reordena itens dentro de uma seção no draft
   */
  async reorderItems(items: { id: string; position: number }[]): Promise<void> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.reorderItems(items)
    }
    for (const it of items) {
      await pb.collection('cer_map_items').update(it.id, { position: it.position })
    }
  },

  /**
   * Vincula uma fonte a um item de draft
   */
  async linkSource(input: LinkSourceInput): Promise<CerMapItemSourceRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.linkSource(input)
    }
    return await pb.collection('cer_map_item_sources').create<CerMapItemSourceRecord>({
      map_item_id: input.map_item_id,
      source_type: input.source_type,
      knowledge_item_id: input.knowledge_item_id || undefined,
      recognition_id: input.recognition_id || undefined,
      presentation_id: input.presentation_id || undefined,
      knowledge_version_number: input.knowledge_version_number || undefined,
      knowledge_version_id: input.knowledge_version_id || undefined,
    })
  },

  /**
   * Verifica se a publicação do Mapa é permitida para o enrollment informado.
   * Regra Obrigatória V1:
   * O Mapa CER NÃO pode ser publicado antes do primeiro encontro registrado.
   * Trava Fail-Closed: se a consulta falhar por qualquer erro, o acesso é BLOQUEADO.
   */
  async canPublishMap(enrollmentId: string): Promise<{
    allowed: boolean
    reason?: string
    sessionCount: number
    hasError?: boolean
  }> {
    if (!enrollmentId) {
      return {
        allowed: false,
        reason: 'Enrollment não informado.',
        sessionCount: 0,
      }
    }

    try {
      const { cerSessionService } = await import('@/services/cerSession')
      const sessions = await cerSessionService.listSessionsByEnrollment(enrollmentId)
      const count = Array.isArray(sessions) ? sessions.length : 0

      if (count === 0) {
        return {
          allowed: false,
          reason: 'O Mapa CER poderá ser compartilhado após o registro do primeiro encontro.',
          sessionCount: 0,
        }
      }

      return {
        allowed: true,
        sessionCount: count,
      }
    } catch (err: any) {
      // Fail-closed seguro: em caso de erro na consulta, bloqueia terminantemente
      return {
        allowed: false,
        reason: `Falha segura ao verificar sessões registradas: ${err?.message || 'erro de rede/permissão'}. Publicação bloqueada preventivamente.`,
        sessionCount: 0,
        hasError: true,
      }
    }
  },

  /**
   * Publica o draft de Mapa CER V(n)
   * Valida obrigatoriamente a trava do primeiro encontro (fail-closed) antes de qualquer persistência.
   */
  async publishDraft(mapId: string, enrollmentId?: string): Promise<CerMapRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    let targetEnrollmentId = enrollmentId

    if (!targetEnrollmentId) {
      if (demoAdapter.isEnabled()) {
        const draft = demoAdapter.getDraftMap('')
        targetEnrollmentId = draft?.enrollment_id
      } else {
        const mapRec = await pb.collection('cer_maps').getOne<CerMapRecord>(mapId)
        targetEnrollmentId = mapRec.enrollment_id
      }
    }

    if (!targetEnrollmentId) {
      throw new Error(
        'Falha segura: não foi possível identificar o enrollment do mapa para validação de sessões.',
      )
    }

    // TRAVA REAL DE PUBLICAÇÃO: Fail-Closed
    const gateCheck = await this.canPublishMap(targetEnrollmentId)
    if (!gateCheck.allowed) {
      throw new Error(
        gateCheck.reason ||
          'O Mapa CER poderá ser compartilhado após o registro do primeiro encontro.',
      )
    }

    if (demoAdapter.isEnabled()) {
      return demoAdapter.publishDraft(mapId)
    }

    return await pb.collection('cer_maps').update<CerMapRecord>(mapId, {
      status: 'published',
    })
  },

  /**
   * Descarta o draft de Mapa CER (Item 27)
   */
  async discardDraft(mapId: string): Promise<CerMapRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.discardDraft(mapId)
    }
    return await pb.collection('cer_maps').update<CerMapRecord>(mapId, {
      status: 'discarded',
    })
  },
}
