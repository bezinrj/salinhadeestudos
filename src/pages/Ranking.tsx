import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankingTable } from "@/components/RankingTable";
import { mockUsers, hoursRanking } from "@/data/mockData";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Clock, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function Ranking() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">Ranking</h1>
        <p className="text-sm text-muted-foreground mt-1">Veja quem está dominando a Salinha</p>
      </div>

      {/* Podium */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="gradient-card border-border overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-end justify-center gap-4 md:gap-8">
              {/* 2nd place */}
              <div className="text-center">
                <Avatar className="h-14 w-14 mx-auto mb-2 border-2 border-muted-foreground/30">
                  <AvatarFallback className="bg-secondary text-sm font-bold">{mockUsers[1].avatar}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold">{mockUsers[1].name.split(" ")[0]}</p>
                <p className="text-xs text-muted-foreground">{mockUsers[1].score.toLocaleString("pt-BR")} pts</p>
                <div className="mt-2 h-20 w-20 rounded-t-lg bg-secondary/50 flex items-center justify-center">
                  <span className="text-2xl font-bold text-muted-foreground">2</span>
                </div>
              </div>
              {/* 1st place */}
              <div className="text-center">
                <div className="text-2xl mb-1">👑</div>
                <Avatar className="h-16 w-16 mx-auto mb-2 border-2 border-gold/50 glow-gold">
                  <AvatarFallback className="bg-gold/10 text-gold text-sm font-bold">{mockUsers[0].avatar}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-bold text-gold">{mockUsers[0].name.split(" ")[0]}</p>
                <p className="text-xs text-gold/70">{mockUsers[0].score.toLocaleString("pt-BR")} pts</p>
                <div className="mt-2 h-28 w-20 rounded-t-lg gradient-gold flex items-center justify-center">
                  <span className="text-2xl font-bold text-black">1</span>
                </div>
              </div>
              {/* 3rd place */}
              <div className="text-center">
                <Avatar className="h-14 w-14 mx-auto mb-2 border-2 border-orange-400/30">
                  <AvatarFallback className="bg-secondary text-sm font-bold">{mockUsers[2].avatar}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold">{mockUsers[2].name.split(" ")[0]}</p>
                <p className="text-xs text-muted-foreground">{mockUsers[2].score.toLocaleString("pt-BR")} pts</p>
                <div className="mt-2 h-14 w-20 rounded-t-lg bg-orange-400/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-orange-400">3</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-secondary w-full grid grid-cols-4">
          <TabsTrigger value="general" className="text-xs"><Trophy className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Geral</TabsTrigger>
          <TabsTrigger value="essays" className="text-xs"><Medal className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Discursivas</TabsTrigger>
          <TabsTrigger value="hours" className="text-xs"><Clock className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Horas</TabsTrigger>
          <TabsTrigger value="weekly" className="text-xs"><Calendar className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Semanal</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="gradient-card border-border">
            <CardContent className="p-4">
              <RankingTable entries={mockUsers} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="essays">
          <Card className="gradient-card border-border">
            <CardContent className="p-4">
              <RankingTable entries={mockUsers.map((u, i) => ({ ...u, score: Math.round(u.score * 0.7), position: i + 1 }))} valueLabel="Questões" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card className="gradient-card border-border">
            <CardContent className="p-4">
              <RankingTable entries={hoursRanking} valueLabel="horas" valueFormatter={(v) => `${v}h`} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card className="gradient-card border-border">
            <CardContent className="p-4">
              <RankingTable entries={mockUsers.slice(0, 10).map((u, i) => ({ ...u, score: Math.round(u.score * 0.3), position: i + 1 }))} valueLabel="pts" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
