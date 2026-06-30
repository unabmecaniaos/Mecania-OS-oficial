import { UserRole, WorkOrderStatus } from "@prisma/client";
import { requireApiUser } from "@/modules/auth/auth.service";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Clock, Trophy, Wrench } from "lucide-react";

export default async function PerformancePage() {
  await requireApiUser([UserRole.ADMIN]);

  // Fetch mechanics and their finished work orders
  const mechanics = await prisma.user.findMany({
    where: { role: UserRole.MECHANIC, active: true },
    include: {
      assignedWorkOrders: {
        where: {
          status: { in: [WorkOrderStatus.READY_FOR_DELIVERY, WorkOrderStatus.DELIVERED] },
        },
      },
    },
  });

  // Calculate metrics
  const performanceData = mechanics.map((mechanic) => {
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

    return {
      id: mechanic.id,
      name: mechanic.name,
      email: mechanic.email,
      totalOrders,
      averageTimeHours: Math.round(averageTimeHours),
    };
  });

  // Sort by total orders descending
  performanceData.sort((a, b) => b.totalOrders - a.totalOrders);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold text-[color:var(--foreground)]">Panel de Rendimiento</h1>
        <p className="text-[color:var(--muted-strong)]">Métricas de productividad de los mecánicos y tiempos de resolución.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-[24px] border border-[rgba(23,52,94,0.12)] bg-white p-6 shadow-sm flex flex-col gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[color:var(--muted-strong)]">Top Mecánico del Mes</p>
            <p className="text-2xl font-bold text-[color:var(--foreground)]">
              {performanceData.length > 0 && performanceData[0].totalOrders > 0 ? performanceData[0].name : "N/A"}
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-[rgba(23,52,94,0.12)] bg-white p-6 shadow-sm flex flex-col gap-4">
          <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[color:var(--muted-strong)]">Total OTs Completadas</p>
            <p className="text-2xl font-bold text-[color:var(--foreground)]">
              {performanceData.reduce((acc, curr) => acc + curr.totalOrders, 0)}
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-[rgba(23,52,94,0.12)] bg-white p-6 shadow-sm flex flex-col gap-4">
          <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[color:var(--muted-strong)]">Promedio Global (hrs)</p>
            <p className="text-2xl font-bold text-[color:var(--foreground)]">
              {performanceData.length > 0 
                ? Math.round(performanceData.reduce((acc, curr) => acc + curr.averageTimeHours, 0) / performanceData.filter(p => p.averageTimeHours > 0).length || 1) 
                : 0} hrs
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-[rgba(23,52,94,0.12)] bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[rgba(248,251,255,0.5)] text-sm font-medium text-[color:var(--muted-strong)]">
            <tr>
              <th className="px-6 py-4 font-medium border-b border-[rgba(23,52,94,0.12)]">Ranking</th>
              <th className="px-6 py-4 font-medium border-b border-[rgba(23,52,94,0.12)]">Mecánico</th>
              <th className="px-6 py-4 font-medium border-b border-[rgba(23,52,94,0.12)]">OTs Completadas</th>
              <th className="px-6 py-4 font-medium border-b border-[rgba(23,52,94,0.12)]">Tiempo Promedio</th>
              <th className="px-6 py-4 font-medium border-b border-[rgba(23,52,94,0.12)]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(23,52,94,0.12)]">
            {performanceData.map((mechanic, index) => (
              <tr key={mechanic.id} className="transition-colors hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm ${
                    index === 0 ? "bg-amber-100 text-amber-700" :
                    index === 1 ? "bg-slate-200 text-slate-700" :
                    index === 2 ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-500"
                  }`}>
                    #{index + 1}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-[color:var(--foreground)]">{mechanic.name}</p>
                  <p className="text-xs text-[color:var(--muted)]">{mechanic.email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium">{mechanic.totalOrders}</span>
                </td>
                <td className="px-6 py-4">
                  {mechanic.averageTimeHours > 0 ? `${mechanic.averageTimeHours} hrs` : "N/A"}
                </td>
                <td className="px-6 py-4">
                  <Link 
                    href={`/performance/${mechanic.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Ver Perfil <ArrowRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
            {performanceData.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[color:var(--muted)]">
                  No hay mecánicos registrados o activos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
