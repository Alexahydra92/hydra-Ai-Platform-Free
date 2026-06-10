import { NextRequest, NextResponse } from "next/server"
import ZAI from "z-ai-web-dev-sdk"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query } = body

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "Query pencarian diperlukan" }, { status: 400 })
    }

    const zai = await ZAI.create()
    const searchResult = await zai.functions.invoke("web_search", { query: query.trim(), num: 10 })

    // The search result structure may vary; normalize it
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
  } catch (error: unknown) {
    console.error("Search API error:", error)
    const message = error instanceof Error ? error.message : "Gagal melakukan pencarian"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
