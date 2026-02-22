import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const type = body?.type === "CADRE" ? "CADRE" : "EMPLOYE";

    if (!name) return NextResponse.json({ error: "Nom manquant" }, { status: 400 });

    const emp = await prisma.employee.create({
      data: { name, type },
    });

    return NextResponse.json({ ok: true, employee: emp });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 500 });
  }
}
