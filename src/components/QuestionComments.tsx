import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    name: string | null;
    avatar_url: string | null;
  };
}

export function QuestionComments({ questionId }: { questionId: string }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["question-comments", questionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("question_comments")
        .select("*, profiles(username, name, avatar_url)")
        .eq("question_id", questionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as Comment[];
    },
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("question_comments").insert({
        question_id: questionId,
        user_id: user.id,
        content: content.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["question-comments", questionId] });
    },
    onError: () => toast({ title: "Erro ao comentar", variant: "destructive" }),
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("question_comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-comments", questionId] });
    },
  });

  const getInitials = (name: string | null, username: string) =>
    (name || username || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="gradient-card border-border">
      <CardHeader>
        <CardTitle className="text-base font-display flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Comentários ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment list */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum comentário ainda. Seja o primeiro!</p>
        ) : (
          <div className="space-y-3">
            {comments.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex gap-3 rounded-lg border border-border bg-secondary/20 p-3"
              >
                <Link to={`/perfil/${c.user_id}`} className="shrink-0">
                  <Avatar className="h-8 w-8 border border-border">
                    {c.profiles.avatar_url ? (
                      <AvatarImage src={c.profiles.avatar_url} alt={c.profiles.name || c.profiles.username} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {getInitials(c.profiles.name, c.profiles.username)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/perfil/${c.user_id}`}
                      className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {c.profiles.name || c.profiles.username}
                    </Link>
                    <span className="text-[10px] text-muted-foreground">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground/80 mt-1 break-words">{c.content}</p>
                </div>
                {user?.id === c.user_id && (
                  <button
                    onClick={() => deleteComment.mutate(c.id)}
                    className="shrink-0 text-muted-foreground hover:text-destructive transition-colors self-start"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Add comment */}
        {user && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <Textarea
              placeholder="Escreva seu comentário..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="min-h-[60px] bg-secondary border-border text-sm resize-none flex-1"
            />
            <Button
              size="sm"
              onClick={() => addComment.mutate()}
              disabled={!content.trim() || addComment.isPending}
              className="gradient-electric text-white self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
