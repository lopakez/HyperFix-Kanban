"use client";

import { useChat } from "@ai-sdk/react";
import { Maximize2, PlusCircle, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { getApiUrl } from "@/fetchers/get-api-url";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";
import { cn } from "@/lib/cn";
import { useAIStore } from "@/store/ai";

export function AssistantPanel() {
  const {
    isOpen,
    isExpanded,
    close,
    expand,
    conversationId,
    setConversationId,
  } = useAIStore();
  const { data: activeWorkspace } = useActiveWorkspace();
  const workspaceId = activeWorkspace?.id || "";

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
  } = useChat({
    api: getApiUrl("ai/chat"),
    id: conversationId || undefined,
    body: {
      workspaceId,
    },
    onResponse: (response) => {
      const xConvId = response.headers.get("X-Conversation-Id");
      if (xConvId && xConvId !== conversationId) {
        setConversationId(xConvId);
      }
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Faire défiler vers le bas lors de la réception de nouveaux messages
  // biome-ignore lint/correctness/useExhaustiveDependencies: Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Si on est dans le mode page complète (agrandi), on rend "null" car c'est la route /ai qui s'occupe de l'affichage
  if (!isOpen || isExpanded) return null;

  const handleNewChat = () => {
    setConversationId(null);
    setMessages([]);
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "w-[420px] h-[600px]",
        "bg-popover border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden",
        "transition-all duration-300 ease-in-out",
        "before:shadow-[0_1px_--theme(--color-black/4%)] dark:before:shadow-[0_-1px_--theme(--color-white/6%)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <span className="font-semibold text-sm">Assistant HyperFix IA</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleNewChat}
            className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
            title="Nouvelle conversation"
            type="button"
          >
            <PlusCircle size={16} />
          </button>
          <button
            onClick={expand}
            className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
            title="Plein écran"
            type="button"
          >
            <Maximize2 size={16} />
          </button>
          <button
            onClick={close}
            className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Sparkles size={24} />
            </div>
            <h4 className="font-medium text-sm">
              Que puis-je faire pour vous ?
            </h4>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              Je peux lister des tâches, en créer, les commenter, déplacer des
              colonnes et faire des recherches.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              m.role === "user"
                ? "bg-primary text-primary-foreground ml-auto rounded-tr-sm"
                : "bg-muted text-foreground rounded-tl-sm border border-border",
            )}
          >
            <ReactMarkdown className="prose dark:prose-invert prose-sm max-w-none break-words">
              {m.content}
            </ReactMarkdown>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-muted/20 border-t border-border"
      >
        <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/20">
          <input
            value={input ?? ""}
            onChange={handleInputChange}
            placeholder="Demander à l'IA..."
            className="flex-1 bg-transparent text-sm outline-none border-none py-1"
          />
          <button
            type="submit"
            disabled={isLoading || !(input ?? "").trim()}
            className="p-1.5 bg-primary text-primary-foreground rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
