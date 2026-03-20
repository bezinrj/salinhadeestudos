import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import type { Question } from "@/data/mockData";
import { Users, Lock, Unlock, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface QuestionCardProps {
  question: Question;
  onDelete?: (id: string) => void;
}

const careerColors: Record<string, string> = {
  Delegado: "bg-primary/10 text-primary border-primary/20",
  Magistratura: "bg-gold/10 text-gold border-gold/20",
  Promotoria: "bg-purple/10 text-purple border-purple/20",
};

const difficultyColors: Record<string, string> = {
  "Fácil": "bg-green-500/10 text-green-400 border-green-500/20",
  "Médio": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "Difícil": "bg-red-500/10 text-red-400 border-red-500/20",
};

export function QuestionCard({ question, onDelete }: QuestionCardProps) {
  const navigate = useNavigate();
  const { subscribed } = useAuth();
  const isPremium = question.isPremium || question.isWeekly;

  const handleClick = () => {
    if (isPremium && !subscribed) {
      toast.info("Esta questão é exclusiva para assinantes.", {
        action: { label: "Ver planos", onClick: () => navigate("/meu-plano") },
      });
      return;
    }
    navigate(`/discursivas/${question.id}`);
  };

  return (
    <Card className="gradient-card border-border hover:border-primary/30 transition-all cursor-pointer group"
      onClick={handleClick}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="outline" className={cn("text-[10px]", careerColors[question.career])}>
            {question.career}
          </Badge>
          <Badge variant="outline" className={cn("text-[10px]", difficultyColors[question.difficulty])}>
            {question.difficulty}
          </Badge>
          {isPremium ? (
            <Badge variant="outline" className="text-[10px] bg-gold/10 text-gold border-gold/20">
              <Lock className="h-2.5 w-2.5 mr-1" /> Premium
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20">
              <Unlock className="h-2.5 w-2.5 mr-1" /> Gratuita
            </Badge>
          )}
        </div>
        <CardTitle className="text-base font-display group-hover:text-primary transition-colors">
          {question.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground mb-3">
          {question.discipline}
          {(question as any).banca && <span className="ml-1">· {(question as any).banca}</span>}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{question.participants} participantes</span>
          </div>
          <div className="flex items-center gap-2">
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir questão?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir "{question.title}"? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(question.id);
                      }}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button size="sm" variant="outline" className={cn(
              "text-xs",
              isPremium && !subscribed
                ? "border-gold/30 text-gold hover:bg-gold/10"
                : "border-primary/30 text-primary hover:bg-primary/10"
            )}>
              {isPremium && !subscribed ? "Assinar" : "Responder"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
