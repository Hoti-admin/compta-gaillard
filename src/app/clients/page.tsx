import { prisma } from "@/lib/prisma";
import { createClient } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-3xl font-extrabold tracking-tight text-slate-900">Clients</div>
          <div className="mt-1 text-sm text-slate-600">Création &amp; liste</div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {/* Form ajout */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-lg font-extrabold text-slate-900">Ajouter un client</div>

          <form action={createClient} className="mt-3 grid gap-2">
            <input
              name="name"
              placeholder="Nom du client (ex: Gerama Immobilier SA)"
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <button className="rounded-2xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
              Créer
            </button>
          </form>

          <div className="mt-3 text-xs text-slate-500">
            * Le client sera disponible directement dans la création de factures.
          </div>
        </div>

        {/* Liste */}
        <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-lg font-extrabold text-slate-900">Liste clients</div>
            <div className="text-sm text-slate-600">{clients.length} client(s)</div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs text-slate-600">
                <tr className="border-b">
                  <th className="py-2 text-left">Nom</th>
                  <th className="py-2 text-left">Créé le</th>
                </tr>
              </thead>
              <tbody>
                {clients.length ? (
                  clients.map((c) => (
                    <tr key={c.id} className="border-b last:border-b-0">
                      <td className="py-2 font-semibold text-slate-900">{c.name}</td>
                      <td className="py-2 text-slate-600">
                        {new Date(c.createdAt).toLocaleDateString("fr-CH")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-6 text-slate-500">
                      Aucun client pour l’instant.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}