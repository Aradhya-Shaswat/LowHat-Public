"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, MoreVertical, Trash2, Edit2, CheckCircle2, Circle, Clock } from "lucide-react";
import { createMilestoneAction, updateMilestoneAction, deleteMilestoneAction } from "@/app/actions/milestones";

export type MilestoneStatus = "pending" | "in_progress" | "completed";

export interface Milestone {
  id: string;
  title: string;
  dueDate: string | null;
  status: MilestoneStatus;
  assignedTo: "team" | "client";
}

interface DeliverablesSidebarProps {
  milestones: Milestone[];
  isClient: boolean;
  projectId: string;
}

export function DeliverablesSidebar({ milestones: initialMilestones, isClient, projectId }: DeliverablesSidebarProps) {
  const [milestones, setMilestones] = useState(initialMilestones);

  useEffect(() => {
    setMilestones(initialMilestones);
  }, [initialMilestones]);

  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<{ title: string; dueDate: string }>({ title: "", dueDate: "" });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setIsCreating(false);
    startTransition(async () => {
      const res = await createMilestoneAction(projectId, { 
        title: formData.title, 
        dueDate: formData.dueDate || null,
        assignedTo: isClient ? "team" : "team"  
      });
      if (!res.error) {
        setFormData({ title: "", dueDate: "" });
      }
    });
  };

  const handleUpdate = async (id: string, updates: Partial<Milestone>) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, ...updates } as Milestone : m));
    setOpenDropdown(null);
    setEditingId(null);
    startTransition(async () => {
      await updateMilestoneAction(id, updates);
    });
  };

  const handleDelete = async (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
    setOpenDropdown(null);
    startTransition(async () => {
      await deleteMilestoneAction(id);
    });
  };

  const renderStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "in_progress": return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <Circle className="w-4 h-4 text-muted-foreground/40" />;
    }
  };

  const cycleStatus = (m: Milestone) => {
    const order: MilestoneStatus[] = ["pending", "in_progress", "completed"];
    const nextIdx = (order.indexOf(m.status) + 1) % order.length;
    handleUpdate(m.id, { status: order[nextIdx] });
  };

  return (
    <aside className="w-80 border-r border-border bg-background p-8 overflow-y-auto hidden md:flex flex-col gap-8 relative">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-0.5 font-sans">Execution Deliverables</h2>
          {milestones.length > 0 && (
            <p className="text-xs text-muted-foreground font-sans">
              {milestones.filter(m => m.status === "completed").length} / {milestones.length} completed
            </p>
          )}
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
          title="Add deliverable"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="space-y-4 animate-in fade-in duration-200">
          <input
            type="text"
            placeholder="Deliverable title..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 border-b border-border/50 pb-2 focus:outline-none focus:border-foreground transition-colors rounded-none"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            autoFocus
          />
          <div className="flex gap-4 items-center justify-between">
            <input
              type="date"
              className="text-xs bg-transparent text-muted-foreground border-b border-border/50 pb-1 focus:outline-none focus:border-foreground transition-colors rounded-none"
              value={formData.dueDate}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
            />
            <div className="flex gap-4 items-center">
              <button type="button" onClick={() => setIsCreating(false)} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors font-sans">Cancel</button>
              <button type="submit" disabled={!formData.title.trim() || isPending} className="text-xs font-medium text-foreground hover:opacity-80 transition-opacity disabled:opacity-50 font-sans">Save</button>
            </div>
          </div>
        </form>
      )}

      {milestones.length === 0 && !isCreating ? (
        <div className="flex flex-col items-start pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-4">No deliverables defined.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {milestones.map((m) => {
            const isClientOwned = m.assignedTo === "client";
            const isEditing = editingId === m.id;

            if (isEditing) {
              return (
                <form key={m.id} onSubmit={(e) => { e.preventDefault(); handleUpdate(m.id, { title: formData.title, dueDate: formData.dueDate }); }} className="py-4 border-b border-border/50 space-y-4 animate-in fade-in duration-200 relative z-10">
                  <input
                    type="text"
                    className="w-full bg-transparent text-sm text-foreground border-b border-border/50 pb-2 focus:outline-none focus:border-foreground transition-colors rounded-none"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    autoFocus
                  />
                  <div className="flex gap-4 items-center justify-between">
                    <input
                      type="date"
                      className="text-xs bg-transparent text-muted-foreground border-b border-border/50 pb-1 focus:outline-none focus:border-foreground transition-colors rounded-none"
                      value={formData.dueDate}
                      onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                    <div className="flex gap-4 items-center">
                      <button type="button" onClick={() => setEditingId(null)} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors font-sans">Cancel</button>
                      <button type="submit" disabled={!formData.title.trim() || isPending} className="text-xs font-medium text-foreground hover:opacity-80 transition-opacity disabled:opacity-50 font-sans">Save</button>
                    </div>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={m.id}
                className={`
                  group relative py-4 border-b border-border/50 transition-all duration-200 flex items-start gap-3
                  ${m.status === "completed" ? "opacity-50" : ""}
                `}
              >
                <button onClick={() => cycleStatus(m)} className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform">
                  {renderStatusIcon(m.status)}
                </button>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm tracking-tight leading-snug pr-6 ${m.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {m.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <button 
                      onClick={() => handleUpdate(m.id, { assignedTo: m.assignedTo === "team" ? "client" : "team" })}
                      className={`
                        text-[11px] font-medium transition-colors font-sans
                        ${m.status === "completed" ? "cursor-default" : "cursor-pointer hover:text-foreground"}
                        ${isClientOwned ? "text-sky-500" : "text-muted-foreground"}
                      `}
                      disabled={m.status === "completed"}
                    >
                      {isClientOwned ? "Client" : "Team"}
                    </button>
                    
                    {m.dueDate && (
                      <span className="text-[11px] text-muted-foreground font-sans">
                        {new Date(m.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="absolute right-0 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === m.id ? null : m.id)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {openDropdown === m.id && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-background border border-border shadow-sm py-1 z-20">
                      <button 
                        onClick={() => {
                          setFormData({ title: m.title, dueDate: m.dueDate ? m.dueDate.split("T")[0] : "" });
                          setEditingId(m.id);
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground font-sans"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(m.id)}
                        className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-destructive font-sans"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
