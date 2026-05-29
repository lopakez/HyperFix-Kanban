"use client";

import { useChat } from "@ai-sdk/react";
import {
  MessageSquare,
  PlusCircle,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useDeleteConversation } from "@/hooks/mutations/ai/use-delete-conversation";
import { useGetConversation } from "@/hooks/queries/ai/use-get-conversation";
import { useGetConversations } from "@/hooks/queries/ai/use-get-conversations";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";
import { cn } from "@/lib/cn";
import { useAIStore } from "@/store/ai";

export function AssistantFullPage() {
  const { conversationId, setConversationId, collapse } = useAIStore();
  const { data: activeWorkspace } = useActiveWorkspace();
  const workspaceId = activeWorkspace?.id || "";

  // Queries & Mutations
  const { data: conversations, refetch: refetchConversations } =
    useGetConversations(workspaceId);
  const { data: loadedConversation, isLoading: isLoadingConversation } =
    useGetConversation(conversationId, workspaceId);
  const deleteConversationMutation = useDeleteConversation(workspaceId);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
  } = useChat({
    api: "/api/ai/chat",
    id: conversationId || undefined,
    body: {
      workspaceId,
    },
    onResponse: (response) => {
      const xConvId = response.headers.get("X-Conversation-Id");
      if (xConvId && xConvId !== conversationId) {
        setConversationId(xConvId);
        void refetchConversations();
      }
    },
    onFinish: () => {
      void refetchConversations();
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // S'assurer que le mode "Expanded" est actif quand on est sur cette page
  useEffect(() => {
    // Si l'utilisateur arrive sur /ai directement, on replie le panel flottant
    collapse();
  }, [collapse]);

  // Synchroniser l'historique chargé depuis la DB avec useChat
  useEffect(() => {
    if (loadedConversation?.messages) {
      setMessages(loadedConversation.messages);
    } else if (!conversationId) {
      setMessages([]);
    }
  }, [loadedConversation, conversationId, setMessages]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewChat = () => {
    setConversationId(null);
    setMessages([]);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversationMutation.mutate(id, {
      onSuccess: () => {
        if (conversationId === id) {
          handleNewChat();
        }
        void refetchConversations();
      },
    });
  };

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-12px)] overflow-hidden bg-background rounded-b-xl border border-t-0 border-border/80">
      {/* Sidebar - Liste des conversations */}
      <div className="w-80 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <button
            onClick={handleNewChat}
            type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-95 transition-opacity text-sm"
          >
            <PlusCircle size={16} />
            Nouvelle conversation
          </button>
        </div>

        {/* Historique des discussions */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations && conversations.length > 0 ? (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "flex items-center justify-between rounded-xl cursor-pointer transition-colors group text-sm w-full",
                  conversationId === conv.id
                    ? "bg-accent text-accent-foreground font-medium"
                    : "hover:bg-accent/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <button
                  onClick={() => setConversationId(conv.id)}
                  type="button"
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left px-3 py-2.5 w-full bg-transparent border-none outline-none cursor-pointer"
                >
                  <MessageSquare size={16} className="shrink-0" />
                  <span className="truncate pr-1">{conv.title}</span>
                </button>
                <button
                  onClick={(e) => handleDelete(conv.id, e)}
                  disabled={deleteConversationMutation.isPending}
                  type="button"
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all text-muted-foreground shrink-0 mr-2 cursor-pointer border-none bg-transparent"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center p-6 text-xs text-muted-foreground">
              Aucune discussion enregistrée
            </div>
          )}
        </div>
      </div>

      {/* Zone principale - Chat active */}
      <div className="flex-1 flex flex-col bg-background/20 relative">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoadingConversation ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Sparkles size={32} />
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                Comment puis-je vous aider aujourd'hui ?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Je suis votre assistant IA intégré de gestion de projet. Je peux
                lister vos tâches, créer de nouveaux éléments, ajouter des
                commentaires et mettre à jour les statuts en toute sécurité.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex gap-4 p-4 rounded-2xl border border-border/40",
                    m.role === "user"
                      ? "bg-accent/40 border-accent/20"
                      : "bg-muted/40",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold select-none",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground border border-border",
                    )}
                  >
                    {m.role === "user" ? "U" : <Sparkles size={14} />}
                  </div>
                  <div className="flex-1 min-w-0 leading-relaxed text-sm">
                    <ReactMarkdown className="prose dark:prose-invert prose-sm max-w-none break-words">
                      {m.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Formulaire de saisie */}
        <div className="p-4 border-t border-border bg-card/50">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2.5 bg-background border border-border rounded-2xl px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Discutez avec l'assistant IA..."
                className="flex-1 bg-transparent text-sm outline-none border-none py-1.5"
              />
              <button
                type="submit"
                disabled={
                  isLoading || !(input ?? "").trim() || isLoadingConversation
                }
                className="p-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
