import { Card } from "@/components/ui/card";
import { InsuranceCaseForm } from "@/app/liquidador/insurance-case-form";

export default async function NewInsuranceCasePage() {
  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
          Nuevo siniestro
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">
          Registrar caso para evaluacion del taller
        </h1>
      </Card>

      <InsuranceCaseForm />
    </div>
  );
}
