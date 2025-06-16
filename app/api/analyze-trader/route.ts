import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert crypto trader analyst. Analyze the provided trader data and return ONLY a valid JSON response with the exact structure requested. Be thorough but concise in your analysis.

Focus on:
1. Distinguishing skill from luck
2. Identifying consistent patterns vs random success
3. Evaluating risk management discipline
4. Detecting potential insider trading signals
5. Assessing copy-trading viability

Return only valid JSON - no markdown, no explanations outside the JSON structure.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw new Error('No response from OpenAI')
    }

    // Try to parse the JSON response
    let insight
    try {
      insight = JSON.parse(response)
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        insight = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Invalid JSON response from OpenAI')
      }
    }

    // Validate the response structure
    const requiredFields = ['grade', 'classification', 'copyWorthiness', 'keyStrengths', 'redFlags', 'recommendation', 'reasoning']
    const missingFields = requiredFields.filter(field => !(field in insight))
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
    }

    return NextResponse.json({ insight })

  } catch (error) {
    console.error('Trader analysis error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze trader',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 