import { prisma } from "@/lib/prisma";
import { PageTitle, Card, Table, A, Input, Select, ButtonGhost, Badge } from "@/components/ui";
import { chf } from "@/lib/format";

export default async function ExpensesPage({
  searchParams,
}: {
  // Next.js 16 can pass `searchParams` as a Promise in Server Components.
  // We support both shapes to avoid runtime errors.
  searchParams?: Promise<{ year?: string }> | { year?: string };
}) {
  const sp = await Promise.resolve(searchParams as any);
  const year = Number(sp?.year ?? new Date().getFullYear());

  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: from, lt: to } },
    orderBy: { date: "desc" },
    take: 1000,
  });

  const total = expenses.reduce((s, e) => s + e.amountTTC, 0);

  return (
    <div>
      <PageTitle title="Dépenses" subtitle={`Dépenses entreprise (année ${year})`} />

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <div className="text-sm text-slate-500">Total (TTC)</div>
          <div className="mt-1 text-2xl font-semibold">{chf(total)}</div>
        </Card>
      </div>

      <div className="mt-4 text-slate-600">
        (UI Dépenses à compléter selon tes catégories/secteurs — base OK)
      </div>
    </div>
  );
}