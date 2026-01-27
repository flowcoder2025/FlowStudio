/**
 * Main Layout
 * Layout for authenticated pages with header and footer
 */

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors safe-area-pt">
      <Header />
      <main className="flex-1 pb-safe md:pb-0">{children}</main>
      <Footer />
    </div>
  );
}
