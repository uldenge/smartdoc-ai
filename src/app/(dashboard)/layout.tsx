import { Sidebar, MobileNav } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <MobileNav />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
