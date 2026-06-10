import { SelfInspectionRiskLevel } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { SELF_INSPECTION_RISK_LABELS } from "@/modules/self-inspections/self-inspection.constants";

export function SelfInspectionRiskBadge({
  level,
}: {
  level: SelfInspectionRiskLevel;
}) {
  const tone =
    level === SelfInspectionRiskLevel.LOW
      ? "neutral"
      : level === SelfInspectionRiskLevel.MEDIUM
        ? "info"
        : "warning";

  return (
    <Badge
      className={
        level === SelfInspectionRiskLevel.CRITICAL
          ? "border-[rgba(180,35,24,0.2)] bg-[color:var(--danger-soft)] text-[color:var(--danger)]"
          : undefined
      }
      tone={tone}
    >
      Riesgo {SELF_INSPECTION_RISK_LABELS[level]}
    </Badge>
  );
}
