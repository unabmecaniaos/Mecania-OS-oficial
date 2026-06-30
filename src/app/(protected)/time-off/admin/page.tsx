import { UserRole } from "@prisma/client";
import { requireApiUser } from "@/modules/auth/auth.service";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateTimeOffStatusAction } from "@/app/(protected)/time-off/actions";

export default async function AdminTimeOffPage() {
  await requireApiUser([UserRole.ADMIN]);
  
  const requests = await prisma.timeOffRequest.findMany({
    include: { user: true },
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
        <h1 className="font-heading text-3xl font-semibold text-[color:var(--foreground)]">Bandeja de Permisos</h1>
        <p className="text-[color:var(--muted-strong)]">Administra las solicitudes de vacaciones y días libres del equipo.</p>
      </div>

      <div className="space-y-4 rounded-[24px] border border-[rgba(23,52,94,0.12)] bg-white p-6 shadow-sm">
        {requests.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-[rgba(95,127,168,0.2)] bg-[rgba(248,251,255,0.5)]">
            <p className="text-sm text-[color:var(--muted)]">No hay solicitudes en el sistema.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border border-[rgba(95,127,168,0.12)] rounded-2xl gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[color:var(--foreground)]">{req.user.name}</span>
                    <Badge tone={statusMap[req.status].tone}>
                      {statusMap[req.status].label}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-[color:var(--foreground)]">
                    {req.startDate.toLocaleDateString("es-ES")} - {req.endDate.toLocaleDateString("es-ES")}
                  </p>
                  <p className="text-sm text-[color:var(--muted-strong)] italic">"{req.reason}"</p>
                  <p className="text-xs text-[color:var(--muted)]">Solicitado el {req.createdAt.toLocaleDateString("es-ES")}</p>
                </div>
                
                {req.status === "PENDING" && (
                  <div className="flex gap-2 shrink-0">
                    <form action={updateTimeOffStatusAction.bind(null, req.id)}>
                      <input type="hidden" name="nextStatus" value="REJECTED" />
                      <SubmitButton
                        label="Rechazar"
                        pendingLabel="..."
                        className="h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 shadow-none"
                      />
                    </form>
                    <form action={updateTimeOffStatusAction.bind(null, req.id)}>
                      <input type="hidden" name="nextStatus" value="APPROVED" />
                      <SubmitButton
                        label="Aprobar"
                        pendingLabel="..."
                        className="h-10 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 shadow-none"
                      />
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
