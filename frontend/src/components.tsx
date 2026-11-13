import { STATUSES } from "./contract";

export function StatusChip({ status }: { status: number }) {
  return <span className={`chip s${status}`}>{STATUSES[status]}</span>;
}

export function Notice({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <div className={`notice ${ok ? "ok" : "bad"}`}>{children}</div>;
}
