/**
 * Edit Page - Redirects to immersive tool mode on home
 * Original standalone page replaced by immersive workflow integration (Phase 5)
 */

import { ToolRedirect } from '@/components/tools/ToolRedirect';

export default function EditPage() {
  return <ToolRedirect toolMode="EDIT" />;
}
