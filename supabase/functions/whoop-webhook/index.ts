import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-whoop-signature",
};

async function verifySignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sigBytes = Uint8Array.from(
    atob(signature),
    (c) => c.charCodeAt(0)
  );
  return crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(body));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const body = await req.text();
  const signature = req.headers.get("x-whoop-signature") ?? "";
  const secret = Deno.env.get("WHOOP_WEBHOOK_SECRET")!;

  const valid = await verifySignature(body, signature, secret);
  if (!valid) {
    return new Response("Unauthorized", { status: 401 });
  }

  const event = JSON.parse(body) as {
    type: string;
    user_id: number;
    id: number;
  };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Wearable sync işlemi burada tetiklenecek (Integration Agent dolduracak)
  console.log("WHOOP webhook:", event.type, event.user_id);

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
