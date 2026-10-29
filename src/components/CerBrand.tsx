import { Link } from 'react-router-dom'

export const CER_BRAND = {
  name: 'Método CER',
  meaning: 'Consciência, Equilíbrio e Realização',
  signature: 'Daiane Cenci — Desenvolvimento com Consciência.',
  logo: '/brand/CER_Oficial_23out2026_marfim.png',
} as const

/** The approved artwork is used whole: never crop, filter, redraw or omit its words. */
export function CerBrand({ context = 'auth' }: { context?: 'auth' | 'app' }) {
  return (
    <header
      className={`cer-brand cer-brand-${context}`}
      aria-label="Método CER — identidade oficial"
    >
      <figure className="cer-brand-seal">
        <a
          href={CER_BRAND.logo}
          target="_blank"
          rel="noreferrer"
          aria-label="Ampliar logo completa do Método CER"
        >
          <img
            src={CER_BRAND.logo}
            width={1254}
            height={1254}
            alt="Logo oficial dourada em alto-relevo: cer cursivo dentro do círculo, com CONSCIÊNCIA · EQUILÍBRIO · REALIZAÇÃO abaixo, ponto e folhas."
          />
        </a>
        <figcaption>
          <a href={CER_BRAND.logo} target="_blank" rel="noreferrer">
            Ampliar marca completa
          </a>
        </figcaption>
      </figure>
      <div className="cer-brand-copy">
        {context === 'auth' ? (
          <h1>{CER_BRAND.name}</h1>
        ) : (
          <p className="cer-brand-name">{CER_BRAND.name}</p>
        )}
        <p className="cer-brand-signature">{CER_BRAND.signature}</p>
        {context === 'app' && (
          <Link to="/" className="cer-brand-home">
            Voltar ao meu percurso
          </Link>
        )}
      </div>
    </header>
  )
}
