import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { normalizeError } from "@/lib/errors";
import { getPublicSelfInspectionStartPageData } from "@/modules/self-inspections/self-inspection.service";
import { SelfInspectionAccessScreen } from "@/app/self-inspections/start/[token]/self-inspection-access-screen";
import { SelfInspectionWizard } from "@/app/self-inspections/start/[token]/self-inspection-wizard";

type PublicWizardPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function PublicWizardPage({ params }: PublicWizardPageProps) {
  const { token } = await params;
  const pageData = await getPublicSelfInspectionStartPageData(token).catch((error) => {
    const normalized = normalizeError(error);

    if (normalized.statusCode === 404 || normalized.statusCode === 410) {
      notFound();
    }

    throw error;
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1160px] flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <Card className="rounded-[32px] border-[rgba(14,79,82,0.12)] bg-[linear-gradient(135deg,rgba(255,248,238,0.98),rgba(239,247,245,0.98))]">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
          Autoinspeccion del vehiculo
        </p>
        <h1 className="mt-3 font-heading text-4xl font-semibold">
          Diagnostico previo simple y rapido
        </h1>
      </Card>

      {pageData.wizardData ? (
        <SelfInspectionWizard token={token} initialData={pageData.wizardData} />
      ) : (
        <SelfInspectionAccessScreen
          token={token}
          sessionEmail={pageData.access.sessionEmail}
          sessionRole={pageData.access.sessionRole}
          statusLabel={pageData.access.statusLabel}
        />
      )}
    </div>
  );
}
