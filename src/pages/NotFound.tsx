import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-display font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Página não encontrada</p>
        <Button onClick={() => navigate("/")} className="gradient-electric text-white font-semibold">
          Voltar ao início
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
