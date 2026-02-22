import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function chf(cents: number) {
  return `CHF ${(cents / 100).toFixed(2)}`;
}

export default async function DashboardPage(props: { searchParams?: Promise<any> }) {
  const sp = (await props.searchParams) ?? {};
  const year = Number(sp.year ?? new Date().getFullYear());

  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1));
  const now = new Date();

  // ✅ Factures ouvertes (OPEN) - TTC
  const openAgg = await prisma.invoice.aggregate({
    _sum: { amountGrossCents: true, amountVatCents: true },
    where: {
      issueDate: { gte: yearStart, lt: yearEnd },
      status: "OPEN",
    },
  });

  // ✅ Factures en retard (OPEN + dueDate < now)
  const overdueAgg = await prisma.invoice.aggregate({
    _sum: { amountGrossCents: true, amountVatCents: true },
    where: {
      issueDate: { gte: yearStart, lt: yearEnd },
      status: "OPEN",
      dueDate: { lt: now },
    },
  });

  const overdueCount = await prisma.invoice.count({
    where: {
      issueDate: { gte: yearStart, lt: yearEnd },
      status: "OPEN",
      dueDate: { lt: now },
    },
  });

  // ✅ Dépenses année (tout) - TTC + TVA
  const expensesAgg = await prisma.expense.aggregate({
    _sum: { amountGrossCents: true, amountVatCents: true },
    where: { date: { gte: yearStart, lt: yearEnd } },
  });

  // ✅ TVA encaissée = TVA sur factures PAYÉES
  const vatCollectedAgg = await prisma.invoice.aggregate({
    _sum: { amountVatCents: true },
    where: {
      issueDate: { gte: yearStart, lt: yearEnd },
      status: "PAID",
    },
  });

  // ✅ TVA payée = TVA sur dépenses
  const vatPaidAgg = await prisma.expense.aggregate({
    _sum: { amountVatCents: true },
    where: { date: { gte: yearStart, lt: yearEnd } },
  });

  // ✅ Achats (bills) année - TTC + TVA
  const billsAgg = await prisma.bill.aggregate({
    _sum: { amountGrossCents: true, amountVatCents: true },
    where: { issueDate: { gte: yearStart, lt: yearEnd }, status: { not: "CANCELED" } },
  });

  // ✅ Solde TVA (indicatif)
  const vatCollected = vatCollectedAgg._sum.amountVatCents ?? 0;
  const vatPaidExpenses = vatPaidAgg._sum.amountVatCents ?? 0;
  const vatPaidBills = billsAgg._sum.amountVatCents ?? 0;
  const vatPaid = vatPaidExpenses + vatPaidBills;
  const vatBalance = vatCollected - vatPaid;

  // ✅ Top factures en retard (liste)
  const overdueList = await prisma.invoice.findMany({
    where: {
      issueDate: { gte: yearStart, lt: yearEnd },
      status: "OPEN",
      dueDate: { lt: now },
    },
    orderBy: [{ dueDate: "asc" }],
    take: 8,
    select: {
      id: true,
      number: true,
      dueDate: true,
      amountGrossCents: true,
      client: { select: { id: true, name: true } },
    },
  });

  const openTotal = openAgg._sum.amountGrossCents ?? 0;
  const overdueTotal = overdueAgg._sum.amountGrossCents ?? 0;
  const expensesTotal = expensesAgg._sum.amountGrossCents ?? 0;
  const purchasesTotal = billsAgg._sum.amountGrossCents ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</div>
          <div className="mt-1 text-sm text-slate-600">Vue fiduciaire (année {year})</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form className="flex items-center gap-2">
            <select
              name="year"
              defaultValue={String(year)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {Array.from({ length: 7 }).map((_, i) => {
                const y = new Date().getFullYear() - 3 + i;
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </select>
            <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Appliquer
            </button>
          </form>

          <Link
            href="/invoices"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Factures
          </Link>
          <Link
            href="/expenses"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Dépenses
          </Link>
          <Link
            href="/bills"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Achats
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-6 grid gap-3 md:grid-cols-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-600">FACTURES OUVERTES</div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{chf(openTotal)}</div>
          <div className="mt-1 text-xs text-slate-500">Status OPEN (TTC)</div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-600">FACTURES EN RETARD</div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{chf(overdueTotal)}</div>
          <div className="mt-1 text-xs text-slate-500">{overdueCount} facture(s)</div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-600">DÉPENSES</div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{chf(expensesTotal)}</div>
          <div className="mt-1 text-xs text-slate-500">TTC (année)</div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-600">ACHATS</div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{chf(purchasesTotal)}</div>
          <div className="mt-1 text-xs text-slate-500">TTC (année)</div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-600">TVA ENCAISSÉE</div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{chf(vatCollected)}</div>
          <div className="mt-1 text-xs text-slate-500">Factures PAYÉES</div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-600">TVA (SOLDE)</div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{chf(vatBalance)}</div>
          <div className="mt-1 text-xs text-slate-500">
            encaissée {chf(vatCollected)} − payée {chf(vatPaid)} (dépenses {chf(vatPaidExpenses)} + achats {chf(vatPaidBills)})
          </div>
        </div>
      </div>

      {/* Bloc retards */}
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-lg font-extrabold text-slate-900">Factures en retard</div>
            <Link href="/invoices" className="text-sm font-semibold text-blue-700 hover:underline">
              Ouvrir les factures →
            </Link>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs text-slate-600">
                <tr className="border-b">
                  <th className="py-2 text-left">N°</th>
                  <th className="py-2 text-left">Client</th>
                  <th className="py-2 text-left">Échéance</th>
                  <th className="py-2 text-right">TTC</th>
                </tr>
              </thead>
              <tbody>
                {overdueList.length ? (
                  overdueList.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-b-0">
                      <td className="py-2 font-semibold">{inv.number}</td>
                      <td className="py-2">{inv.client?.name ?? "—"}</td>
                      <td className="py-2">{new Date(inv.dueDate).toLocaleDateString("fr-CH")}</td>
                      <td className="py-2 text-right font-semibold">{chf(inv.amountGrossCents)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-slate-500">
                      ✅ Aucune facture en retard pour {year}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-lg font-extrabold text-slate-900">Raccourcis</div>
          <div className="mt-3 grid gap-2">
            <Link
              href="/invoices/create"
              className="rounded-2xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              + Nouvelle facture
            </Link>
            <Link
              href="/suppliers"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Fournisseurs
            </Link>
            <Link
              href="/clients"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Clients
            </Link>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            * Tous les montants sont en CHF, basés sur les champs <code>amountGrossCents</code> &amp;{" "}
            <code>amountVatCents</code>.
          </div>
        </div>
      </div>
    </div>
  );
}