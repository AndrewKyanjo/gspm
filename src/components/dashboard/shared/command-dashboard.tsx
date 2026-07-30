import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function compactCurrency(value: number) {
  const formatter = new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  });

  if (value >= 1_000_000_000) return `UGX ${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `UGX ${(value / 1_000_000).toFixed(1)}M`;
  return formatter.format(value);
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function relativeDate(value: string | null) {
  if (!value) return "Recently";
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className={cn("h-1", accent)} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-on-surface-variant">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-on-surface">{value}</p>
            <p className="mt-2 text-xs text-on-surface-variant">{helper}</p>
          </div>
          <div className="rounded-md bg-surface-container p-2 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function HealthScore({ score, label }: { score: number; label: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-on-surface-variant">Health score</p>
            <p className="mt-2 text-3xl font-semibold text-on-surface">{score}%</p>
            <p className="mt-2 text-xs text-on-surface-variant">{label}</p>
          </div>
          <div className="h-2 w-32 rounded-full bg-surface-container">
            <div className="h-2 rounded-full bg-emerald-700" style={{ width: `${score}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TrendBars({
  title,
  items,
  formatter = (value) => value.toLocaleString(),
}: {
  title: string;
  items: Array<{ label: string; value: number }>;
  formatter?: (value: number) => string;
}) {
  const recent = items.slice(-9);
  const max = Math.max(...recent.map((item) => item.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-44 items-end gap-2">
          {recent.length ? (
            recent.map((item) => (
              <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-primary"
                  style={{ height: `${Math.max(12, (item.value / max) * 100)}%` }}
                  title={`${item.label}: ${formatter(item.value)}`}
                />
                <span className="truncate text-[11px] text-on-surface-variant">{item.label}</span>
              </div>
            ))
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-on-surface-variant">
              No trend data yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusDonut({
  title,
  segments,
}: {
  title: string;
  segments: Array<{ label: string; value: number; color: string }>;
}) {
  const total = Math.max(segments.reduce((sum, item) => sum + item.value, 0), 1);
  const gradient = segments
    .reduce(
      (state, segment) => {
        const start = state.cursor;
        const end = start + (segment.value / total) * 100;
        return {
          cursor: end,
          parts: [...state.parts, `${segment.color} ${start}% ${end}%`],
        };
      },
      { cursor: 0, parts: [] as string[] },
    )
    .parts.join(", ");
  const primary = Math.round((segments[0]?.value ?? 0) / total * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <div className="grid h-36 w-36 place-items-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
            <div className="grid h-24 w-24 place-items-center rounded-full bg-surface-container-lowest">
              <div className="text-center">
                <p className="text-2xl font-semibold text-on-surface">{primary}%</p>
                <p className="text-xs text-on-surface-variant">{segments[0]?.label ?? "primary"}</p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 text-sm">
            {segments.map((segment) => (
              <div key={segment.label} className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-2 text-on-surface-variant">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                  {segment.label}
                </span>
                <span className="font-medium text-on-surface">{segment.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardTimeline({
  title,
  items,
}: {
  title: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    href: string;
    createdAt: string | null;
    module: string;
    icon: LucideIcon;
    badgeVariant?: "default" | "success" | "warning" | "danger" | "info";
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {items.length ? (
            items.map((item) => {
              const Icon = item.icon;
              return (
                <div key={`${item.module}-${item.id}`} className="flex gap-4 border-b border-outline-variant pb-4 last:border-b-0 last:pb-0">
                  <div className="mt-1 rounded-md bg-surface-container p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-on-surface">{item.title}</p>
                      <Badge variant={item.badgeVariant ?? "default"}>{item.module}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-on-surface-variant">{item.description}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{relativeDate(item.createdAt)}</p>
                  </div>
                  <Button href={item.href} size="sm" variant="ghost" aria-label={`Open ${item.title}`}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-on-surface-variant">No recent activity yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationsPanel({
  items,
}: {
  items: Array<{ title: string; href: string; tone: "warning" | "success" | "info" | "danger" }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((notification) => (
            <Button
              key={notification.title}
              href={notification.href}
              variant="secondary"
              className="h-auto w-full justify-start whitespace-normal px-3 py-3 text-left"
            >
              <Bell
                className={cn(
                  "h-4 w-4 shrink-0",
                  notification.tone === "warning" && "text-amber-600",
                  notification.tone === "success" && "text-emerald-700",
                  notification.tone === "info" && "text-blue-700",
                  notification.tone === "danger" && "text-rose-700",
                )}
              />
              <span>{notification.title}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProgressList({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; label: string; helper: string | null; value: number; accent?: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.length ? (
            items.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-on-surface">{item.label}</p>
                    {item.helper ? <p className="truncate text-xs text-on-surface-variant">{item.helper}</p> : null}
                  </div>
                  <span className="text-sm font-medium text-on-surface">{item.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-container">
                  <div
                    className={cn("h-2 rounded-full", item.accent ?? "bg-primary")}
                    style={{ width: `${Math.max(3, Math.min(100, item.value))}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-on-surface-variant">No progress records yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function cssVars(vars: Record<string, string>) {
  return vars as CSSProperties;
}
