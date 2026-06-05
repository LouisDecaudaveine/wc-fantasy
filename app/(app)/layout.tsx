import { AppHeader } from "@/components/app/app-header";
import { BottomNav } from "@/components/app/bottom-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
      <AppHeader />
      <main className="flex-1 px-4 py-4 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
