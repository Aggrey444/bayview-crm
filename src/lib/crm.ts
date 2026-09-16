export interface LeadPayload {
  name: string;
  email?: string;
  phone?: string;
  service?: string;
  message?: string;
}

export async function submitLead(formData: LeadPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/public/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        source: "Website",
        utmSource: "website_inquiry",
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { ok: false, error: data?.error || "Failed to submit inquiry. Please try again." };
    }

    return { ok: true };
  } catch (error) {
    console.error("CRM submission error:", error);
    return { ok: false, error: "Network error. Please try again or reach out via WhatsApp." };
  }
}
