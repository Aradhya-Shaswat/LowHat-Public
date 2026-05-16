import { Button } from "@/components/ui/button";

export default function TeamSettingsPage() {
  return (
    <div className="py-12 px-8 max-w-6xl min-h-full">
      <header className="mb-12 border-b border-border pb-8">
        <h1 className="text-3xl font-heading mb-2">Team Parameters</h1>
        <p className="text-muted-foreground text-sm">Configure your execution unit's public profile and operational status.</p>
      </header>

      <div className="space-y-12 max-w-3xl">
        <section className="space-y-6">
          <h2 className="text-lg font-serif">Unit Identity</h2>
          <div className="space-y-6">
            <div className="flex flex-col space-y-2">
              <label className="mb-3 block  text-sm font-medium text-foreground">Unit Designation (Name)</label>
              <input
                type="text"
                defaultValue="Team Sigma"
                className="w-full px-4 py-2.5 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="mb-3 block  text-sm font-medium text-foreground">Operational Mandate</label>
              <textarea
                rows={4}
                defaultValue="We are a senior triad (Product Engineer, Data Architect, UI Designer) specializing in high-throughput financial applications and real-time marketplaces."
                className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors resize-y"
              ></textarea>
            </div>
          </div>
          <Button className="bg-foreground text-background font-medium">Save Identity</Button>
        </section>

        <section className="space-y-6 pt-6 border-t border-border/50">
          <h2 className="text-lg font-serif">Capacity Management</h2>
          <p className="text-sm text-muted-foreground mb-4">Toggle your unit's availability in the marketplace.</p>
          
          <div className="p-4 border border-border rounded-lg bg-card/50 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-foreground">Accepting New Contracts</p>
              <p className="text-sm text-muted-foreground mt-1">Currently listed as 'High' capacity.</p>
            </div>
            <label className="mb-3 block  relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-border/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
