import { NextRequest, NextResponse } from 'next/server'
import { sendSMS } from '@/lib/services/sms'

/**
 * API Route pour tester l'envoi de SMS
 * GET /api/sms/test?to=+33612345678
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const to = searchParams.get('to')

    if (!to) {
      return NextResponse.json(
        { error: 'Le paramètre "to" est obligatoire (ex: ?to=+33612345678)' },
        { status: 400 }
      )
    }

    // Envoyer un SMS de test
    const result = await sendSMS({
      to,
      message: `Test SMS depuis TalosPrime - ${new Date().toLocaleString('fr-FR')}. Si vous recevez ce message, la configuration Twilio fonctionne correctement !`,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de l\'envoi du SMS de test' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'SMS de test envoyé avec succès',
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('Error in /api/sms/test:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du SMS de test' },
      { status: 500 }
    )
  }
}









