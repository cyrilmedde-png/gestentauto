import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/services/email'

/**
 * API Route pour tester l'envoi d'email
 * GET /api/email/test?to=email@example.com
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const to = searchParams.get('to')

    if (!to) {
      return NextResponse.json(
        { error: 'Le paramètre "to" est obligatoire (ex: ?to=test@example.com)' },
        { status: 400 }
      )
    }

    // Envoyer un email de test
    const result = await sendEmail({
      to,
      subject: 'Test d\'envoi email - TalosPrime',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background-color: #080808;
                color: #fff;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background-color: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 8px 8px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>✅ Test d'envoi email</h1>
            </div>
            <div class="content">
              <p>Ceci est un email de test depuis TalosPrime.</p>
              <p>Si vous recevez cet email, cela signifie que la configuration Resend fonctionne correctement !</p>
              <p>Date d'envoi : ${new Date().toLocaleString('fr-FR')}</p>
            </div>
          </body>
        </html>
      `,
      text: 'Ceci est un email de test depuis TalosPrime. Si vous recevez cet email, cela signifie que la configuration Resend fonctionne correctement !',
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de l\'envoi de l\'email de test' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email de test envoyé avec succès',
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('Error in /api/email/test:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email de test' },
      { status: 500 }
    )
  }
}


