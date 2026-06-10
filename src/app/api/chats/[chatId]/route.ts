import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/chats/[chatId] - Get specific chat with messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { chatId } = await params
    const chat = await db.chat.findFirst({
      where: { id: chatId, userId: session.user.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    })

    if (!chat) {
      return NextResponse.json({ error: "Chat tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error("Get chat error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

// PATCH /api/chats/[chatId] - Update chat
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { chatId } = await params
    const body = await req.json()

    const existing = await db.chat.findFirst({
      where: { id: chatId, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: "Chat tidak ditemukan" }, { status: 404 })
    }

    const updateData: { title?: string; model?: string } = {}
    if (body.title) updateData.title = body.title
    if (body.model) updateData.model = body.model

    if (Object.keys(updateData).length > 0) {
      await db.chat.update({
        where: { id: chatId },
        data: updateData,
      })
    }

    if (body.messages && Array.isArray(body.messages)) {
      for (const msg of body.messages) {
        await db.message.create({
          data: {
            chatId,
            role: msg.role,
            content: msg.content,
          },
        })
      }

      await db.user.update({
        where: { id: session.user.id },
        data: { usageCount: { increment: body.messages.length } },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update chat error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

// DELETE /api/chats/[chatId] - Delete specific chat
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { chatId } = await params

    const existing = await db.chat.findFirst({
      where: { id: chatId, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: "Chat tidak ditemukan" }, { status: 404 })
    }

    await db.chat.delete({ where: { id: chatId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete chat error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
