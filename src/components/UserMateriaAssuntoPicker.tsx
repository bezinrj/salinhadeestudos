import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useUserMaterias } from "@/hooks/useUserMaterias";
import { toast } from "sonner";

interface Props {
  selectedDiscipline: string;
  setSelectedDiscipline: (v: string) => void;
  selectedAssunto: string;
  setSelectedAssunto: (v: string) => void;
  disabled?: boolean;
}

export function UserMateriaAssuntoPicker({
  selectedDiscipline,
  setSelectedDiscipline,
  selectedAssunto,
  setSelectedAssunto,
  disabled
}: Props) {
  const { materias, assuntos, createMateria, createAssunto, isLoading } = useUserMaterias();

  const [addingMateria, setAddingMateria] = useState(false);
  const [novaMateria, setNovaMateria] = useState("");

  const [addingAssunto, setAddingAssunto] = useState(false);
  const [novoAssunto, setNovoAssunto] = useState("");

  const materiaObj = materias.find(m => m.nome === selectedDiscipline);
  const materiaId = materiaObj?.id;

  const filteredAssuntos = useMemo(() => {
    if (!materiaId) return [];
    return assuntos.filter(a => a.materia_id === materiaId);
  }, [assuntos, materiaId]);

  const handleCreateMateria = async () => {
    const nome = novaMateria.trim();
    if (!nome) return;
    if (materias.some(m => m.nome.toLowerCase() === nome.toLowerCase())) {
      toast.error("Matéria já existe!");
      return;
    }
    try {
      await createMateria.mutateAsync(nome);
      setSelectedDiscipline(nome);
      setSelectedAssunto("");
      setNovaMateria("");
      setAddingMateria(false);
      toast.success("Matéria criada!");
    } catch (e: any) {
      toast.error("Erro ao criar matéria.");
    }
  };

  const handleCreateAssunto = async () => {
    const nome = novoAssunto.trim();
    if (!nome) return;
    if (!materiaId) {
      toast.error("Selecione uma matéria primeiro.");
      return;
    }
    if (filteredAssuntos.some(a => a.nome.toLowerCase() === nome.toLowerCase())) {
      toast.error("Assunto já existe nesta matéria!");
      return;
    }
    try {
      await createAssunto.mutateAsync({ nome, materia_id: materiaId });
      setSelectedAssunto(nome);
      setNovoAssunto("");
      setAddingAssunto(false);
      toast.success("Assunto criado!");
    } catch (e: any) {
      toast.error("Erro ao criar assunto.");
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* MATÉRIA */}
      <div className="flex gap-2 w-full relative">
        {addingMateria ? (
          <div className="flex gap-2 w-full">
            <Input
              autoFocus
              disabled={disabled || createMateria.isPending}
              placeholder="Nome da nova matéria"
              value={novaMateria}
              onChange={e => setNovaMateria(e.target.value)}
              className="bg-[#1B1E2B] border-white/10 text-white flex-1"
              onKeyDown={e => e.key === "Enter" && handleCreateMateria()}
            />
            <Button 
              disabled={disabled || createMateria.isPending} 
              onClick={handleCreateMateria} 
              className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
            >
              Criar
            </Button>
            <Button 
              disabled={disabled || createMateria.isPending}
              variant="outline" 
              onClick={() => { setAddingMateria(false); setNovaMateria(""); }}
              className="border-white/10 text-white/70 hover:bg-white/5 shrink-0 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 w-full">
            <Select
              value={selectedDiscipline || undefined}
              onValueChange={v => { setSelectedDiscipline(v); setSelectedAssunto(""); }}
              disabled={disabled || isLoading}
            >
              <SelectTrigger className="w-full bg-[#1B1E2B] border-white/10 flex-1">
                <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione a matéria"} />
              </SelectTrigger>
              <SelectContent className="bg-[#1B1E2B] border-white/10 text-white">
                {materias.map(m => (
                  <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              disabled={disabled || isLoading}
              variant="outline"
              onClick={() => setAddingMateria(true)}
              className="border-white/10 text-white/70 hover:bg-white/5 shrink-0 px-3"
              title="Criar nova matéria"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* ASSUNTO */}
      <div className="flex gap-2 w-full relative">
        {addingAssunto ? (
          <div className="flex gap-2 w-full">
            <Input
              autoFocus
              disabled={disabled || createAssunto.isPending || !materiaId}
              placeholder="Nome do novo assunto"
              value={novoAssunto}
              onChange={e => setNovoAssunto(e.target.value)}
              className="bg-[#1B1E2B] border-white/10 text-white flex-1"
              onKeyDown={e => e.key === "Enter" && handleCreateAssunto()}
            />
            <Button 
              disabled={disabled || createAssunto.isPending || !materiaId} 
              onClick={handleCreateAssunto} 
              className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
            >
              Criar
            </Button>
            <Button 
              disabled={disabled || createAssunto.isPending}
              variant="outline" 
              onClick={() => { setAddingAssunto(false); setNovoAssunto(""); }}
              className="border-white/10 text-white/70 hover:bg-white/5 shrink-0 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 w-full">
            <Select
              value={selectedAssunto || undefined}
              onValueChange={setSelectedAssunto}
              disabled={disabled || isLoading || !selectedDiscipline}
            >
              <SelectTrigger className="w-full bg-[#1B1E2B] border-white/10 flex-1">
                <SelectValue placeholder={!selectedDiscipline ? "Selecione uma matéria primeiro" : "Selecione o assunto"} />
              </SelectTrigger>
              <SelectContent className="bg-[#1B1E2B] border-white/10 text-white">
                {filteredAssuntos.length === 0 ? (
                  <div className="p-2 text-xs text-white/50 text-center">Nenhum assunto criado</div>
                ) : (
                  filteredAssuntos.map(a => (
                    <SelectItem key={a.id} value={a.nome}>{a.nome}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button 
              disabled={disabled || isLoading || !selectedDiscipline}
              variant="outline"
              onClick={() => setAddingAssunto(true)}
              className="border-white/10 text-white/70 hover:bg-white/5 shrink-0 px-3"
              title="Criar novo assunto"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
