import { AzureOpenAI } from 'openai'
import { EMAIL } from '@/models/constants'
import { NextResponse } from 'next/server'

function validateEnvironmentVariables () {
  const required = ['AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY']

  for (const variable of required) {
    if (!process.env[variable]) {
      throw new Error(`Missing required environment variable: ${variable}`)
    }
  }
}

export async function POST (req: Request) {
  try {
    validateEnvironmentVariables()
    const { message, conversationHistory, tools } = await req.json()

    const messages = [
      {
        role: 'system',
        content:
          'You are a helpful shopping assistant that helps customers find products and answers questions about them.'
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    const client = new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION!
    })

    const response = await client.chat.completions.create({
      messages: messages,
      model: process.env.AZURE_OPENAI_CHAT_MODEL!,
      tools: tools
    })

    const content = JSON.stringify(response)
    console.log('Chat API Response:', content)

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
