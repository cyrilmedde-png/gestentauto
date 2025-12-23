import { NextRequest, NextResponse } from 'next/server'
import { sendSMS, type SendSMSOptions } from '@/lib/services/sms'

/**
 * API Route pour envoyer un SMS générique
 * POST /api/sms/send
 */
export async function POST(request: NextRequest) {
  try {
    const body: SendSMSOptions = await request.json()

    // Validation basique
    if (!body.to || !body.message) {
      return NextResponse.json(
        { error: 'Les champs "to" et "message" sont obligatoires' },
        { status: 400 }
      )
    }

    // Envoyer le SMS
    const result = await sendSMS(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de l\'envoi du SMS' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('Error in /api/sms/send:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du SMS' },
      { status: 500 }
    )
  }
}


