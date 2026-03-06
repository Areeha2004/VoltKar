import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { isSupportedDisco, normalizeDisco } from "@/lib/discoTariffs";

// Ensure Node runtime (and not Edge, which breaks bcrypt)
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email, password, name, image, disco } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    if (!disco || !isSupportedDisco(disco)) {
      return NextResponse.json({ error: "A valid electricity operator is required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedDisco = normalizeDisco(disco);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        image: image || null,
        preferences: {
          create: {
            disco: normalizedDisco,
            language: "en",
            unitType: "kWh",
            currency: "PKR",
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        preferences: { select: { disco: true } },
      }, // avoid returning password
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error?.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
