import { prisma } from "@/lib/prisma";

export default async function SalariesPage() {
  const salaries = await prisma.salary.findMany({
    orderBy: { month: "desc" },
  });

  return (
    <div>
      <h1>Salaires</h1>
      <ul>
        {salaries.map((s) => (
          <li key={s.id}>
            {s.month.toISOString().slice(0, 7)} – {s.netCents / 100} CHF
          </li>
        ))}
      </ul>
    </div>
  );
}
