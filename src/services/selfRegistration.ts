import pb from '@/lib/pocketbase/client'
export interface RegistrationLink {
  id: string
  slug: string
  active: boolean
  productId: string
}
export interface RegistrationInfo {
  professionalName: string
  productName: string
}
export interface RegistrationInput {
  slug: string
  fullName: string
  email: string
  password: string
  passwordConfirm: string
  acceptLink: boolean
  website: string
}
function command<T>(action: string, body: object = {}) {
  return pb.send<T>('/backend/v1/cer/registration', {
    method: 'POST',
    body: { ...body, action },
    requestKey: null,
  })
}
export const selfRegistration = {
  info: (slug: string) => command<RegistrationInfo>('info', { slug }),
  register: (input: RegistrationInput) => command<{ next: string }>('register', input),
  list: () => command<RegistrationLink[]>('list'),
  create: (productId: string) => command<RegistrationLink>('create', { productId }),
  revoke: (id: string) => command<{ ok: boolean }>('revoke', { id }),
  resend: (email: string) => pb.collection('users').requestVerification(email.trim()),
}
