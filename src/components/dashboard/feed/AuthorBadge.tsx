// src/components/dashboard/feed/AuthorBadge.tsx
import { Badge } from "@/components/ui/badge";
import { LEVEL_LABELS, ROLE_LABELS } from "@/lib/permissions/roles";

export function AuthorBadge({
  authorName,
  authorRole,
  authorLevel,
}: {
  authorName: string | null;
  authorRole: string | null;
  authorLevel: string | null;
}) {
  const roleLabel =
    authorRole && authorRole in ROLE_LABELS
      ? ROLE_LABELS[authorRole as keyof typeof ROLE_LABELS]
      : authorRole ?? "Member";

  const levelLabel =
    authorLevel && authorLevel in LEVEL_LABELS
      ? LEVEL_LABELS[authorLevel as keyof typeof LEVEL_LABELS]
      : null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-semibold text-on-surface">
        {authorName ?? "Unknown member"}
      </span>
      <Badge variant="info" className="text-xs">
        {roleLabel}
      </Badge>
      {levelLabel && (
        <span className="text-xs text-on-surface-variant">{levelLabel}</span>
      )}
    </div>
  );
}
