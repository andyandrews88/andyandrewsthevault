import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---- Web Push crypto (RFC 8291 / 8292) ----

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = "";
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concatBuffers(...buffers: ArrayBuffer[]): Uint8Array {
  const total = buffers.reduce((sum, b) => sum + b.byteLength, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const b of buffers) {
    result.set(new Uint8Array(b), offset);
    offset += b.byteLength;
  }
  return result;
}

function createInfo(type: string, clientPublicKey: Uint8Array, serverPublicKey: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const typeBuffer = encoder.encode(`Content-Encoding: ${type}\0`);
  const clientLen = new Uint8Array(2);
  new DataView(clientLen.buffer).setUint16(0, clientPublicKey.length);
  const serverLen = new Uint8Array(2);
  new DataView(serverLen.buffer).setUint16(0, serverPublicKey.length);
  return concatBuffers(
    typeBuffer.buffer,
    new Uint8Array([0]).buffer,
    clientLen.buffer,
    clientPublicKey.buffer,
    serverLen.buffer,
    serverPublicKey.buffer,
  );
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", key, salt));
  const prkKey = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const infoWithCounter = concatBuffers(info.buffer, new Uint8Array([1]).buffer);
  const result = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, infoWithCounter));
  return result.slice(0, length);
}

async function encryptPayload(clientPublicKeyStr: string, clientAuthStr: string, payload: string) {
  const clientPublicKey = base64UrlToUint8Array(clientPublicKeyStr);
  const clientAuth = base64UrlToUint8Array(clientAuthStr);

  const serverKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const serverPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeys.publicKey));

  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: "ECDH",
        public: await crypto.subtle.importKey("raw", clientPublicKey, { name: "ECDH", namedCurve: "P-256" }, false, []),
      },
      serverKeys.privateKey,
      256,
    ),
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const authInfo = new TextEncoder().encode("Content-Encoding: auth\0");
  const prk = await hkdf(clientAuth, sharedSecret, authInfo, 32);
  const contentEncryptionKey = await hkdf(salt, prk, createInfo("aesgcm", clientPublicKey, serverPublicKeyRaw), 16);
  const nonce = await hkdf(salt, prk, createInfo("nonce", clientPublicKey, serverPublicKeyRaw), 12);

  const bytes = new TextEncoder().encode(payload);
  const paddedPayload = new Uint8Array(2 + bytes.length);
  new DataView(paddedPayload.buffer).setUint16(0, 0);
  paddedPayload.set(bytes, 2);

  const key = await crypto.subtle.importKey("raw", contentEncryptionKey, { name: "AES-GCM" }, false, ["encrypt"]);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, paddedPayload));

  return { ciphertext: encrypted, salt, serverPublicKey: serverPublicKeyRaw };
}

async function createVapidAuthHeader(endpoint: string, vapidPrivateKey: string, vapidPublicKey: string) {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  const header = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = uint8ArrayToBase64Url(
    new TextEncoder().encode(JSON.stringify({ aud: audience, exp: expiration, sub: "mailto:andyandrewscf@gmail.com" })),
  );
  const unsignedToken = `${header}.${body}`;

  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
  const publicKeyBytes = base64UrlToUint8Array(vapidPublicKey);
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33)),
    y: uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65)),
    d: uint8ArrayToBase64Url(privateKeyBytes),
  };

  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(unsignedToken)),
  );

  return {
    authorization: `WebPush ${unsignedToken}.${uint8ArrayToBase64Url(signature)}`,
    cryptoKey: `p256ecdsa=${vapidPublicKey}`,
  };
}

async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPrivateKey: string,
  vapidPublicKey: string,
) {
  try {
    const { ciphertext, salt, serverPublicKey } = await encryptPayload(subscription.p256dh, subscription.auth, payload);
    const { authorization, cryptoKey } = await createVapidAuthHeader(subscription.endpoint, vapidPrivateKey, vapidPublicKey);
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Crypto-Key": `${cryptoKey};dh=${uint8ArrayToBase64Url(serverPublicKey)}`,
        "Content-Encoding": "aesgcm",
        Encryption: `salt=${uint8ArrayToBase64Url(salt)}`,
        "Content-Type": "application/octet-stream",
        TTL: "86400",
      },
      body: ciphertext,
    });
    return { success: response.status >= 200 && response.status < 300, status: response.status };
  } catch (err) {
    console.error("push send error", err);
    return { success: false, status: 0 };
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/**
 * Sends a Web Push notification to ONE recipient the caller is allowed to notify.
 *   type "message"     -> requires an active coach<->client messaging relationship
 *   type "programming" -> requires the caller to be the recipient's coach (or admin)
 * Recipient notification preferences are always respected.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    if (!vapidPrivateKey || !vapidPublicKey) return json({ error: "Push is not configured" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { type, recipientId, preview, title, url } = await req.json();
    if (!recipientId || (type !== "message" && type !== "programming")) {
      return json({ error: "type and recipientId are required" }, 400);
    }
    if (recipientId === user.id) return json({ sent: 0, reason: "self" });

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // --- Authorisation: the caller must actually be connected to the recipient ---
    if (type === "message") {
      const { data: allowed } = await admin.rpc("can_direct_message", { _a: user.id, _b: recipientId });
      if (!allowed) return json({ error: "Not allowed" }, 403);
    } else {
      const { data: isCoach } = await admin.rpc("is_coach_of", { _coach_id: user.id, _client_id: recipientId });
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isCoach && !isAdmin) return json({ error: "Not allowed" }, 403);
    }

    // --- Recipient preferences ---
    const { data: profile } = await admin
      .from("user_profiles")
      .select("display_name, notification_preferences")
      .eq("id", recipientId)
      .maybeSingle();
    const prefs = (profile?.notification_preferences ?? {}) as Record<string, unknown>;
    if (prefs.mute_all === true) return json({ sent: 0, reason: "muted" });
    if (type === "message" && prefs.message_alerts === false) return json({ sent: 0, reason: "opted_out" });
    if (type === "programming" && prefs.programming_alerts === false) return json({ sent: 0, reason: "opted_out" });

    const { data: senderProfile } = await admin
      .from("user_profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    const senderName = senderProfile?.display_name ?? "Your coach";

    const { data: subscriptions } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", recipientId);

    if (!subscriptions || subscriptions.length === 0) return json({ sent: 0, reason: "no_subscriptions" });

    const payload = JSON.stringify({
      title: title ?? (type === "message" ? senderName : "New programming"),
      body:
        preview ??
        (type === "message" ? "Sent you a message" : `${senderName} published new training for you`),
      url: url ?? (type === "message" ? "/vault?tab=coach" : "/vault?tab=train"),
    });

    const expired: string[] = [];
    let sent = 0;
    for (const sub of subscriptions) {
      const result = await sendPush(sub, payload, vapidPrivateKey, vapidPublicKey);
      if (result.success) sent++;
      else if (result.status === 404 || result.status === 410) expired.push(sub.id);
    }
    if (expired.length > 0) await admin.from("push_subscriptions").delete().in("id", expired);

    return json({ sent, total: subscriptions.length, expired: expired.length });
  } catch (err) {
    console.error("notify-user error", err);
    return json({ error: (err as Error).message }, 500);
  }
});
