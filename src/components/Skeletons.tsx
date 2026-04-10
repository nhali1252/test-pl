export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-3xl bg-card border border-border h-40" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl bg-card border border-border h-24" />)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => <div key={i} className="rounded-2xl bg-card border border-border h-24" />)}
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2.5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 rounded-2xl bg-card border border-border" />
      ))}
    </div>
  );
}
