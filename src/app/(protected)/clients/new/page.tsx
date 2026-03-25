import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/app/(protected)/clients/client-form";

export default function NewClientPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="rounded-[22px]">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Alta rapida
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-white">
            Registrar cliente
          </h1>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
            Crea una ficha base para asociar vehiculos, ordenes y seguimiento comercial.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.64)] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Recomendado
            </p>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
              Completa al menos nombre, telefono y correo para asegurar trazabilidad y contacto.
            </p>
          </div>

          <Link href="/clients">
            <Button className="w-full" variant="secondary">
              Volver al listado
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="rounded-[22px]">
        <div className="mb-6 border-b border-[color:var(--border)] pb-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent)]">
            Formulario
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold text-white">Datos del cliente</h2>
        </div>
        <ClientForm />
      </Card>
    </div>
  );
}

