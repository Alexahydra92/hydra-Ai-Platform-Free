import { NextRequest, NextResponse } from "next/server"
import ZAI from "z-ai-web-dev-sdk"

// ─── Mode-specific system prompts ──────────────────────────────────
const MODE_PROMPTS: Record<string, string> = {
  chat: "You are a helpful, friendly AI assistant. Respond in the same language as the user.",
  coding: `You are an expert coding assistant. When generating code:
- Always specify the language with code blocks
- Include comments explaining key logic
- Follow best practices and clean code principles
- Provide complete, runnable code snippets
- Debug errors with clear explanations
- Suggest improvements and optimizations
Respond in the same language as the user.`,
  analysis: `You are an expert analytical AI assistant specialized in logical reasoning, mathematics, and deep analysis. When responding:
- Provide thorough, step-by-step reasoning
- Show your work and thought process
- Consider multiple perspectives
- Use formal logic when appropriate
- Give detailed, comprehensive answers
- Break down complex problems into parts
Respond in the same language as the user.`,
  agent: `You are an intelligent AI agent that can search the web, analyze data, and use tools to help users. When search results are provided, use them to give accurate, up-to-date answers. Always cite your sources. Respond in the same language as the user.`,
}

// ─── Z.ai GLM-5 with hardcoded API key ────────────────────────────
async function handleZaiAI(
  messages: { role: string; content: string }[],
  apiKey: string,
  mode?: string,
  imageUrl?: string,
  searchResults?: Array<Record<string, unknown>>
) {
  try {
    const zai = await ZAI.create({ apiKey })

    // Extract system prompt and merge into first user message for compatibility
    const systemMessages = messages.filter(m => m.role === "system")
    const nonSystemMessages = messages.filter(m => m.role !== "system")

    // Build mode prompt prefix
    const modePrompt = mode && MODE_PROMPTS[mode] ? MODE_PROMPTS[mode] : ""
    const userSystemPrompt = systemMessages.map(m => m.content).join("\n")

    // Combine mode prompt + user's custom system prompt
    const combinedSystemPrompt = [modePrompt, userSystemPrompt].filter(Boolean).join("\n\n")

    // Build valid messages: merge system prompt into first user message
    const validMessages: Array<{ role: "user" | "assistant"; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = []

    for (const m of nonSystemMessages) {
      if (m.role === "user" || m.role === "assistant") {
        if (validMessages.length === 0 && combinedSystemPrompt && m.role === "user") {
          validMessages.push({ role: "user", content: `[System]: ${combinedSystemPrompt}\n\n[User]: ${m.content}` })
        } else {
          validMessages.push({ role: m.role as "user" | "assistant", content: m.content })
        }
      }
    }

    // Z.ai requires at least one user message
    if (validMessages.length === 0) {
      return NextResponse.json({ error: "Pesan diperlukan" }, { status: 400 })
    }

    // Handle search results for agent mode
    if (searchResults && searchResults.length > 0 && mode === "agent") {
      const searchContext = searchResults.map((r: Record<string, unknown>, i: number) =>
        `[${i + 1}] ${r.name}\nURL: ${r.url}\n${r.snippet}`
      ).join("\n\n")

      const lastMsg = validMessages[validMessages.length - 1]
      if (lastMsg && lastMsg.role === "user") {
        const existingContent = typeof lastMsg.content === "string" ? lastMsg.content : ""
        validMessages[validMessages.length - 1] = {
          role: "user",
          content: `[Search Results]:\n${searchContext}\n\n[User Question]: ${existingContent}`,
        }
      }
    }

    // Handle image URL (VLM)
    if (imageUrl) {
      const lastMsg = validMessages[validMessages.length - 1]
      if (lastMsg && lastMsg.role === "user") {
        const existingContent = typeof lastMsg.content === "string" ? lastMsg.content : ""
        validMessages[validMessages.length - 1] = {
          role: "user",
          content: [
            { type: "text", text: existingContent },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        } as any
      }
    }

    const completion = await zai.chat.completions.create({
      messages: validMessages as any,
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
  baseUrl: string,
  mode?: string,
  imageUrl?: string,
  searchResults?: Array<Record<string, unknown>>
) {
  const apiBaseUrl = baseUrl || "https://api.openai.com/v1"
  const selectedModel = model || "gpt-3.5-turbo"

  // Build mode prompt prefix
  const modePrompt = mode && MODE_PROMPTS[mode] ? MODE_PROMPTS[mode] : ""

  // Prepend mode prompt to existing system message or create one
  let processedMessages = [...messages]

  if (modePrompt) {
    const systemIdx = processedMessages.findIndex(m => m.role === "system")
    if (systemIdx >= 0) {
      processedMessages[systemIdx] = {
        ...processedMessages[systemIdx],
        content: `${modePrompt}\n\n${processedMessages[systemIdx].content}`,
      }
    } else {
      processedMessages = [{ role: "system", content: modePrompt }, ...processedMessages]
    }
  }

  // Handle search results for agent mode
  if (searchResults && searchResults.length > 0 && mode === "agent") {
    const searchContext = searchResults.map((r: Record<string, unknown>, i: number) =>
      `[${i + 1}] ${r.name}\nURL: ${r.url}\n${r.snippet}`
    ).join("\n\n")

    const lastUserIdx = processedMessages.findLastIndex(m => m.role === "user")
    if (lastUserIdx >= 0) {
      processedMessages[lastUserIdx] = {
        ...processedMessages[lastUserIdx],
        content: `[Search Results]:\n${searchContext}\n\n[User Question]: ${processedMessages[lastUserIdx].content}`,
      }
    }
  }

  // Handle image URL (VLM) for OpenAI-compatible providers
  if (imageUrl) {
    const lastUserIdx = processedMessages.findLastIndex(m => m.role === "user")
    if (lastUserIdx >= 0) {
      processedMessages[lastUserIdx] = {
        role: "user",
        content: [
          { type: "text", text: processedMessages[lastUserIdx].content },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      } as any
    }
  }

  const response = await fetch(`${apiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: processedMessages,
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
    const { messages, apiKey, model, baseUrl, useDefault, mode, imageUrl, searchResults } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Pesan diperlukan" },
        { status: 400 }
      )
    }

    // If useDefault is true OR no API key provided → use Z.ai with hardcoded key
    if (useDefault || !apiKey) {
      const serverApiKey = process.env.ZAI_API_KEY || ""
      return await handleZaiAI(messages, serverApiKey, mode, imageUrl, searchResults)
    }

    // Otherwise use custom provider with user's API key
    return await handleCustomAI(messages, apiKey, model, baseUrl, mode, imageUrl, searchResults)
  } catch (error: unknown) {
    console.error("Chat API error:", error)
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
