"use client";

/**
 * ToolRedirect - Redirects standalone tool pages to immersive home workflow
 *
 * When a user navigates directly to /edit, /poster, etc.,
 * this component activates the tool's immersive mode and redirects to home.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useWorkflowStore } from "@/lib/workflow/store";
import type { ToolMode } from "@/lib/tools/types";

interface ToolRedirectProps {
  toolMode: ToolMode;
}

export function ToolRedirect({ toolMode }: ToolRedirectProps) {
  const router = useRouter();
  const enterToolMode = useWorkflowStore((state) => state.enterToolMode);

  useEffect(() => {
    enterToolMode(toolMode);
    router.replace("/");
  }, [toolMode, enterToolMode, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );
}
