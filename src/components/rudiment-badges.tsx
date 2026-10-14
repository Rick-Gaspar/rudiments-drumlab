import { cn } from "@/lib/utils";
import { FAMILY_LABELS, type RudimentFamily } from "@/data/rudiments";
import { STATUS_LABELS, type LearningStatus } from "@/lib/practice-store";

const familyColor: Record<RudimentFamily, string> = {
  rolls: "text-family-rolls bg-family-rolls/10 border-family-rolls/30",
  diddles: "text-family-diddles bg-family-diddles/10 border-family-diddles/30",
  flams: "text-family-flams bg-family-flams/10 border-family-flams/30",
  drags: "text-family-drags bg-family-drags/10 border-family-drags/30",
};

export function FamilyBadge({ family, className }: { family: RudimentFamily; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", familyColor[family], className)}>
      {FAMILY_LABELS[family]}
    </span>
  );
}

const statusStyle: Record<LearningStatus, string> = {
  not_started: "text-muted-foreground",
  learning: "text-status-learning",
  practiced: "text-status-practiced",
};

export function StatusDot({ status }: { status: LearningStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", statusStyle[status])}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}
