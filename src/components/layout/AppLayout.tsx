import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { useOnlineTracker } from "@/hooks/useOnlineTracker";
import { FeedbackButton } from "@/components/FeedbackButton";
import { TrialGate } from "@/components/referral/TrialGate";

export function AppLayout() {
  useOnlineTracker();
  return (
    <SidebarProvider>
      <FeedbackButton />
      <TrialGate />
      <div className="min-h-screen flex w-full">
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-h-screen">
          <header className="hidden md:flex h-14 items-center border-b border-border px-4 bg-card/50 backdrop-blur-sm">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          </header>

          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
            <Outlet />
          </main>
        </div>

        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
