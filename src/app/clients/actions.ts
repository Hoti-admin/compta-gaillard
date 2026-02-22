"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createClient(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) return;

  await prisma.client.create({
    data: { name },
  });

  revalidatePath("/clients");
}