import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { badges, isUsernameTaken } from "@/data/mockData";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { StatCard } from "@/components/StatCard";
import { Trophy, FileText, Timer, TrendingUp, Target, Camera, Pencil, Save, X } from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [career, setCareer] = useState(user?.targetCareer || "");
  const [profileError, setProfileError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ avatarUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setProfileError("");
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setProfileError("Nome de usuário não pode estar vazio.");
      return;
    }
    if (trimmedUsername !== user.username && isUsernameTaken(trimmedUsername, user.id)) {
      setProfileError("Nome de usuário já está em uso.");
      return;
    }
    updateProfile({ name, bio, targetCareer: career, username: trimmedUsername });
    setEditing(false);
  };

  const userBadges = user.badges.length > 0 ? user.badges : badges;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20 border-2 border-primary/30">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold font-display">{user.avatar}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="h-5 w-5 text-foreground" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                {editing ? (
                  <div className="space-y-2">
                    {profileError && (
                      <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                        {profileError}
                      </div>
                    )}
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome" className="bg-secondary border-border" />
                    <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Nome de usuário" className="bg-secondary border-border" />
                    <Input value={career} onChange={e => setCareer(e.target.value)} placeholder="Carreira alvo (ex: Delegado)" className="bg-secondary border-border" />
                    <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Escreva algo sobre você..." className="bg-secondary border-border min-h-[80px]" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} className="gradient-electric text-white"><Save className="h-3.5 w-3.5 mr-1" /> Salvar</Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditing(false); setProfileError(""); }} className="border-border"><X className="h-3.5 w-3.5 mr-1" /> Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <h1 className="text-xl font-display font-bold">{user.name}</h1>
                      <button onClick={() => { setEditing(true); setBio(user.bio); setName(user.name); setCareer(user.targetCareer); }} className="text-muted-foreground hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                    {user.bio && <p className="text-sm text-foreground/80 mt-2">{user.bio}</p>}
                    {user.targetCareer && (
                      <Badge variant="outline" className="mt-2 text-primary border-primary/20 bg-primary/10 text-xs">
                        <Target className="h-3 w-3 mr-1" /> {user.targetCareer}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Pontuação" value={user.totalScore.toLocaleString("pt-BR")} icon={TrendingUp} variant="electric" />
        <StatCard title="Ranking" value={user.rankPosition > 0 ? `#${user.rankPosition}` : "—"} icon={Trophy} variant="gold" />
        <StatCard title="Discursivas" value={user.totalEssays} icon={FileText} variant="default" />
        <StatCard title="Nota Média" value={user.averageGrade > 0 ? user.averageGrade.toFixed(1) : "—"} icon={Target} variant="purple" />
      </div>

      {/* Badges */}
      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-display">🏅 Conquistas</CardTitle>
        </CardHeader>
        <CardContent>
          <BadgeDisplay badges={userBadges} />
        </CardContent>
      </Card>
    </div>
  );
}
