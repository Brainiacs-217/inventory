import { AppHeader } from "@/component/AppHeader";
import { AppSidebar } from "@/component/AppSidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-full overflow-hidden bg-white">
      <AppSidebar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background p-page">
          {children}
        </main>
      </div>
    </div>
  );
}
