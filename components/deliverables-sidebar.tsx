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
    <aside className="w-80 border-r border-border bg-background p-6 overflow-y-auto hidden md:flex flex-col gap-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg text-foreground mb-1">Execution Deliverables</h2>
          {milestones.length > 0 && (
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              {milestones.filter(m => m.status === "completed").length} of {milestones.length} completed
            </p>
          )}
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors text-foreground"
          title="Add deliverable"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="p-5 border border-border rounded-xl bg-secondary/10 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <input
            type="text"
            placeholder="Deliverable title..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 border-b border-border/50 pb-2 mb-4 focus:outline-none focus:border-primary transition-colors"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            autoFocus
          />
          <div className="flex gap-2 items-center justify-between">
            <input
              type="date"
              className="text-xs bg-transparent text-muted-foreground border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:border-primary transition-colors"
              value={formData.dueDate}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
            />
            <div className="flex gap-3 items-center">
              <button type="button" onClick={() => setIsCreating(false)} className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">Cancel</button>
              <button type="submit" disabled={!formData.title.trim() || isPending} className="text-xs bg-foreground text-background hover:bg-foreground/90 px-4 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50">Save</button>
            </div>
          </div>
        </form>
      )}

      {milestones.length === 0 && !isCreating ? (
        <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-secondary/10 rounded-lg border border-dashed border-border/50">
          <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-5 h-5 text-muted-foreground/50" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No execution deliverables yet</h3>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Break down the project into clear, actionable milestones.
          </p>
          <button 
            onClick={() => setIsCreating(true)}
            className="text-xs font-medium bg-foreground text-background px-4 py-2 rounded-md hover:bg-foreground/90 transition-colors"
          >
            Create Deliverable
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => {
            const isClientOwned = m.assignedTo === "client";
            const isEditing = editingId === m.id;

            if (isEditing) {
              return (
                <form key={m.id} onSubmit={(e) => { e.preventDefault(); handleUpdate(m.id, { title: formData.title, dueDate: formData.dueDate }); }} className="p-5 border border-primary/40 rounded-xl bg-secondary/10 shadow-sm animate-in fade-in duration-200 relative z-10">
                  <input
                    type="text"
                    className="w-full bg-transparent text-sm text-foreground border-b border-border/50 pb-2 mb-4 focus:outline-none focus:border-primary transition-colors"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    autoFocus
                  />
                  <div className="flex gap-2 items-center justify-between">
                    <input
                      type="date"
                      className="text-xs bg-transparent text-muted-foreground border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:border-primary transition-colors"
                      value={formData.dueDate}
                      onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                    <div className="flex gap-3 items-center">
                      <button type="button" onClick={() => setEditingId(null)} className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">Cancel</button>
                      <button type="submit" disabled={!formData.title.trim() || isPending} className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50">Save</button>
                    </div>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={m.id}
                className={`
                  group relative p-4 border border-border rounded-md bg-card/20 transition-all duration-200
                  ${m.status === "completed" ? "opacity-60" : "hover:border-border/80"}
                  ${m.status !== "completed" && isClientOwned ? "border-l-[3px] border-l-sky-500/70" : ""}
                  ${m.status !== "completed" && !isClientOwned ? "border-l-[3px] border-l-primary" : ""}
                `}
              >
                <div className="flex items-start gap-3">
                  <button onClick={() => cycleStatus(m)} className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform">
                    {renderStatusIcon(m.status)}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-medium leading-snug truncate ${m.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {m.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <button 
                        onClick={() => handleUpdate(m.id, { assignedTo: m.assignedTo === "team" ? "client" : "team" })}
                        className={`
                          text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0 transition-colors
                          ${m.status === "completed" ? "opacity-50 cursor-default" : "cursor-pointer hover:opacity-80"}
                          ${isClientOwned
                            ? "bg-sky-500/10 text-sky-600 border border-sky-500/20 dark:text-sky-400"
                            : "bg-primary/10 text-primary border border-primary/20"}
                        `}
                        title={m.status !== "completed" ? "Click to toggle assignee" : undefined}
                        disabled={m.status === "completed"}
                      >
                        {isClientOwned ? "Client" : "Team"}
                      </button>
                      
                      {m.dueDate && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(m.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setOpenDropdown(openDropdown === m.id ? null : m.id)}
                      className="p-1 hover:bg-secondary rounded text-muted-foreground"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openDropdown === m.id && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-popover border border-border rounded-md shadow-lg py-1 z-20 animate-in fade-in slide-in-from-top-2">
                        <button 
                          onClick={() => {
                            setFormData({ title: m.title, dueDate: m.dueDate ? m.dueDate.split("T")[0] : "" });
                            setEditingId(m.id);
                            setOpenDropdown(null);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-secondary flex items-center gap-2"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(m.id)}
                          className="w-full text-left px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
