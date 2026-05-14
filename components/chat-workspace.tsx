"use client";

import { useState, useOptimistic, useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { sendMessageAction } from "@/app/actions/messages";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  content: string;
  createdAt: string | Date;
  senderName: string;
  isMe: boolean;
}

interface ChatWorkspaceProps {
  threadId: string | undefined;
  projectId: string;
  initialMessages: Message[];
  currentUserId: string;
}

export function ChatWorkspace({ threadId, projectId, initialMessages, currentUserId }: ChatWorkspaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: Message) => [...state, newMessage]
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [optimisticMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 2500);
    return () => clearInterval(interval);
  }, [router]);

  async function handleSubmit(formData: FormData) {
    const content = formData.get("content") as string;
    if (!content.trim()) return;

    const tempId = Math.random().toString(36).substring(7);
    addOptimisticMessage({
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      senderName: "Me",
      isMe: true,
    });

    const form = document.getElementById("chat-form") as HTMLFormElement;
    form?.reset();

    await sendMessageAction(formData);
  }

  return (
    <div className="flex-1 flex flex-col bg-card/10 relative overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6"
      >
        {optimisticMessages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm mt-12 py-12 border border-dashed border-border rounded-xl">
             No messages in this workspace yet.
          </div>
        ) : (
          optimisticMessages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-medium text-foreground font-sans">{msg.senderName}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <div className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm leading-relaxed ${msg.isMe ? 'bg-foreground text-background rounded-tr-sm' : 'bg-secondary/40 border border-border text-foreground rounded-tl-sm'}`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-6 bg-background border-t border-border">
        <form id="chat-form" action={handleSubmit} className="relative flex items-center">
          <input type="hidden" name="threadId" value={threadId} />
          <input 
             name="content"
             type="text" 
             placeholder="Type a message to the team..." 
             className="w-full px-5 py-3 pr-14 bg-card border border-border rounded-full text-sm outline-none focus:border-foreground/30 transition-colors shadow-sm"
             autoComplete="off"
             required
          />
          <button type="submit" className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-foreground text-background hover:bg-foreground/90 rounded-full flex items-center justify-center transition-colors">
            <ArrowUp className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
