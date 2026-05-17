export default function WorkspaceLoading() {
  return (
    <div className="flex flex-col h-full bg-background relative w-full animate-pulse select-none overflow-hidden">
      <header className="h-20 border-b border-border flex items-center px-8 bg-card flex-shrink-0 sticky top-0 z-10">
        <div className="flex-1">
          <div className="h-6 bg-foreground/5 rounded-sm w-1/3" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-4 bg-muted-foreground/10 rounded-sm w-24" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r border-border bg-card p-6 flex flex-col justify-between flex-shrink-0 hidden md:flex">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-3 bg-muted-foreground/10 rounded-sm w-24" />
              <div className="h-6 bg-foreground/5 rounded-sm w-3/4" />
            </div>
            
            <div className="space-y-4 pt-4 border-t border-border/50">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border border-border/40 rounded-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-foreground/5 rounded-sm w-2/3" />
                    <div className="h-3 bg-muted-foreground/10 rounded-sm w-12" />
                  </div>
                  <div className="h-3 bg-muted-foreground/10 rounded-sm w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col justify-between bg-background">
          <div className="flex-1 p-8 space-y-8 overflow-y-auto">
            <div className="flex flex-col space-y-6">
              {[
                { align: "start", width: "w-2/3" },
                { align: "end", width: "w-1/2" },
                { align: "start", width: "w-3/4" },
                { align: "end", width: "w-1/3" },
                { align: "start", width: "w-1/2" },
              ].map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.align === "end" ? "items-end" : "items-start"
                  } space-y-2`}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-3 bg-muted-foreground/10 rounded-sm w-16" />
                  </div>
                  <div
                    className={`h-12 ${msg.width} bg-foreground/5 rounded-sm ${
                      msg.align === "end" ? "rounded-br-none" : "rounded-bl-none"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-border bg-card">
            <div className="h-12 bg-background border border-border/50 rounded-sm w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
