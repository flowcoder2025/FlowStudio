/**
 * Home Page - Industry Selection with Recommendations
 * Contract: INTEGRATION_DESIGN_WORKFLOW_HOME
 * Evidence: Phase 10 Page Integration
 *
 * Optimizations applied:
 * - Server Component for initial data loading (Vercel Best Practice: server-client separation)
 * - Static data fetched on server, passed to client
 */

import { getAllIndustries } from "@/lib/workflow/industries";
import { HomeClient } from "@/components/home/HomeClient";

export default function HomePage() {
  // Server-side: Get static industries data
  // This runs on the server, reducing client JS bundle
  const industries = getAllIndustries();

  return <HomeClient industries={industries} />;
}
