"use client";

import { useState, useOptimistic, useEffect, useRef, useTransition } from "react";
import { ArrowUp, Video, Link as LinkIcon, ExternalLink, Calendar } from "lucide-react";
import { sendMessageAction, createMeetingAction, deleteMessageAction, getThreadMessagesAction } from "@/app/actions/messages";
import { HoverInfo } from "./hover-info";
import { LinkHover } from "./link-hover";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  content: string;
  createdAt: string | Date;
  senderName: string;
  senderId: string;
  isMe: boolean;
  meeting?: {
    id: string;
    url: string;
  } | null;
  readBy?: string[];
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
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [cooldownTime, setCooldownTime] = useState<number | null>(null);
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
    let intervalId: any;

    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(async () => {
        if (document.visibilityState === "visible" && threadId) {
          const res = await getThreadMessagesAction(threadId, currentUserId);
          if (res && res.success) {
            setMessages(res.messages);
          }
        }
      }, 3000);
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && threadId) {
        const res = await getThreadMessagesAction(threadId, currentUserId);
        if (res && res.success) {
          setMessages(res.messages);
        }
        startPolling();
      } else {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };

    if (document.visibilityState === "visible") {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [threadId, currentUserId]);

  useEffect(() => {
    const handleFocus = () => {
      const initiated = localStorage.getItem("meeting_initiated");
      if (initiated === "true") {
        setIsMeetingModalOpen(true);
        localStorage.removeItem("meeting_initiated");
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  useEffect(() => {
    const lastMeeting = localStorage.getItem(`last_meeting_${projectId}`);
    if (lastMeeting) {
      const diff = Date.now() - parseInt(lastMeeting, 10);
      if (diff < 3600000) {
        setCooldownTime(3600000 - diff);
        const timer = setInterval(() => {
          const newDiff = Date.now() - parseInt(lastMeeting, 10);
          if (newDiff >= 3600000) {
            setCooldownTime(null);
            clearInterval(timer);
          } else {
            setCooldownTime(3600000 - newDiff);
          }
        }, 1000);
        return () => clearInterval(timer);
      }
    }
  }, [projectId]);

  async function handleSubmit(formData: FormData) {
    const content = formData.get("content") as string;
    if (!content.trim()) return;

    const tempId = Math.random().toString(36).substring(7);
    startTransition(() => {
      addOptimisticMessage({
        id: tempId,
        content,
        createdAt: new Date().toISOString(),
        senderName: "Me",
        senderId: currentUserId,
        isMe: true,
      });
    });

    const form = document.getElementById("chat-form") as HTMLFormElement;
    form?.reset();

    await sendMessageAction(formData);
  }

  async function handleDeleteMessage(messageId: string) {
    setMessageToDelete(messageId);
  }

  async function confirmDeleteMessage() {
    if (!messageToDelete) return;
    const id = messageToDelete;
    setMessageToDelete(null);
    setMessages(prev => prev.filter(m => m.id !== id));
    const res = await deleteMessageAction(id);
    if (res && !res.success) {
      setAlertMessage(res.error || "Failed to delete message");
      router.refresh();
    }
  }

  function handleStartMeeting() {
    if (cooldownTime !== null) return;
    localStorage.setItem("meeting_initiated", "true");
    window.open("https://meet.google.com/new", "_blank");
  }

  async function handleMeetingSubmit() {
    if (!meetingUrl.trim() || !threadId) return;

    if (!meetingUrl.includes("meet.google.com")) {
      setAlertMessage("Please provide a valid Google Meet link.");
      return;
    }

    const cleanUrl = meetingUrl.split('?')[0];

    const formData = new FormData();
    formData.append("threadId", threadId);
    formData.append("url", cleanUrl);

    setIsMeetingModalOpen(false);
    setMeetingUrl("");

    const tempId = Math.random().toString(36).substring(7);
    startTransition(() => {
      addOptimisticMessage({
        id: tempId,
        content: "Meeting initiated",
        createdAt: new Date().toISOString(),
        senderName: "Me",
        senderId: currentUserId,
        isMe: true,
        meeting: { id: "temp", url: cleanUrl }
      });
    });

    localStorage.setItem(`last_meeting_${projectId}`, Date.now().toString());
    setCooldownTime(3600000);

    await createMeetingAction(formData);
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
                <span className="text-xs font-medium text-foreground font-sans">
                  {msg.senderId ? (
                    <HoverInfo identifier={msg.senderId} type="freelancer">
                      {msg.senderName}
                    </HoverInfo>
                  ) : (
                    msg.senderName
                  )}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              
              {msg.meeting ? (
                <div className={`p-4 rounded-2xl max-w-[85%] border ${msg.isMe ? 'bg-foreground/5 border-foreground/10 text-foreground' : 'bg-background border-border text-foreground'}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Video className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-base mb-1">Google Meet Session</div>
                      <div className="text-xs text-muted-foreground mb-4 line-clamp-1">{msg.meeting.url}</div>
                      <a 
                        href={msg.meeting.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs font-medium hover:opacity-90 transition-opacity"
                      >
                        Join Meeting <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm leading-relaxed ${msg.isMe ? 'bg-foreground text-background rounded-tr-sm font-sans' : 'bg-secondary/40 border border-border text-foreground rounded-tl-sm font-sans'}`}>
                  {(() => {
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const parts = msg.content.split(urlRegex);
                    return parts.map((part, index) => {
                      if (urlRegex.test(part)) {
                        return <LinkHover key={index} url={part} isMe={msg.isMe} />;
                      }
                      return <span key={index}>{part}</span>;
                    });
                  })()}
                </div>
              )}

              {/* Outgoing Message: Read Receipts & Delete Button */}
              {msg.isMe && (
                <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-muted-foreground select-none">
                  {msg.readBy && msg.readBy.length > 0 ? (
                    <span className="font-sans text-primary font-medium">✓ Read by {msg.readBy.join(", ")}</span>
                  ) : (
                    <span className="font-sans text-muted-foreground/50">✓ Sent</span>
                  )}
                  <span className="text-muted-foreground/30 font-sans select-none">•</span>
                  <button 
                    onClick={() => handleDeleteMessage(msg.id)} 
                    className="text-muted-foreground/60 hover:text-destructive transition-colors font-sans cursor-pointer font-medium"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      <div className="p-6 bg-background border-t border-border">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={handleStartMeeting}
            disabled={cooldownTime !== null}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-full transition-all border ${
              cooldownTime !== null 
                ? 'text-muted-foreground bg-secondary/20 border-transparent cursor-not-allowed' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40 border-transparent hover:border-border'
            }`}
          >
            <Video className="w-3.5 h-3.5" /> 
            {cooldownTime !== null 
              ? `Next meeting in ${Math.ceil(cooldownTime / 60000)}m` 
              : 'Start Meeting'
            }
          </button>
          <div className="h-4 w-[1px] bg-border/50" />
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground opacity-50 cursor-not-allowed">
            <Calendar className="w-3.5 h-3.5" /> Schedule
          </button>
        </div>

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

      <Dialog open={isMeetingModalOpen} onOpenChange={setIsMeetingModalOpen}>
        <DialogContent className="max-w-[400px] p-6 bg-card border border-border shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-foreground">Meeting Created</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-2 leading-relaxed">
              Paste the Google Meet link below to share it with the team.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsMeetingModalOpen(false)}
              className="px-5 py-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full text-xs font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleMeetingSubmit}
              disabled={!meetingUrl.trim()}
              className="px-6 py-2.5 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:pointer-events-none rounded-full text-xs font-medium cursor-pointer transition-colors"
            >
              Share Link
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={messageToDelete !== null} onOpenChange={(open) => { if (!open) setMessageToDelete(null); }}>
        <DialogContent className="max-w-[400px] p-6 bg-card border border-border shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-foreground">Delete Message</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-3 leading-relaxed">
              Are you sure you want to permanently delete this message? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end gap-3">
            <button 
              onClick={() => setMessageToDelete(null)}
              className="px-5 py-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full text-xs font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDeleteMessage}
              className="px-6 py-2.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full text-xs font-medium cursor-pointer transition-colors"
            >
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={alertMessage !== null} onOpenChange={(open) => { if (!open) setAlertMessage(null); }}>
        <DialogContent className="max-w-[400px] p-6 bg-card border border-border shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-foreground">Attention</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-3 leading-relaxed">
              {alertMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end">
            <button 
              onClick={() => setAlertMessage(null)}
              className="px-6 py-2.5 bg-foreground text-background hover:bg-foreground/90 rounded-full text-xs font-medium cursor-pointer transition-colors"
            >
              OK
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
