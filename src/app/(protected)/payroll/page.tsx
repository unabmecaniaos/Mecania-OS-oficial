import { UserRole, PaymentConcept } from "@prisma/client";
import { requireApiUser } from "@/modules/auth/auth.service";
import { prisma } from "@/lib/prisma";
import { Banknote, Users } from "lucide-react";
import { PaymentForm } from "./PaymentForm";
import Link from "next/link";

export default async function PayrollPage() {
  await requireApiUser([UserRole.ADMIN]);

  const mechanics = await prisma.user.findMany({
    where: { role: UserRole.MECHANIC, active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const recentPayments = await prisma.mechanicPayment.findMany({
    include: {
      mechanic: true,
      admin: true,
    },
    orderBy: { paymentDate: "desc" },
    take: 20,
  });

  const conceptLabels = {
    BASE_SALARY: "Sueldo Base",
    ORDER_BONUS: "Bono por Órdenes",
    ADVANCE_PAYMENT: "Adelanto",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold text-[color:var(--foreground)]">Nómina y Pagos</h1>
          <p className="text-[color:var(--muted-strong)]">Registra y administra los pagos a los mecánicos del taller.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="rounded-[24px] border border-[rgba(23,52,94,0.12)] bg-white p-6 shadow-sm sticky top-24">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Banknote className="h-5 w-5 text-green-600" /> Nuevo Pago
            </h2>
            <PaymentForm mechanics={mechanics} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[24px] border border-[rgba(23,52,94,0.12)] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" /> Últimos Pagos Registrados
            </h2>
            
            {recentPayments.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-[rgba(95,127,168,0.2)] bg-[rgba(248,251,255,0.5)]">
                <p className="text-sm text-[color:var(--muted)]">No hay pagos registrados aún.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[rgba(95,127,168,0.12)] hover:bg-slate-50 transition-colors gap-4">
                    <div>
                      <Link href={`/performance/${payment.mechanicId}`} className="font-semibold text-blue-600 hover:underline">
                        {payment.mechanic.name}
                      </Link>
                      <p className="text-sm text-[color:var(--foreground)]">{conceptLabels[payment.concept]}</p>
                      {payment.note && <p className="text-xs text-[color:var(--muted-strong)] italic">"{payment.note}"</p>}
                    </div>
                    
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-green-700">
                        ${payment.amount.toLocaleString("es-CL")}
                      </p>
                      <p className="text-xs text-[color:var(--muted)]">
                        {payment.paymentDate.toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
