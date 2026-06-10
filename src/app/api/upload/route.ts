import { NextRequest, NextResponse } from "next/server"
import { PDFParse } from "pdf-parse"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const TEXT_EXTENSIONS = new Set([
  ".txt", ".md", ".js", ".ts", ".py", ".java", ".cpp", ".c",
  ".html", ".css", ".json", ".csv", ".xml", ".yaml", ".yml",
])

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".")
  if (lastDot === -1) return ""
  return filename.substring(lastDot).toLowerCase()
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File diperlukan" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 10MB" }, { status: 400 })
    }

    const ext = getExtension(file.name)
    const filename = file.name

    let text = ""
    let type = "text"

    if (ext === ".pdf") {
      // PDF extraction using PDFParse class
      const buffer = Buffer.from(await file.arrayBuffer())
      const parser = new PDFParse()
      await parser.load(buffer)
      text = await parser.getText()
      type = "pdf"
    } else if (TEXT_EXTENSIONS.has(ext)) {
      // Text/code file
      const bytes = await file.arrayBuffer()
      text = new TextDecoder("utf-8").decode(bytes)
      type = ext.replace(".", "")
    } else {
      return NextResponse.json(
        { error: "Tipe file tidak didukung. Gunakan PDF, TXT, MD, JS, TS, PY, JAVA, CPP, C, HTML, CSS, JSON, CSV, XML, YAML" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      text,
      filename,
      type,
      size: file.size,
    })
  } catch (error: unknown) {
    console.error("Upload API error:", error)
    const message = error instanceof Error ? error.message : "Gagal memproses file"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
