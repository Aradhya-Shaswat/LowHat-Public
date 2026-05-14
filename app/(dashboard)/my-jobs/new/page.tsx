"use client";

import { useActionState } from "react";
import { createJobAction } from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewJobPage() {
  const [state, formAction, isPending] = useActionState(createJobAction, undefined);

  return (
    <div className="flex flex-col py-12 px-8 md:px-12 w-full min-h-full">
      <div className="mb-10 border-b border-border pb-8">
        <Link href="/my-jobs" className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm font-medium transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to postings
        </Link>
        <h1 className="text-3xl font-heading text-foreground mb-2">Draft Execution Contract</h1>
        <p className="text-muted-foreground text-sm">Draft a clear and bounded job so exactly the right micro-agency can bid.</p>
      </div>

      <form action={formAction} className="space-y-8 max-w-2xl">
        <div className="space-y-3">
          <label className="mb-3 block text-sm font-medium text-foreground">Project Title</label>
          <input
            name="title"
            type="text"
            placeholder="e.g. Scalable Auth Architecture Implementation"
            className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
            required
          />
        </div>

        <div className="space-y-3 relative">
          <label className="mb-3 block text-sm font-medium text-foreground">Detailed Description & Bounds</label>
          <textarea
            name="description"
            rows={8}
            placeholder="Describe the end state, technical requirements, and acceptance criteria..."
            className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors resize-y leading-relaxed"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="mb-3 block text-sm font-medium text-foreground">Minimum Budget (USD)</label>
            <input
              name="budgetMin"
              type="number"
              min="100"
              placeholder="5000"
              className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
              required
            />
          </div>
          <div className="space-y-3">
            <label className="mb-3 block text-sm font-medium text-foreground">Maximum Budget (USD)</label>
            <input
              name="budgetMax"
              type="number"
              min="100"
              placeholder="15000"
              className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
              required
            />
          </div>
        </div>

        {state?.error && (
          <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {state.error}
          </div>
        )}

        <div className="pt-4 flex justify-start">
          <Button type="submit" disabled={isPending} className="bg-foreground text-background hover:bg-foreground/90 px-8 py-2 h-auto rounded-lg">
            {isPending ? "Posting..." : "Post to Marketplace"}
          </Button>
        </div>
      </form>
    </div>
  );
}
