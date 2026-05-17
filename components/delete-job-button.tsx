"use client";

import { useFormStatus } from "react-dom";

export function DeleteJobButton() {
  const { pending } = useFormStatus();
  
  return (
    <button 
      type="submit" 
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm("Are you sure you want to delete this posting? This action cannot be undone.")) {
          e.preventDefault();
        }
      }}
      className="text-xs text-rose-500 hover:text-rose-600 font-medium font-sans hover:underline transition-all disabled:opacity-50"
    >
      {pending ? "Deleting..." : "Delete Posting"}
    </button>
  );
}
