"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { BillStatus } from "@prisma/client";

function toCents(chf: string) {
  const cleaned = String(chf)
    .trim()
    .replace(/\s/g, "")
    .replace(/’/g, "")
    .replace(/'/g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

function bpFromPercent(p: string) {
  const cleaned = String(p).trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

function computeVat(amountGrossCents: number, vatRateBp: number) {
  // gross = net + vat ; rate = 810 => 8.10%
  const rate = vatRateBp / 10000;
  const net = Math.round(amountGrossCents / (1 + rate));
  const vat = amountGrossCents - net;
  return { net, vat };
}

function parseBillStatus(raw: string): BillStatus {
  const key = String(raw ?? "").trim() as BillStatus;
  if (!key || !(key in BillStatus)) return BillStatus.OPEN;
  return key;
}

export async function createBill(formData: FormData) {
  const issueDateStr = String(formData.get("issueDate") ?? "");
  const dueDateStr = String(formData.get("dueDate") ?? "");
  const supplierId = String(formData.get("supplierId") ?? "").trim();
  const number = String(formData.get("number") ?? "").trim();
  const sector = String(formData.get("sector") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const ttcStr = String(formData.get("ttc") ?? "");
  const vatPercent = String(formData.get("vat") ?? "8.1");
  const statusRaw = String(formData.get("status") ?? "OPEN");

  if (!issueDateStr) throw new Error("Date manquante");
  if (!supplierId) throw new Error("Fournisseur manquant");

  const amountGrossCents = toCents(ttcStr);
  if (!Number.isFinite(amountGrossCents) || amountGrossCents < 0) {
    throw new Error("Montant TTC invalide");
  }

  const vatRateBp = bpFromPercent(vatPercent);
  if (!Number.isFinite(vatRateBp) || vatRateBp < 0) {
    throw new Error("Taux TVA invalide");
  }

  const { net, vat } = computeVat(amountGrossCents, vatRateBp);
  const status = parseBillStatus(statusRaw);

  await prisma.bill.create({
    data: {
      issueDate: new Date(issueDateStr),
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
      supplierId,
      number: number || null,
      sector: sector || null,
      category: category || null,
      notes: notes || null,
      status,
      amountGrossCents,
      amountNetCents: net,
      amountVatCents: vat,
      vatRateBp,
    },
  });

  revalidatePath("/bills");
  revalidatePath("/");
}

export async function updateBillStatus(id: string, status: BillStatus) {
  const cleanId = String(id ?? "").trim();
  if (!cleanId) return;
  await prisma.bill.update({ where: { id: cleanId }, data: { status } });
  revalidatePath("/bills");
  revalidatePath("/");
}

export async function deleteBill(id: string) {
  const cleanId = String(id ?? "").trim();
  if (!cleanId) return;
  await prisma.bill.delete({ where: { id: cleanId } });
  revalidatePath("/bills");
  revalidatePath("/");
}
