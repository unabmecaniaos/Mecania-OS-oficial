import { redirect } from "next/navigation";

export default function InsuranceCasesPage() {
  redirect("/work-orders?view=liquidator-clients");
}
