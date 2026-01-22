/**
 * Workflow Industries API
 * Contract: API_ROUTE_WORKFLOW_INDUSTRIES
 */

import { NextResponse } from "next/server";
import { getAllIndustries, getIndustryInfo, isValidIndustry } from "@/lib/workflow/industries";

/**
 * GET /api/workflows/industries
 * Get all industries or a specific industry by query param
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const industryId = searchParams.get("id");

    if (industryId) {
      // Get specific industry
      if (!isValidIndustry(industryId)) {
        return NextResponse.json(
          { error: "Invalid industry ID" },
          { status: 400 }
        );
      }
      const industry = getIndustryInfo(industryId);
      return NextResponse.json(industry);
    }

    // Get all industries
    const industries = getAllIndustries();
    return NextResponse.json(industries);
  } catch (error) {
    console.error("Industries fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch industries" },
      { status: 500 }
    );
  }
}
