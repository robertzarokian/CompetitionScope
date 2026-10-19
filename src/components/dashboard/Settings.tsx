"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

export function Settings({
  emailAlerts,
  brandName,
  whiteLabel,
  canManageBilling,
}: {
  emailAlerts: boolean;
  brandName: string | null;
  whiteLabel: boolean;
  canManageBilling: boolean;
}) {
  const router = useRouter();
  const [alerts, setAlerts] = useState(emailAlerts);
  const [brand, setBrand] = useState(brandName ?? "");
  const [message, setMessage] = useState<string | null>(null);

  async function save(body: object) {
    setMessage(null);
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Saved." : (data.error ?? "Something went wrong."));
    router.refresh();
  }

  async function billing() {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (data.url) window.location.href = data.url;
    else setMessage(data.error ?? "The billing page could not be opened.");
  }

  return (
    <div className="space-y-5">
      <label className="flex cursor-pointer items-center gap-3 text-sm text-navy-800">
        <input
          type="checkbox"
          checked={alerts}
          onChange={(e) => {
            setAlerts(e.target.checked);
            void save({ emailAlerts: e.target.checked });
          }}
          className="h-4 w-4 accent-brass-500"
        />
        Email me when something changes
      </label>

      {whiteLabel && (
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-navy-800">
            Your brand name on PDF reports
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="brand"
              value={brand}
              maxLength={40}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="CompetitionScope"
              className="w-full max-w-xs border border-navy-600 bg-cream-50 px-3.5 py-2.5 text-sm"
            />
            <Button size="sm" onClick={() => void save({ brandName: brand })}>
              Save
            </Button>
          </div>
        </div>
      )}

      {canManageBilling && (
        <Button variant="secondary" size="sm" onClick={() => void billing()}>
          Manage billing or cancel
        </Button>
      )}
      {message && <p className="text-xs text-navy-500">{message}</p>}
    </div>
  );
}
