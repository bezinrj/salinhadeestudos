import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { MessageSquare, Trash2, Crown } from "lucide-react";
import { ActiveBadge } from "@/components/ActiveBadge";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/RichTextEditor";
import { CommentVoteButton } from "@/components/CommentVoteButton";
import DOMPurify from "dompurify";

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
    comment_score: number | null;
    subscription_tier: string | null;
    active_badge_id: string | null;
  };
}

export function QuestionComments({ questionId }: { questionId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["question-comments", questionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("question_comments")
        .select("*, profiles(username, name, avatar_url, comment_score, subscription_tier, active_badge_id)")
        .eq("question_id", questionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as Comment[];
    },
  });

  const addComment = useMutation({
    mutationFn: async (html: string) => {
      if (!user) throw new Error("Not authenticated");
      const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "s", "del", "mark", "br", "img", "p", "div", "span"],
        ALLOWED_ATTR: ["src", "alt", "style", "class"],
      });
      const { error } = await supabase.from("question_comments").insert({
        question_id: questionId,
        user_id: user.id,
        content: clean,
      });
      if (error) throw error;
    },
    onSuccess: () => {
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
    (name || username || "U").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const sanitize = (html: string) =>
    DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "s", "del", "mark", "br", "img", "p", "div", "span"],
      ALLOWED_ATTR: ["src", "alt", "style", "class"],
    });

  return (
    <Card className="gradient-card border-border">
      <CardHeader>
        <CardTitle className="text-base font-display flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Comentários ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
                      className={cn(
                        "text-sm font-semibold transition-colors",
                        c.profiles.subscription_tier === "annual"
                          ? "text-gold hover:text-gold/80"
                          : "text-foreground hover:text-primary"
                      )}
                    >
                      {c.profiles.name || c.profiles.username}
                    </Link>
                    {c.profiles.active_badge_id && (
                      <ActiveBadge badgeId={c.profiles.active_badge_id} />
                    )}
                    {c.profiles.subscription_tier === "annual" && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-gold" title="Assinante Anual">
                        <Crown className="h-3 w-3 fill-gold text-gold" /> VIP
                      </span>
                    )}
                    {(c.profiles.comment_score ?? 0) !== 0 && (
                      <span
                        className={`text-[10px] font-bold ${
                          (c.profiles.comment_score ?? 0) > 0 ? "text-primary" : "text-destructive"
                        }`}
                      >
                        {(c.profiles.comment_score ?? 0) > 0 ? "+" : ""}
                        {c.profiles.comment_score}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">{formatDate(c.created_at)}</span>
                  </div>
                  <div
                    className="text-sm text-foreground/80 mt-1 break-words [&_img]:max-w-[200px] [&_img]:rounded [&_img]:my-1 [&_mark]:bg-accent/40 [&_mark]:px-0.5 [&_mark]:rounded"
                    dangerouslySetInnerHTML={{ __html: sanitize(c.content) }}
                  />
                  <div className="mt-1.5">
                    <CommentVoteButton commentId={c.id} />
                  </div>
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

        {user && (
          <div className="pt-2 border-t border-border">
            <RichTextEditor onSubmit={(html) => addComment.mutate(html)} isPending={addComment.isPending} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
