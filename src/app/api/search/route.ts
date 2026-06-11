import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query } = body

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "Query pencarian diperlukan" }, { status: 400 })
    }

    // Try Z.ai SDK first (if available)
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default
      const zai = await ZAI.create()
      const searchResult = await zai.functions.invoke("web_search", { query: query.trim(), num: 10 })

      const results = Array.isArray(searchResult)
        ? searchResult.map((r: Record<string, unknown>, i: number) => ({
            url: r.url || r.link || "",
            name: r.name || r.title || "",
            snippet: r.snippet || r.description || r.text || "",
            host_name: r.host_name || "",
            rank: r.rank || i + 1,
            date: r.date || "",
          }))
        : []

      return NextResponse.json({ results })
    } catch {
      // Z.ai SDK not available, fallback to alternative search
    }

    // Fallback: Use AI model to generate search-like results
    const apiKey = process.env.DEFAULT_API_KEY || process.env.ZAI_API_KEY || ""
    const baseUrl = process.env.DEFAULT_BASE_URL || "https://api.openai.com/v1"
    const model = process.env.DEFAULT_MODEL || "gpt-4o-mini"

    if (!apiKey) {
      return NextResponse.json({ results: [], error: "Search service tidak tersedia" }, { status: 503 })
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a search assistant. Given a query, provide relevant factual information. Format your response as a JSON array of objects with 'name', 'url', and 'snippet' fields. Provide up to 5 results.",
          },
          { role: "user", content: query.trim() },
        ],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ results: [] })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || "[]"

    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      const results = jsonMatch ? JSON.parse(jsonMatch[0]) : []
      return NextResponse.json({ results })
    } catch {
      return NextResponse.json({ results: [] })
    }
  } catch (error: unknown) {
    console.error("Search API error:", error)
    const message = error instanceof Error ? error.message : "Gagal melakukan pencarian"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
