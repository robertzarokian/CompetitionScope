"use client";

import { VisibilityPanel } from "@/components/audit/VisibilityPanel";
import { SiteChecksPanel } from "@/components/audit/SiteChecksPanel";
import { BacklinksPanel } from "@/components/audit/BacklinksPanel";
import { SAMPLE_ANALYSIS, SAMPLE_BACKLINKS, SAMPLE_CHECKS } from "@/lib/sampleAudit";

// The live audit panels, filled with the fictional sample data. They are
// client components because the website checks list uses click handlers.
export function SampleVisibility() {
  return <VisibilityPanel analysis={SAMPLE_ANALYSIS} errors={[]} runsPerQuestion={2} />;
}

export function SampleSite() {
  return (
    <div className="space-y-6">
      <SiteChecksPanel checks={SAMPLE_CHECKS} note="Checks 6 to 8 (backlinks and advertising) are shown in their own sections." />
      <BacklinksPanel rows={SAMPLE_BACKLINKS} clientDomain="tallyfox.example" />
    </div>
  );
}
