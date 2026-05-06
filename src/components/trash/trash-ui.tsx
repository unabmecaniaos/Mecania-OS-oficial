import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import {
  moveToTrashAction,
  deleteTrashItemForeverAction,
  restoreTrashItemAction,
} from "@/app/(protected)/trash/actions";
import type { TrashEntityType } from "@/modules/trash/trash.service";

type TrashPageHeaderProps = {
  backHref: string;
  backLabel: string;
  count: number;
  description: string;
  eyebrow: string;
  title: string;
};

export function TrashPageHeader({
  backHref,
  backLabel,
  count,
  description,
  eyebrow,
  title,
}: TrashPageHeaderProps) {
  return (
    <Card className="rounded-2xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted-strong)]">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-[color:var(--border)] bg-white/80 px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Elementos en papelera
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold text-[color:var(--foreground)]">
              {count}
            </p>
          </div>
          <Link href={backHref}>
            <Button size="sm" variant="secondary">
              {backLabel}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
  );
}

export function SectionTrashLink({
  href,
  label = "Papelera",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link href={href}>
      <Button className="min-w-[148px]" variant="secondary">
        {label}
      </Button>
    </Link>
  );
}

export function MoveToTrashButton({
  entityId,
  entityType,
  redirectTo,
}: {
  entityId: string;
  entityType: Exclude<TrashEntityType, "selfInspection">;
  redirectTo: string;
}) {
  return (
    <form action={moveToTrashAction}>
      <input name="entityId" type="hidden" value={entityId} />
      <input name="entityType" type="hidden" value={entityType} />
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <Button
        aria-label="Mover a papelera"
        className="h-9 w-9 rounded-full px-0"
        size="sm"
        title="Mover a papelera"
        type="submit"
        variant="danger"
      >
        <TrashIcon />
      </Button>
    </form>
  );
}

type TrashActionRowProps = {
  allowPermanentDelete?: boolean;
  entityId: string;
  entityType: TrashEntityType;
  redirectTo: string;
};

export function TrashActionRow({
  allowPermanentDelete = true,
  entityId,
  entityType,
  redirectTo,
}: TrashActionRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={restoreTrashItemAction}>
        <input name="entityId" type="hidden" value={entityId} />
        <input name="entityType" type="hidden" value={entityType} />
        <input name="redirectTo" type="hidden" value={redirectTo} />
        <Button size="sm" type="submit" variant="secondary">
          Restaurar
        </Button>
      </form>

      {allowPermanentDelete ? (
        <form action={deleteTrashItemForeverAction}>
          <input name="entityId" type="hidden" value={entityId} />
          <input name="entityType" type="hidden" value={entityType} />
          <input name="redirectTo" type="hidden" value={redirectTo} />
          <Button size="sm" type="submit" variant="danger">
            Eliminar definitivo
          </Button>
        </form>
      ) : null}
    </div>
  );
}

export function TrashMeta({
  daysRemaining,
  deletedAt,
}: {
  daysRemaining: number | null;
  deletedAt: Date | null;
}) {
  return (
    <div className="text-sm text-[color:var(--muted)]">
      <p>En papelera desde {formatDateTime(deletedAt)}</p>
      <p>
        {daysRemaining === 0
          ? "Se elimina en la siguiente limpieza automatica."
          : `Quedan ${daysRemaining} dia${daysRemaining === 1 ? "" : "s"} para recuperarlo.`}
      </p>
    </div>
  );
}

export function TrashEmptyState({ label }: { label: string }) {
  return (
    <Card className="rounded-xl text-center">
      <p className="text-[color:var(--muted-strong)]">{label}</p>
    </Card>
  );
}
