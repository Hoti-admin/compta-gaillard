import { prisma } from "@/lib/prisma";
import { PageTitle, Card, Table, A, Input, Select, ButtonGhost, Badge } from "@/components/ui";
import { chf, isoDate } from "@/lib/format";
import { BillStatus, BillCategory } from "@prisma/client";
import { deleteBill, updateBillStatus } from "@/app/bills/actions";

export default async function BillsPage({
  searchParams,
}: {
  searchParams?: Promise<{ year?: string; q?: string; status?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp?.q ?? "").trim();
  const status = (sp?.status ?? "all") as string;
  const sort = (sp?.sort ?? "date_desc") as string;

  const now = new Date();
  const year = Number(sp?.year || now.getFullYear());

  const from = new Date(`${year}-01-01T00:00:00.000Z`);
  const to = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const orderBy =
    sort === "date_asc" ? ({ issueDate: "asc" } as const) : ({ issueDate: "desc" } as const);

  const bills = await prisma.bill.findMany({
    where: {
      issueDate: { gte: from, lt: to },
      ...(status !== "all" ? { status: status as any } : {}),
      ...(q
        ? {
            OR: [
              { notes: { contains: q, mode: "insensitive" as const } },
              { supplier: { name: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    orderBy,
    include: { supplier: true },
    take: 1000,
  });

  const totalTTC = bills.reduce((s, b) => s + b.amountTTC, 0);
  const totalTVA = bills.reduce((s, b) => s + (b.vatAmount ?? 0), 0);

  const statuses: { value: string; label: string }[] = [
    { value: "all", label: "Tous" },
    { value: "OPEN", label: "Ouvert" },
    { value: "PAID", label: "Payé" },
    { value: "CANCELLED", label: "Annulé" },
  ];

  const years = [year - 1, year, year + 1];

  return (
    <div>
      <PageTitle
        title="Achats"
        subtitle={`Factures fournisseurs & achats (année ${year})`}
      />

      <form className="mb-4 flex flex-wrap items-center gap-2" action="/bills" method="get">
        <Select name="year" defaultValue={String(year)} className="w-28">
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </Select>

        <Input
          name="q"
          placeholder="Rechercher (fournisseur, notes...)"
          defaultValue={q}
          className="w-64"
        />

        <Select name="status" defaultValue={status} className="w-44">
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>

        <Select name="sort" defaultValue={sort} className="w-36">
          <option value="date_desc">Date ↓</option>
          <option value="date_asc">Date ↑</option>
        </Select>

        <ButtonGhost type="submit">Appliquer</ButtonGhost>
        <A href="/expenses" className="ml-2">
          Voir Dépenses
        </A>
      </form>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <div className="text-sm text-slate-500">Total achats (TTC)</div>
          <div className="mt-1 text-2xl font-semibold">{chf(totalTTC)}</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500">TVA payée (achats)</div>
          <div className="mt-1 text-2xl font-semibold">{chf(totalTVA)}</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500">Nb lignes</div>
          <div className="mt-1 text-2xl font-semibold">{bills.length}</div>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="mb-2 text-sm font-semibold">Liste des achats ({year})</div>
        <Table
          columns={["Date", "Fournisseur", "Catégorie", "TTC", "TVA", "Notes", "Statut", "Actions"]}
          rows={
            bills.length === 0
              ? [
                  [
                    <span key="empty" className="text-slate-500">
                      Aucun achat trouvé pour {year}.
                    </span>,
                  ],
                ]
              : bills.map((b) => [
                  isoDate(b.issueDate),
                  <A key={b.id} href={`/suppliers?name=${encodeURIComponent(b.supplier.name)}`}>
                    {b.supplier.name}
                  </A>,
                  b.category ?? "-",
                  chf(b.amountTTC),
                  chf(b.vatAmount ?? 0),
                  b.notes ?? "-",
                  b.status === "PAID" ? (
                    <Badge key="paid">PAYÉ</Badge>
                  ) : b.status === "OPEN" ? (
                    <Badge key="open">OUVERT</Badge>
                  ) : (
                    <Badge key="canceled">ANNULÉ</Badge>
                  ),
                  <div key="actions" className="flex gap-2">
                    {b.status !== "PAID" && (
                      <form
                        action={async () => {
                          "use server";
                          await updateBillStatus(b.id, BillStatus.PAID);
                        }}
                      >
                        <ButtonGhost type="submit">Marquer payé</ButtonGhost>
                      </form>
                    )}
                    {b.status !== "OPEN" && (
                      <form
                        action={async () => {
                          "use server";
                          await updateBillStatus(b.id, BillStatus.OPEN);
                        }}
                      >
                        <ButtonGhost type="submit">Remettre ouvert</ButtonGhost>
                      </form>
                    )}
                    <form
                      action={async () => {
                        "use server";
                        await deleteBill(b.id);
                      }}
                    >
                      <ButtonGhost type="submit">Supprimer</ButtonGhost>
                    </form>
                  </div>,
                ])
          }
        />
      </Card>
    </div>
  );
}