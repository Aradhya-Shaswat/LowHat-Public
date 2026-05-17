export default function DashboardLoading() {
  return (
    <div className="flex flex-col py-12 px-8 md:px-12 w-full min-h-full animate-pulse select-none">
      <header className="flex items-center justify-between border-b border-border pb-6 mb-8">
        <div className="space-y-3 w-full max-w-sm">
          <div className="h-10 bg-foreground/5 rounded-sm w-3/4" />
          <div className="h-4 bg-muted-foreground/10 rounded-sm w-1/2" />
        </div>
      </header>

      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="py-6 border-b border-border/50 flex flex-col md:flex-row md:items-start md:justify-between gap-6"
          >
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <div className="h-3 bg-muted-foreground/10 rounded-sm w-16" />
                <div className="h-7 bg-foreground/5 rounded-sm w-2/3 md:w-1/2" />
              </div>
              
              <div className="space-y-2">
                <div className="h-4 bg-muted-foreground/10 rounded-sm w-full" />
                <div className="h-4 bg-muted-foreground/10 rounded-sm w-5/6" />
              </div>

              <div className="flex items-center justify-between mt-6 pt-2">
                <div className="h-4 bg-foreground/5 rounded-sm w-24" />
                <div className="h-4 bg-muted-foreground/10 rounded-sm w-16" />
              </div>
            </div>

            <div className="shrink-0 pt-1 hidden md:block">
              <div className="h-5 bg-foreground/5 rounded-sm w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
