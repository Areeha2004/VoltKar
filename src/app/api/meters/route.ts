import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const meters = await prisma.meter.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        readings: {
          orderBy: [
            { date: "desc" },
            { createdAt: "desc" }
          ],
          take: 1
        }
      }
    })

    const metersWithStats = meters.map((meter) => ({
      ...meter,
      lastReading: meter.readings?.[0]?.reading ?? 0,
      lastReadingDate: meter.readings?.[0]?.date ?? null,
      status: meter.readings?.length ? "active" : "inactive"
    }))

    return NextResponse.json({ meters: metersWithStats })

  } catch (error) {
    console.error("Error fetching meters:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const normalizedLabel =
      typeof body.label === "string" ? body.label.trim() : ""

    const normalizedType =
      typeof body.type === "string" ? body.type.trim() : null

    if (!normalizedLabel) {
      return NextResponse.json(
        { error: "Label is required" },
        { status: 400 }
      )
    }

    const meter = await prisma.meter.create({
      data: {
        userId: session.user.id,
        label: normalizedLabel,
        type: normalizedType
      }
    })

    return NextResponse.json({ meter }, { status: 201 })

  } catch (error) {
    console.error("Error creating meter:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}