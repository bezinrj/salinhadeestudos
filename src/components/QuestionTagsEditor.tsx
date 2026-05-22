import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubjectTreeSelect } from "@/components/SubjectTreeSelect";
import { useDisciplines } from "@/hooks/useDisciplines";
import { Plus, X } from "lucide-react";

interface QuestionTagsEditorProps {
  disciplines: string[];
  subjects: string[];
  onChange: (disciplines: string[], subjects: string[]) => void;
}

/**
 * Permite adicionar tags extras de Matéria e Assunto à questão.
 * Cada seção tem seu próprio estado interno para evitar conflito
 * entre o picker de "adicionar matéria" e o de "matéria do assunto".
 */
export function QuestionTagsEditor({ disciplines, subjects, onChange }: QuestionTagsEditorProps) {
  const { disciplines: allDisciplines } = useDisciplines();

  // Estados independentes para cada seção
  const [pickDisciplineToAdd, setPickDisciplineToAdd] = useState("");
  const [subjectDiscipline, setSubjectDiscipline] = useState("");
  const [pickSubject, setPickSubject] = useState("");

  const addDiscipline = () => {
    const d = pickDisciplineToAdd;
    if (!d || disciplines.includes(d)) {
      setPickDisciplineToAdd("");
      return;
    }
    onChange([...disciplines, d], subjects);
    setPickDisciplineToAdd("");
  };
  const removeDiscipline = (d: string) => {
    onChange(disciplines.filter((x) => x !== d), subjects);
  };
  const addSubject = () => {
    if (!pickSubject || pickSubject === "Todas" || subjects.includes(pickSubject)) {
      setPickSubject("");
      return;
    }
    onChange(disciplines, [...subjects, pickSubject]);
    setPickSubject("");
  };
  const removeSubject = (s: string) => {
    onChange(disciplines, subjects.filter((x) => x !== s));
  };

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Tags adicionais de Matéria
        </p>
        <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
          {disciplines.length === 0 && (
            <span className="text-xs text-muted-foreground italic">Nenhuma matéria extra</span>
          )}
          {disciplines.map((d) => (
            <Badge key={d} variant="secondary" className="gap-1 pl-2 pr-1 py-0.5">
              {d}
              <button
                type="button"
                onClick={() => removeDiscipline(d)}
                className="ml-1 rounded hover:bg-destructive/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={pickDisciplineToAdd} onValueChange={setPickDisciplineToAdd}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecionar matéria..." />
              </SelectTrigger>
              <SelectContent>
                {allDisciplines
                  .filter((d) => !disciplines.includes(d))
                  .map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" size="sm" onClick={addDiscipline} disabled={!pickDisciplineToAdd}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Tags adicionais de Assunto
        </p>
        <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
          {subjects.length === 0 && (
            <span className="text-xs text-muted-foreground italic">Nenhum assunto extra</span>
          )}
          {subjects.map((s) => (
            <Badge key={s} variant="secondary" className="gap-1 pl-2 pr-1 py-0.5">
              {s}
              <button
                type="button"
                onClick={() => removeSubject(s)}
                className="ml-1 rounded hover:bg-destructive/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select
              value={subjectDiscipline}
              onValueChange={(v) => {
                setSubjectDiscipline(v);
                setPickSubject("");
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Matéria do assunto..." />
              </SelectTrigger>
              <SelectContent>
                {allDisciplines.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <SubjectTreeSelect
              discipline={subjectDiscipline}
              value={pickSubject || "Todas"}
              onValueChange={(v) => setPickSubject(v === "Todas" ? "" : v)}
              disabled={!subjectDiscipline}
              placeholder={subjectDiscipline ? "Selecione um assunto" : "Selecione matéria"}
            />
          </div>
          <Button type="button" size="sm" onClick={addSubject} disabled={!pickSubject}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
