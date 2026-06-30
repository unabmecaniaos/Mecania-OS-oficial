import { UserRole, WorkOrderStatus } from "@prisma/client";
import { requireApiUser } from "@/modules/auth/auth.service";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Wrench } from "lucide-react";

export default async function MechanicProfilePage({ params }: { params: Promise<{ mechanicId: string }> }) {
  const { mechanicId } = await params;
  await requireApiUser([UserRole.ADMIN]);

  const mechanic = await prisma.user.findUnique({
    where: { id: mechanicId, role: UserRole.MECHANIC },
    include: {
      assignedWorkOrders: {
        where: {
          status: { in: [WorkOrderStatus.READY_FOR_DELIVERY, WorkOrderStatus.DELIVERED] },
        },
      },
      paymentsReceived: {
        orderBy: { paymentDate: "desc" },
      },
    },
  });

  if (!mechanic) {
    redirect("/performance");
  }

  // Calculate metrics
  const orders = mechanic.assignedWorkOrders;
  const totalOrders = orders.length;
  let totalResolutionTimeHours = 0;
  let completedOrdersWithTime = 0;

  orders.forEach((order) => {
    const endTime = order.closedDate || order.updatedAt;
    if (order.intakeDate && endTime) {
      const diffMs = endTime.getTime() - order.intakeDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours >= 0) {
        totalResolutionTimeHours += diffHours;
        completedOrdersWithTime++;
      }
    }
  });

  const averageTimeHours = completedOrdersWithTime > 0 ? totalResolutionTimeHours / completedOrdersWithTime : 0;

  const conceptLabels = {
    BASE_SALARY: "Sueldo Base",
    ORDER_BONUS: "Bono por Órdenes",
    ADVANCE_PAYMENT: "Adelanto",
  };

  return (
    <div className="space-y-6">
      <Link href="/performance" className="inline-flex items-center gap-2 text-sm text-[color:var(--muted-strong)] hover:text-blue-600 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver al panel
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold text-[color:var(--foreground)]">Perfil de {mechanic.name}</h1>
        <p className="text-[color:var(--muted-strong)]">{mechanic.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-[24px] border border-[rgba(23,52,94,0.12)] bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Wrench className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-[color:var(--muted-strong)]">OTs Completadas Totales</p>
            <p className="text-3xl font-bold text-[color:var(--foreground)]">{totalOrders}</p>
          </div>
        </div>

        <div className="rounded-[24px] border border-[rgba(23,52,94,0.12)] bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Clock className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-[color:var(--muted-strong)]">Tiempo Promedio de Resolución</p>
            <p className="text-3xl font-bold text-[color:var(--foreground)]">{Math.round(averageTimeHours)} hrs</p>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-[rgba(23,52,94,0.12)] bg-white overflow-hidden shadow-sm mt-8">
        <div className="px-6 py-5 border-b border-[rgba(23,52,94,0.12)]">
          <h2 className="text-xl font-semibold">Historial de Pagos y Nómina</h2>
        </div>
        
        {mechanic.paymentsReceived.length === 0 ? (
          <div className="p-8 text-center text-[color:var(--muted)]">
            No se han registrado pagos para este mecánico.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[rgba(248,251,255,0.5)] text-sm font-medium text-[color:var(--muted-strong)]">
              <tr>
                <th className="px-6 py-4 font-medium border-b border-[rgba(23,52,94,0.12)]">Fecha</th>
                <th className="px-6 py-4 font-medium border-b border-[rgba(23,52,94,0.12)]">Concepto</th>
                <th className="px-6 py-4 font-medium border-b border-[rgba(23,52,94,0.12)]">Detalle</th>
                <th className="px-6 py-4 font-medium border-b border-[rgba(23,52,94,0.12)] text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(23,52,94,0.12)]">
              {mechanic.paymentsReceived.map((payment) => (
                <tr key={payment.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payment.paymentDate.toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-6 py-4 font-medium text-[color:var(--foreground)]">
                    {conceptLabels[payment.concept]}
                  </td>
                  <td className="px-6 py-4 text-sm text-[color:var(--muted)]">
                    {payment.note || "-"}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-green-700">
                    ${payment.amount.toLocaleString("es-CL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
