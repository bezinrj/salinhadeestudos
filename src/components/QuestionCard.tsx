import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import type { Question } from "@/data/mockData";
import { Users } from "lucide-react";

interface QuestionCardProps {
  question: Question;
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

export function QuestionCard({ question }: QuestionCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="gradient-card border-border hover:border-primary/30 transition-all cursor-pointer group"
      onClick={() => navigate(`/discursivas/${question.id}`)}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="outline" className={cn("text-[10px]", careerColors[question.career])}>
            {question.career}
          </Badge>
          <Badge variant="outline" className={cn("text-[10px]", difficultyColors[question.difficulty])}>
            {question.difficulty}
          </Badge>
        </div>
        <CardTitle className="text-base font-display group-hover:text-primary transition-colors">
          {question.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground mb-3">{question.discipline}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{question.participants} participantes</span>
          </div>
          <Button size="sm" variant="outline" className="text-xs border-primary/30 text-primary hover:bg-primary/10">
            Responder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
