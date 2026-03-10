import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { name, email, brand, category, stage, country, message } = await req.json()
    if (!name || !email || !brand) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses')
    const ses = new SESClient({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID!, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! }
    })

    await ses.send(new SendEmailCommand({
      Source: 'connect@yorkstn.com',
      Destination: { ToAddresses: ['connect@yorkstn.com','madhav0070@gmail.com','vedikabh.24@gmail.com'] },
      ReplyToAddresses: [email],
      Message: {
        Subject: { Data: `New Brand Enquiry: ${brand} — Yorkstn`, Charset: 'UTF-8' },
        Body: { Text: { Data: `Name: ${name}\nEmail: ${email}\nBrand: ${brand}\nCategory: ${category}\nStage: ${stage}\nCountry: ${country}\nMessage: ${message}`, Charset: 'UTF-8' } }
      }
    }))
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
