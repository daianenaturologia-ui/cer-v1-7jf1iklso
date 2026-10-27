import React, { useState } from 'react'
import { selfRegistration, type RegistrationLink } from '@/services/selfRegistration'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { CerProductRecord } from '@/types/cer'

export function RegistrationLinks({ products }: { products: CerProductRecord[] }) {
  const [open, setOpen] = useState(false)
  const [links, setLinks] = useState<RegistrationLink[]>([])
  const [productId, setProduct] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
      setLinks(await selfRegistration.list())
    } catch {
      setError('Não foi possível carregar ou atualizar os links. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Button
        variant="outline"
        disabled={!products.length}
        onClick={() => {
          setOpen(true)
          setProduct(products[0]?.id || '')
          void run(async () => {})
        }}
      >
        Link para cadastro
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastro pela própria interagente</DialogTitle>
            <DialogDescription>
              Compartilhe seu link. A pessoa cria a senha e confirma o e-mail para iniciar o
              acompanhamento com você.
            </DialogDescription>
          </DialogHeader>
          <label className="text-sm">
            Acompanhamento
            <select
              className="mt-1 w-full rounded border bg-background p-2"
              value={productId}
              onChange={(e) => setProduct(e.target.value)}
              disabled={busy}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            disabled={busy || !productId}
            onClick={() => void run(() => selfRegistration.create(productId))}
          >
            Gerar link de cadastro
          </Button>
          {error && <p role="alert">{error}</p>}
          {notice && <p role="status">{notice}</p>}
          {busy && <p role="status">Atualizando links…</p>}
          {links
            .filter((l) => l.active)
            .map((link) => {
              const url = `${window.location.origin}/cadastro/${link.slug}`
              return (
                <div className="space-y-2 rounded border p-3" key={link.id}>
                  <p className="text-sm">
                    {products.find((p) => p.id === link.productId)?.name || 'Acompanhamento'}
                  </p>
                  <input
                    aria-label="Link de cadastro"
                    readOnly
                    value={url}
                    className="w-full rounded border bg-background p-2 text-sm"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(url)
                          setNotice('Link copiado.')
                        } catch {
                          setError('Selecione e copie o link acima.')
                        }
                      }}
                    >
                      Copiar link
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() => void run(() => selfRegistration.revoke(link.id))}
                    >
                      Desativar link
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Desativar impede novos cadastros por este link e ativações ainda não concluídas.
                    Contas já ativadas permanecem vinculadas.
                  </p>
                </div>
              )
            })}
        </DialogContent>
      </Dialog>
    </>
  )
}
