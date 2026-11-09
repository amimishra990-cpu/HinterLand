export function WorkspaceFallback() {
  return (
    <div aria-busy="true" className="space-y-6">
      <span className="sr-only">Loading workspace</span>
      <div
        className="border-b pb-5"
        style={{ borderColor: "var(--app-line)" }}
      >
        <div className="app-skeleton h-3 w-28" />
        <div className="app-skeleton mt-3 h-8 w-72 max-w-full" />
        <div className="app-skeleton mt-3 h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="app-card p-5">
          <div className="app-skeleton h-4 w-32" />
          <div className="app-skeleton mt-4 h-28 w-full" />
          <div className="app-skeleton mt-3 h-28 w-full" />
          <div className="app-skeleton mt-4 h-9 w-36" />
        </div>
        <div className="app-card p-5">
          <div className="app-skeleton h-4 w-40" />
          <div className="app-skeleton mt-4 h-10 w-full" />
          <div className="app-skeleton mt-3 h-10 w-full" />
          <div className="app-skeleton mt-3 h-10 w-full" />
          <div className="app-skeleton mt-5 h-48 w-full" />
        </div>
      </div>
    </div>
  );
}
