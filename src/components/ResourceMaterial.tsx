import React from 'react'
import { MATERIAL_FORMATS, materialUrl, type LibraryMaterial } from '@/services/libraryMaterial'
export function ResourceMaterial({ material }: { material?: LibraryMaterial }) {
  if (!material) return null
  const url = materialUrl(material.url)
  return (
    <div className="space-y-2 mt-3 text-sm">
      <p className="text-xs text-muted-foreground">
        Formato: {MATERIAL_FORMATS[material.format] || 'Texto'}
      </p>
      {material.conditions && (
        <p className="whitespace-pre-wrap">
          <strong>Antes de começar: </strong>
          {material.conditions}
        </p>
      )}
      {url && (
        <a
          className="inline-block underline text-primary"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
        >
          {
            {
              text: 'Abrir material complementar',
              pdf: 'Abrir PDF',
              audio: 'Ouvir áudio',
              video: 'Assistir vídeo',
            }[material.format]
          }{' '}
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      )}
      {material.author && <p>Autoria: {material.author}</p>}
      {material.references && (
        <details>
          <summary className="cursor-pointer">Fontes e referências</summary>
          <p className="whitespace-pre-wrap mt-2">{material.references}</p>
        </details>
      )}
    </div>
  )
}
