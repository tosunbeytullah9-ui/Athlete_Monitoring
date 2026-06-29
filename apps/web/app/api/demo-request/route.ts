import { NextRequest, NextResponse } from "next/server";

const DEMO_REQUEST_EMAIL = process.env["DEMO_REQUEST_EMAIL"] ?? "tosunbeytullah9@gmail.com";

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    name?: string;
    email?: string;
    org?: string;
    count?: string;
  };

  const { name, email, org, count } = body;

  if (!name || !email || !org) {
    return NextResponse.json({ error: "Eksik alanlar" }, { status: 400 });
  }

  const resendApiKey = process.env["RESEND_API_KEY"];

  if (!resendApiKey || resendApiKey.startsWith("re_placeholder")) {
    // Resend key yok — log et ve başarılı dön (demo ortamı)
    console.log("[demo-request]", { name, email, org, count });
    return NextResponse.json({ ok: true });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AthleteIQ <noreply@athleteiq.app>",
      to: DEMO_REQUEST_EMAIL,
      subject: `Demo Talebi: ${org}`,
      html: `
        <h2>Yeni Demo Talebi</h2>
        <table>
          <tr><td><strong>Ad Soyad:</strong></td><td>${name}</td></tr>
          <tr><td><strong>E-posta:</strong></td><td>${email}</td></tr>
          <tr><td><strong>Organizasyon:</strong></td><td>${org}</td></tr>
          <tr><td><strong>Sporcu Sayısı:</strong></td><td>${count ?? "–"}</td></tr>
        </table>
      `,
    }),
  });

  if (!res.ok) {
    console.error("[demo-request] Resend error", await res.text());
    return NextResponse.json({ error: "Email gönderilemedi" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
