import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function monthDateUTC(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const employeeId = String(body?.employeeId ?? "");
    const year = Number(body?.year);
    const month = Number(body?.month);

    const grossCents = Number(body?.grossCents);
    const chargesCents = Number(body?.chargesCents);
    const netCents = Number(body?.netCents);

    if (!employeeId) return NextResponse.json({ error: "employeeId manquant" }, { status: 400 });
    if (!Number.isFinite(year) || year < 2000) return NextResponse.json({ error: "Année invalide" }, { status: 400 });
    if (!Number.isFinite(month) || month < 1 || month > 12)
      return NextResponse.json({ error: "Mois invalide" }, { status: 400 });

    const monthDate = monthDateUTC(year, month);

    const salary = await prisma.salary.upsert({
      where: {
        employeeId_month: { employeeId, month: monthDate },
      },
      update: { grossCents, chargesCents, netCents },
      create: { employeeId, month: monthDate, grossCents, chargesCents, netCents },
      include: { employee: true },
    });

    // ⚠️ Ici si tu as déjà une logique "créer expense automatique", tu peux la remettre.
    // Je laisse neutre pour éviter de casser tant que tout n'est pas stable.

    return NextResponse.json({ ok: true, salary });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
