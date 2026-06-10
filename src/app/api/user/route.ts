import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/user - Get current user stats for dashboard
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isGuest: true,
        usageCount: true,
        createdAt: true,
        chats: {
          select: {
            id: true,
            title: true,
            model: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { messages: true } },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    const totalChats = user.chats.length
    const totalMessages = user.chats.reduce((sum, c) => sum + c._count.messages, 0)

    // Model usage stats
    const modelStats: Record<string, number> = {}
    for (const chat of user.chats) {
      modelStats[chat.model] = (modelStats[chat.model] || 0) + 1
    }

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentChats = user.chats.filter(c => new Date(c.createdAt) >= sevenDaysAgo).length

    return NextResponse.json({
      ...user,
      stats: {
        totalChats,
        totalMessages,
        recentChats,
        modelStats,
      },
    })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
