import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth, type Profile as ProfileType } from "@/contexts/AuthContext";
import { badges } from "@/data/mockData";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { StatCard } from "@/components/StatCard";
import { ProfileLikeButton } from "@/components/ProfileLikeButton";
import { Trophy, FileText, Timer, TrendingUp, Target, Camera, Pencil, Save, X, Heart, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  const { userId } = useParams();
  const { user, profile: myProfile, updateProfile } = useAuth();
  const isOwnProfile = !userId || userId === user?.id;

  // Fetch other user's profile
  const { data: otherProfile } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .single();
      if (error) throw error;
      return data as ProfileType;
    },
    enabled: !isOwnProfile && !!userId,
  });

  const profile = isOwnProfile ? myProfile : otherProfile;

  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(myProfile?.bio || "");
  const [name, setName] = useState(myProfile?.name || "");
  const [username, setUsername] = useState(myProfile?.username || "");
  const [career, setCareer] = useState(myProfile?.target_career || "");
  const [profileError, setProfileError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const initials = (profile.name || profile.username || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ avatar_url: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setProfileError("");
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setProfileError("Nome de usuário não pode estar vazio.");
      return;
    }
    await updateProfile({ name, bio, target_career: career, username: trimmedUsername });
    setEditing(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20 border-2 border-primary/30">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold font-display">{initials}</AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="h-5 w-5 text-foreground" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                {isOwnProfile && editing ? (
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
                      <h1 className="text-xl font-display font-bold">{profile.name || profile.username}</h1>
                      {isOwnProfile && (
                        <button onClick={() => { setEditing(true); setBio(myProfile!.bio); setName(myProfile!.name); setUsername(myProfile!.username); setCareer(myProfile!.target_career); setProfileError(""); }} className="text-muted-foreground hover:text-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                    {profile.bio && <p className="text-sm text-foreground/80 mt-2">{profile.bio}</p>}
                    <div className="flex items-center gap-2 mt-2 flex-wrap justify-center sm:justify-start">
                      {profile.target_career && (
                        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10 text-xs">
                          <Target className="h-3 w-3 mr-1" /> {profile.target_career}
                        </Badge>
                      )}
                      {!isOwnProfile && userId && <ProfileLikeButton profileId={userId} />}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard title="Pontuação" value={profile.total_score.toLocaleString("pt-BR")} icon={TrendingUp} variant="electric" />
        <StatCard title="Ranking" value={profile.rank_position > 0 ? `#${profile.rank_position}` : "—"} icon={Trophy} variant="gold" />
        <StatCard title="Discursivas" value={profile.total_essays} icon={FileText} variant="default" />
        <StatCard title="Nota Média" value={profile.average_grade > 0 ? Number(profile.average_grade).toFixed(1) : "—"} icon={Target} variant="purple" />
        <StatCard title="Reputação" value={profile.comment_score !== null && profile.comment_score !== undefined ? (profile.comment_score > 0 ? `+${profile.comment_score}` : String(profile.comment_score)) : "0"} icon={MessageSquare} variant="default" />
      </div>

      {isOwnProfile && (
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-display">🏅 Conquistas</CardTitle>
          </CardHeader>
          <CardContent>
            <BadgeDisplay badges={badges} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
