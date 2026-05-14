import { Button } from "@/components/ui/button";

export default function PostJobPage() {
  return (
    <div className="max-w-2xl py-12 px-4 sm:px-6">
      <header className="mb-12">
        <h1 className="text-3xl font-heading mb-2">Scope a new project</h1>
        <p className="text-muted-foreground text-sm">Post a detailed execution brief. Be deliberate. Top teams optimize for clarity.</p>
      </header>

      <form className="space-y-10">
        <section className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Project Title</label>
            <input
              type="text"
              placeholder="e.g. Architect and build scalable Stripe sync layer"
              className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Execution Brief</label>
            <textarea
              rows={6}
              placeholder="Detail the technical requirements, the business context, and the expected deliverables..."
              className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors resize-y"
            ></textarea>
            <p className="text-xs text-muted-foreground">Markdown is supported.</p>
          </div>
        </section>

        <section className="space-y-6 pt-6 border-t border-border/50">
          <h2 className="text-lg font-serif">Budget & Requirements</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Minimum Budget (USD)</label>
              <input
                type="number"
                placeholder="10000"
                className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Maximum Budget (USD)</label>
              <input
                type="number"
                placeholder="25000"
                className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors font-mono"
              />
            </div>
          </div>
        </section>

        <div className="pt-6 border-t border-border/50 flex justify-end gap-4">
          <Button variant="outline" className="bg-transparent font-medium border-border/60">Save as Draft</Button>
          <Button className="font-medium bg-foreground text-background">Publish Job</Button>
        </div>
      </form>
    </div>
  );
}