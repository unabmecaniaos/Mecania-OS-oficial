import { UserRole } from "@prisma/client";
import { requireApiUser } from "@/modules/auth/auth.service";
import { prisma } from "@/lib/prisma";
import { TimeOffForm } from "@/components/time-off/TimeOffForm";
import { Badge } from "@/components/ui/badge";

export default async function TimeOffPage() {
  const session = await requireApiUser([UserRole.MECHANIC, UserRole.ADMIN]);
  
  const requests = await prisma.timeOffRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const statusMap = {
    PENDING: { label: "Pendiente", tone: "neutral" as const },
    APPROVED: { label: "Aprobado", tone: "success" as const },
    REJECTED: { label: "Rechazado", tone: "warning" as const },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold text-[color:var(--foreground)]">Vacaciones y Permisos</h1>
        <p className="text-[color:var(--muted-strong)]">Gestiona tus días libres y verifica el estado de tus solicitudes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TimeOffForm />
        </div>

        <div className="lg:col-span-2 space-y-4 rounded-[24px] border border-[rgba(23,52,94,0.12)] bg-white p-6 shadow-sm">
          <h3 className="font-heading text-xl font-semibold text-[color:var(--foreground)]">Historial de Solicitudes</h3>
          
          {requests.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-[rgba(95,127,168,0.2)] bg-[rgba(248,251,255,0.5)]">
              <p className="text-sm text-[color:var(--muted)]">No tienes solicitudes registradas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-[rgba(95,127,168,0.12)] rounded-2xl">
                  <div className="space-y-1">
                    <p className="font-medium text-[color:var(--foreground)]">
                      {req.startDate.toLocaleDateString("es-ES")} - {req.endDate.toLocaleDateString("es-ES")}
                    </p>
                    <p className="text-sm text-[color:var(--muted-strong)]">{req.reason}</p>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <Badge tone={statusMap[req.status].tone}>
                      {statusMap[req.status].label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
