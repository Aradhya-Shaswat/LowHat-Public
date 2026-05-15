import Link from "next/link";

interface JobListItemProps {
  job: any;
  bidsCount: number;
}

export function JobListItem({ job, bidsCount }: JobListItemProps) {
  return (
    <Link 
      href={`/my-jobs/${job.id}`}
      className="group py-8 border-b border-border/50 hover:border-foreground/40 transition-all cursor-pointer relative block"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1.5 flex-1 pr-12">
          <div className="flex items-center gap-4 mb-3">
            <span className={`text-[10px] font-bold tracking-tight capitalize ${job.status === "open" ? "text-emerald-600" : "text-muted-foreground"}`}>
              {job.status.replace("_", " ")}
            </span>
            {job.moderationStatus !== "approved" && (
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-tight">
                <span className="text-muted-foreground">/</span>
                <span className={`capitalize ${
                  job.moderationStatus === "pending" ? "text-amber-600" : 
                  job.moderationStatus === "rejected" ? "text-rose-600" :
                  "text-muted-foreground"
                }`}>
                  {job.moderationStatus === "pending" ? "Awaiting Review" : job.moderationStatus}
                </span>
                {job.moderationStatus === "rejected" && job.moderationReason && (
                  <>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-rose-600/80 italic normal-case font-medium tracking-normal">
                      {job.moderationReason}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          <h3 className="text-2xl font-serif text-foreground group-hover:text-foreground/80 transition-colors leading-tight">{job.title}</h3>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <span className="text-sm font-medium text-foreground tracking-tight">
            ${(job.budgetMin! / 100).toLocaleString()} – ${(job.budgetMax! / 100).toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground">
            {bidsCount} Bids
          </span>
        </div>
      </div>
      <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed max-w-3xl mb-0">
        {job.description}
      </p>
    </Link>
  );
}
