// Email through Resend's HTTP API. Switched on by RESEND_API_KEY plus
// ALERT_FROM_EMAIL (an address on a domain verified in Resend). Without them,
// alerts still appear in the dashboard and nothing is emailed.
export function emailEnabled(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.ALERT_FROM_EMAIL);
}

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function sendEmail(args: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
  if (!emailEnabled()) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.ALERT_FROM_EMAIL,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        text: args.text,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.error(`[email] Resend HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send failed:", err);
    return false;
  }
}

export function alertDigest(
  company: string,
  alerts: { title: string; body: string }[],
  dashboardUrl: string
): { subject: string; html: string; text: string } {
  const subject =
    alerts.length === 1 ? `${company}: ${alerts[0].title}` : `${company}: ${alerts.length} changes since your last check`;
  const items = alerts
    .map(
      (a) =>
        `<li style="margin:0 0 14px"><strong>${escapeHtml(a.title)}</strong><br>${escapeHtml(a.body)}</li>`
    )
    .join("");
  const html = `<div style="font-family:Georgia,serif;color:#151c2a;max-width:560px">
<h2 style="margin:0 0 12px">${escapeHtml(company)}</h2>
<ul style="padding-left:18px">${items}</ul>
<p><a href="${escapeHtml(dashboardUrl)}" style="color:#7d5b2a">Open your dashboard</a> to see the full details and your checklist.</p>
<p style="color:#5c6d8c;font-size:12px">You can turn these emails off in your dashboard.</p></div>`;
  const text = `${company}\n\n${alerts.map((a) => `${a.title}\n${a.body}`).join("\n\n")}\n\nOpen your dashboard: ${dashboardUrl}`;
  return { subject, html, text };
}
