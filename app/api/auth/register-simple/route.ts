import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { first_name, last_name, email, phone, company } = body

    // Validation des champs requis
    if (!first_name || !last_name || !email || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Les champs prénom, nom, email et téléphone sont requis',
        },
        { status: 400 }
      )
    }

    // Validation du format du téléphone
    if (!phone.startsWith('+33')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Le numéro de téléphone doit commencer par +33',
        },
        { status: 400 }
      )
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'L\'adresse email n\'est pas valide',
        },
        { status: 400 }
      )
    }

    // Appeler le webhook N8N pour déclencher l'inscription
    let n8nData = null
    
    try {
      const n8nResponse = await fetch(
        'https://n8n.talosprimes.com/webhook/inscription-utilisateur',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            first_name,
            last_name,
            email,
            phone,
            company: company || null,
          }),
        }
      )

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text()
        console.error('Erreur N8N:', errorText)
        return NextResponse.json(
          {
            success: false,
            error: 'Le workflow N8N n\'est pas accessible. Vérifiez qu\'il est activé.',
          },
          { status: 500 }
        )
      }

      // Vérifier si la réponse contient du JSON
      const contentType = n8nResponse.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        n8nData = await n8nResponse.json()
      } else {
        const textResponse = await n8nResponse.text()
        console.log('Réponse N8N (non-JSON):', textResponse)
      }
    } catch (n8nError) {
      console.error('Erreur lors de l\'appel N8N:', n8nError)
      return NextResponse.json(
        {
          success: false,
          error: 'Le workflow N8N n\'est pas configuré. Veuillez l\'importer et l\'activer dans N8N.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Inscription réussie ! Consultez votre email pour vos identifiants.',
      user_id: n8nData?.user_id || null,
    })
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

