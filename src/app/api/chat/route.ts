import { NextRequest, NextResponse } from "next/server"
import ZAI from "z-ai-web-dev-sdk"

// ─── Z.ai GLM-5 with hardcoded API key ────────────────────────────
async function handleZaiAI(messages: { role: string; content: string }[], apiKey: string) {
  try {
    const zai = await ZAI.create({ apiKey })

    // Extract system prompt and merge into first user message for compatibility
    const systemMessages = messages.filter(m => m.role === "system")
    const nonSystemMessages = messages.filter(m => m.role !== "system")

    const systemPrompt = systemMessages.map(m => m.content).join("\n")

    // Build valid messages: merge system prompt into first user message
    const validMessages: Array<{ role: "user" | "assistant"; content: string }> = []

    for (const m of nonSystemMessages) {
      if (m.role === "user" || m.role === "assistant") {
        if (validMessages.length === 0 && systemPrompt && m.role === "user") {
          validMessages.push({ role: "user", content: `[System]: ${systemPrompt}\n\n[User]: ${m.content}` })
        } else {
          validMessages.push({ role: m.role, content: m.content })
        }
      }
    }

    // Z.ai requires at least one user message
    if (validMessages.length === 0) {
      return NextResponse.json({ error: "Pesan diperlukan" }, { status: 400 })
    }

    const completion = await zai.chat.completions.create({
      messages: validMessages,
    })

    const content = completion.choices?.[0]?.message?.content || "Maaf, tidak ada respons dari AI."

    // Return as SSE stream for consistency with frontend
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        const chunk = {
          choices: [
            {
              delta: { content },
              finish_reason: "stop",
            },
          ],
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error: unknown) {
    console.error("Z.ai SDK error:", error)
    const message = error instanceof Error ? error.message : "Gagal terhubung ke Z.ai"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── Custom AI provider (user's own API key) ─────────────────────────
async function handleCustomAI(
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string,
  baseUrl: string
) {
  const apiBaseUrl = baseUrl || "https://api.openai.com/v1"
  const selectedModel = model || "gpt-3.5-turbo"

  const response = await fetch(`${apiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      messages,
      stream: true,
    }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    let errorMessage = "Gagal terhubung ke AI provider"
    try {
      const parsed = JSON.parse(errorData)
      errorMessage = parsed?.error?.message || errorMessage
    } catch {
      // use default error message
    }
    return NextResponse.json({ error: errorMessage }, { status: response.status })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader()
      if (!reader) {
        controller.close()
        return
      }
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          controller.enqueue(value)
        }
      } catch (error) {
        console.error("Stream error:", error)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

// ─── Main POST handler ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, apiKey, model, baseUrl, useDefault } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Pesan diperlukan" },
        { status: 400 }
      )
    }

    // If useDefault is true OR no API key provided → use Z.ai with hardcoded key
    if (useDefault || !apiKey) {
      const serverApiKey = process.env.ZAI_API_KEY || ""
      return await handleZaiAI(messages, serverApiKey)
    }

    // Otherwise use custom provider with user's API key
    return await handleCustomAI(messages, apiKey, model, baseUrl)
  } catch (error: unknown) {
    console.error("Chat API error:", error)
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
