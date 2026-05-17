"use client";

import { useActionState, useState, useRef } from "react";
import { createJobAction, generateJobAIAssistAction } from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewJobPage() {
  const [state, formAction, isPending] = useActionState(createJobAction, undefined);
  const [isAiPending, setIsAiPending] = useState(false);
  const [aiError, setAiError] = useState("");

  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const skillsRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const budgetMinRef = useRef<HTMLInputElement>(null);
  const budgetMaxRef = useRef<HTMLInputElement>(null);
  const experienceLevelRef = useRef<HTMLSelectElement>(null);

  const handleAiGenerate = async () => {
    const title = titleRef.current?.value;
    if (!title) {
      setAiError("Please enter a project title first.");
      return;
    }

    setIsAiPending(true);
    setAiError("");
    
    const result = await generateJobAIAssistAction(title);
    
    setIsAiPending(false);
    
    if (result.error) {
      setAiError(result.error);
      return;
    }
    
    if (result.title && titleRef.current) {
      titleRef.current.value = result.title;
    }
    if (result.description && descriptionRef.current) {
      descriptionRef.current.value = result.description;
    }
    if (result.skills && skillsRef.current) {
      skillsRef.current.value = result.skills;
    }
    if (result.category && categoryRef.current) {
      categoryRef.current.value = result.category;
    }
    if (result.experienceLevel && experienceLevelRef.current) {
      experienceLevelRef.current.value = result.experienceLevel;
    }
    if (result.budgetMin && budgetMinRef.current) {
      budgetMinRef.current.value = result.budgetMin.toString();
    }
    if (result.budgetMax && budgetMaxRef.current) {
      budgetMaxRef.current.value = result.budgetMax.toString();
    }
  };

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
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">Project Title</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAiGenerate}
              disabled={isAiPending}
              className="text-xs h-8 gap-1.5"
            >
              {isAiPending ? "Generating..." : "Fill with AI"}
            </Button>
          </div>
          <input
            ref={titleRef}
            name="title"
            type="text"
            placeholder="e.g. Scalable Auth Architecture Implementation"
            className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
            required
          />
          {aiError && (
            <p className="text-xs text-destructive mt-1">{aiError}</p>
          )}
        </div>

        <div className="space-y-3 relative">
          <label className="mb-3 block text-sm font-medium text-foreground">Detailed Description & Bounds</label>
          <textarea
            ref={descriptionRef}
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
              ref={budgetMinRef}
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
              ref={budgetMaxRef}
              name="budgetMax"
              type="number"
              min="100"
              placeholder="15000"
              className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="mb-3 block text-sm font-medium text-foreground">Work Category</label>
            <select
              ref={categoryRef}
              name="workCategory"
              defaultValue=""
              className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors [&>option]:bg-background [&>option]:text-foreground"
              required
            >
              <option value="" disabled>Select category...</option>
              <option value="Software & Tech">Software & Tech</option>
              <option value="Design & Art">Design & Art</option>
              <option value="Video & Media">Video & Media</option>
              <option value="Writing & Content">Writing & Content</option>
              <option value="Physical & Local">Physical & Local</option>
              <option value="General Execution">General Execution</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="mb-3 block text-sm font-medium text-foreground">Required Skills & Tools</label>
            <input
              ref={skillsRef}
              name="requiredSkills"
              type="text"
              placeholder="e.g. React, Premiere Pro, Carpentry"
              className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="mb-3 block text-sm font-medium text-foreground">Experience Level Requirement</label>
            <select
              ref={experienceLevelRef}
              name="experienceLevel"
              defaultValue=""
              className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors [&>option]:bg-background [&>option]:text-foreground"
              required
            >
              <option value="" disabled>Select level...</option>
              <option value="Entry/Junior">Entry / Junior</option>
              <option value="Mid-Level">Mid-Level</option>
              <option value="Senior">Senior</option>
              <option value="Expert/Lead">Expert / Lead</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="mb-3 block text-sm font-medium text-foreground">Execution Timeline</label>
            <select
              name="timeAllowed"
              defaultValue=""
              className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors [&>option]:bg-background [&>option]:text-foreground"
              required
            >
              <option value="" disabled>Select timeline...</option>
              <option value="Hours/Days">Hours / Days</option>
              <option value="< 1 month">&lt; 1 month</option>
              <option value="1-3 months">1-3 months</option>
              <option value="3-6 months">3-6 months</option>
              <option value="6+ months">6+ months</option>
              <option value="Ongoing">Ongoing / Retainer</option>
            </select>
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
