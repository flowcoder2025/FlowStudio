/**
 * Main Layout
 * Layout for authenticated pages with header
 */

import { Header } from "@/components/layout/Header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors safe-area-pt">
      <Header />
      <main className="pb-safe md:pb-0">{children}</main>
    </div>
  );
}
