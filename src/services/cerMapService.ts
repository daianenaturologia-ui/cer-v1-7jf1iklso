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
    return await pb.collection('cer_maps').getFullList<CerMapRecord>({
      filter: `enrollment_id = "${enrollmentId}"`,
      sort: '-version_number',
    })
  },

  /**
   * Cria um novo draft do Mapa CER (V1 inicial)
   */
  async createInitialDraft(enrollmentId: string, userId: string): Promise<CerMapRecord> {
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
    for (const it of items) {
      await pb.collection('cer_map_items').update(it.id, { position: it.position })
    }
  },

  /**
   * Vincula uma fonte a um item de draft
   */
  async linkSource(input: LinkSourceInput): Promise<CerMapItemSourceRecord> {
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
   * Publica o draft de Mapa CER V(n)
   * O hook server-side executa o gate completo, carimba published_at e published_by_user_id
   * e marca qualquer publicado anterior como superseded em transação atômica.
   */
  async publishDraft(mapId: string): Promise<CerMapRecord> {
    return await pb.collection('cer_maps').update<CerMapRecord>(mapId, {
      status: 'published',
    })
  },

  /**
   * Descarta o draft de Mapa CER (Item 27)
   */
  async discardDraft(mapId: string): Promise<CerMapRecord> {
    return await pb.collection('cer_maps').update<CerMapRecord>(mapId, {
      status: 'discarded',
    })
  },
}
