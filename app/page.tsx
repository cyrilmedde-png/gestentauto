import { redirect } from 'next/navigation'

export default function Home() {
  // Rediriger vers le dashboard si connecté, sinon vers login
  redirect('/dashboard')
}

