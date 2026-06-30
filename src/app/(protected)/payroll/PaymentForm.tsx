"use client";

import { useState } from "react";
import { createMechanicPaymentAction } from "./actions";
import { Loader2 } from "lucide-react";

type MechanicOption = { id: string; name: string };

export function PaymentForm({ mechanics }: { mechanics: MechanicOption[] }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await createMechanicPaymentAction(formData);

    if (!result.success) {
      setError(result.error || "Ocurrió un error");
    } else {
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setSuccess(false), 3000);
    }
    
    setIsPending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
      {success && <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">Pago registrado correctamente</div>}

      <div className="space-y-2">
        <label htmlFor="mechanicId" className="text-sm font-medium text-[color:var(--foreground)]">Mecánico</label>
        <select 
          id="mechanicId" 
          name="mechanicId" 
          required 
          className="w-full h-11 px-3 py-2 rounded-xl border border-[rgba(23,52,94,0.12)] bg-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
        >
          <option value="">Seleccione un mecánico...</option>
          {mechanics.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="concept" className="text-sm font-medium text-[color:var(--foreground)]">Concepto</label>
        <select 
          id="concept" 
          name="concept" 
          required 
          className="w-full h-11 px-3 py-2 rounded-xl border border-[rgba(23,52,94,0.12)] bg-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
        >
          <option value="BASE_SALARY">Sueldo Base</option>
          <option value="ORDER_BONUS">Bono por Órdenes</option>
          <option value="ADVANCE_PAYMENT">Adelanto</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="amount" className="text-sm font-medium text-[color:var(--foreground)]">Monto ($)</label>
        <input 
          type="number" 
          id="amount" 
          name="amount" 
          required 
          min="1"
          className="w-full h-11 px-3 py-2 rounded-xl border border-[rgba(23,52,94,0.12)] bg-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          placeholder="Ej: 500000"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="paymentDate" className="text-sm font-medium text-[color:var(--foreground)]">Fecha de Pago</label>
        <input 
          type="date" 
          id="paymentDate" 
          name="paymentDate" 
          required 
          defaultValue={new Date().toISOString().split('T')[0]}
          className="w-full h-11 px-3 py-2 rounded-xl border border-[rgba(23,52,94,0.12)] bg-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="note" className="text-sm font-medium text-[color:var(--foreground)]">Nota (Opcional)</label>
        <input 
          type="text" 
          id="note" 
          name="note" 
          className="w-full h-11 px-3 py-2 rounded-xl border border-[rgba(23,52,94,0.12)] bg-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          placeholder="Detalle adicional..."
        />
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="w-full h-11 mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? "Registrando..." : "Registrar Pago"}
      </button>
    </form>
  );
}
