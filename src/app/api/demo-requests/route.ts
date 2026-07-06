import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const demoRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  workshop: z.string().trim().min(2).max(160),
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  try {
    const payload = demoRequestSchema.parse(await request.json());

    await prisma.demoLead.create({
      data: {
        name: payload.name,
        email: payload.email.toLowerCase(),
        workshopName: payload.workshop,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Los datos ingresados no son válidos." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "No pudimos registrar la solicitud. Intenta nuevamente." },
      { status: 500 },
    );
  }
}
