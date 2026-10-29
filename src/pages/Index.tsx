import { Link } from 'react-router-dom'
import { CerBrand } from '@/components/CerBrand'

export default function Index() {
  return (
    <main className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-xl space-y-6 text-center">
        <CerBrand />
        <h2 className="font-serif text-3xl">Como você quer viver enquanto realiza?</h2>
        <p>
          Um apoio para conhecer seu momento, cuidar das condições da sua caminhada e organizar o
          que importa.
        </p>
        <Link
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-6 text-primary-foreground"
          to="/login"
        >
          Entrar no app
        </Link>
      </div>
    </main>
  )
}
