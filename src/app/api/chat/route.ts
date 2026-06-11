import { NextRequest, NextResponse } from "next/server"

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

// ─── Universal OpenAI-compatible handler ────────────────────────────
// Works with: OpenAI, DeepSeek, Groq, OpenRouter, Together AI,
// Mistral, Google Gemini (OpenAI compat), Anthropic (via proxy), etc.
async function handleOpenAICompatible(
  messages: { role: string; content: unknown }[],
  apiKey: string,
  model: string,
  baseUrl: string,
  mode?: string,
  imageUrl?: string,
  searchResults?: Array<Record<string, unknown>>
) {
  const apiBaseUrl = baseUrl || "https://api.openai.com/v1"
  const selectedModel = model || "gpt-4o-mini"

  // Build mode prompt prefix
  const modePrompt = mode && MODE_PROMPTS[mode] ? MODE_PROMPTS[mode] : ""

  // Process messages
  let processedMessages = [...messages]

  if (modePrompt) {
    const systemIdx = processedMessages.findIndex(m => m.role === "system")
    if (systemIdx >= 0) {
      processedMessages[systemIdx] = {
        ...processedMessages[systemIdx],
        content: `${modePrompt}\n\n${processedMessages[systemIdx].content}`,
      }
    } else {
      processedMessages = [{ role: "system", content: modePrompt }, ...processedMessages] as any[]
    }
  }

  // Handle search results for agent mode
  if (searchResults && searchResults.length > 0 && mode === "agent") {
    const searchContext = searchResults.map((r: Record<string, unknown>, i: number) =>
      `[${i + 1}] ${r.name}\nURL: ${r.url}\n${r.snippet}`
    ).join("\n\n")

    const lastUserIdx = processedMessages.findLastIndex(m => m.role === "user")
    if (lastUserIdx >= 0) {
      const existingContent = typeof processedMessages[lastUserIdx].content === "string"
        ? processedMessages[lastUserIdx].content
        : ""
      processedMessages[lastUserIdx] = {
        role: "user",
        content: `[Search Results]:\n${searchContext}\n\n[User Question]: ${existingContent}`,
      }
    }
  }

  // Handle image URL (VLM) - multimodal content
  if (imageUrl) {
    const lastUserIdx = processedMessages.findLastIndex(m => m.role === "user")
    if (lastUserIdx >= 0) {
      const existingContent = typeof processedMessages[lastUserIdx].content === "string"
        ? processedMessages[lastUserIdx].content
        : ""
      processedMessages[lastUserIdx] = {
        role: "user",
        content: [
          { type: "text", text: existingContent },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      }
    }
  }

  // Call the OpenAI-compatible API
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

  // Stream the response
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

    // If useDefault is true OR no API key provided → use server default key
    if (useDefault || !apiKey) {
      const serverApiKey = process.env.DEFAULT_API_KEY || process.env.ZAI_API_KEY || ""
      const serverBaseUrl = process.env.DEFAULT_BASE_URL || "https://api.openai.com/v1"
      const serverModel = process.env.DEFAULT_MODEL || "gpt-4o-mini"

      if (!serverApiKey) {
        return NextResponse.json(
          { error: "Server API key belum dikonfigurasi. Hubungi admin atau gunakan API key sendiri di Settings." },
          { status: 500 }
        )
      }

      return await handleOpenAICompatible(
        messages, serverApiKey, serverModel, serverBaseUrl, mode, imageUrl, searchResults
      )
    }

    // Otherwise use user's own API key with their chosen provider
    return await handleOpenAICompatible(
      messages, apiKey, model, baseUrl, mode, imageUrl, searchResults
    )
  } catch (error: unknown) {
    console.error("Chat API error:", error)
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
