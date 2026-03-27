import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface SubjectTreeSelectProps {
  discipline: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

interface GroupedSubjects {
  [category: string]: { id: string; subject: string }[];
}

export function SubjectTreeSelect({ discipline, value, onValueChange, disabled, placeholder }: SubjectTreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data: rawSubjects = [] } = useQuery({
    queryKey: ["subject-tree", discipline],
    queryFn: async () => {
      if (!discipline) return [];
      const { data, error } = await supabase
        .from("discipline_subjects")
        .select("id, subject, category")
        .eq("discipline", discipline)
        .order("sort_order", { ascending: true })
        .order("subject");
      if (error) throw error;
      return data || [];
    },
    enabled: !!discipline,
  });

  // Group subjects by category
  const grouped: GroupedSubjects = {};
  const uncategorized: { id: string; subject: string }[] = [];

  rawSubjects.forEach((s: any) => {
    if (s.category) {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push({ id: s.id, subject: s.subject });
    } else {
      uncategorized.push({ id: s.id, subject: s.subject });
    }
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleSelect = (subject: string) => {
    onValueChange(subject);
    setOpen(false);
  };

  const displayValue = value && value !== "Todas" && value !== "" ? value : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-10",
            !displayValue && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {displayValue || placeholder || "Selecione o assunto"}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="max-h-[300px] overflow-y-auto p-1">
          {/* "Todos/Nenhum" option */}
          <button
            type="button"
            onClick={() => handleSelect("Todas")}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
              (value === "Todas" || value === "" || !value)
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Todos
          </button>

          {/* Uncategorized subjects */}
          {uncategorized.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s.subject)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                value === s.subject
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {s.subject}
            </button>
          ))}

          {/* Categorized subjects */}
          {Object.entries(grouped).map(([category, subjects]) => {
            const isExpanded = expandedCategories.has(category);
            const hasSelectedChild = subjects.some(s => s.subject === value);

            return (
              <div key={category}>
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    hasSelectedChild
                      ? "text-primary"
                      : "text-foreground hover:bg-accent/50"
                  )}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  )}
                  {category}
                </button>

                {isExpanded && (
                  <div className="ml-4 border-l border-border pl-2">
                    {subjects.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelect(s.subject)}
                        className={cn(
                          "w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors",
                          value === s.subject
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {s.subject}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {rawSubjects.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum assunto cadastrado
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
