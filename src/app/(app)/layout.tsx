import { AppHeader } from "@/component/AppHeader";
import { AppSidebar } from "@/component/AppSidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-white">
      <AppSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto bg-background p-page">
          {children}
        </main>
      </div>
    </div>
  );
}
