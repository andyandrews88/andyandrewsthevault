import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ---- Crypto helpers for Web Push (RFC 8291 / 8292) ----

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = '';
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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

async function createInfo(type: string, clientPublicKey: Uint8Array, serverPublicKey: Uint8Array): Promise<Uint8Array> {
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
    serverPublicKey.buffer
  );
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', key, salt));
  const prkKey = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const infoWithCounter = concatBuffers(info.buffer, new Uint8Array([1]).buffer);
  const result = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey, infoWithCounter));
  return result.slice(0, length);
}

async function encryptPayload(
  clientPublicKeyStr: string,
  clientAuthStr: string,
  payload: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const clientPublicKey = base64UrlToUint8Array(clientPublicKeyStr);
  const clientAuth = base64UrlToUint8Array(clientAuthStr);
  
  const serverKeys = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const serverPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeys.publicKey));
  
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'ECDH', public: await crypto.subtle.importKey('raw', clientPublicKey, { name: 'ECDH', namedCurve: 'P-256' }, false, []) },
    serverKeys.privateKey,
    256
  ));
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const authInfo = new TextEncoder().encode('Content-Encoding: auth\0');
  const prk = await hkdf(clientAuth, sharedSecret, authInfo, 32);
  
  const cekInfo = await createInfo('aesgcm', clientPublicKey, serverPublicKeyRaw);
  const contentEncryptionKey = await hkdf(salt, prk, cekInfo, 16);
  
  const nonceInfo = await createInfo('nonce', clientPublicKey, serverPublicKeyRaw);
  const nonce = await hkdf(salt, prk, nonceInfo, 12);
  
  const paddingLength = 0;
  const paddedPayload = new Uint8Array(2 + paddingLength + new TextEncoder().encode(payload).length);
  new DataView(paddedPayload.buffer).setUint16(0, paddingLength);
  paddedPayload.set(new TextEncoder().encode(payload), 2 + paddingLength);
  
  const key = await crypto.subtle.importKey('raw', contentEncryptionKey, { name: 'AES-GCM' }, false, ['encrypt']);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, paddedPayload));
  
  return { ciphertext: encrypted, salt, serverPublicKey: serverPublicKeyRaw };
}

async function createVapidAuthHeader(endpoint: string, vapidPrivateKey: string, vapidPublicKey: string): Promise<{ authorization: string; cryptoKey: string }> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
  
  const header = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: expiration,
    sub: 'mailto:andyandrewscf@gmail.com'
  })));
  
  const unsignedToken = `${header}.${body}`;
  
  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
  const publicKeyBytes = base64UrlToUint8Array(vapidPublicKey);
  
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33)),
    y: uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65)),
    d: uint8ArrayToBase64Url(privateKeyBytes),
  };
  
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsignedToken)));
  
  // Convert DER to raw r||s if needed
  const token = `${unsignedToken}.${uint8ArrayToBase64Url(signature)}`;
  
  return {
    authorization: `WebPush ${token}`,
    cryptoKey: `p256ecdsa=${vapidPublicKey}`,
  };
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPrivateKey: string,
  vapidPublicKey: string
): Promise<{ success: boolean; status?: number; endpoint: string }> {
  try {
    const { ciphertext, salt, serverPublicKey } = await encryptPayload(subscription.p256dh, subscription.auth, payload);
    const { authorization, cryptoKey } = await createVapidAuthHeader(subscription.endpoint, vapidPrivateKey, vapidPublicKey);
    
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Crypto-Key': `${cryptoKey};dh=${uint8ArrayToBase64Url(serverPublicKey)}`,
        'Content-Encoding': 'aesgcm',
        'Encryption': `salt=${uint8ArrayToBase64Url(salt)}`,
        'Content-Type': 'application/octet-stream',
        'TTL': '86400',
      },
      body: ciphertext,
    });
    
    return { success: response.status >= 200 && response.status < 300, status: response.status, endpoint: subscription.endpoint };
  } catch (err) {
    console.error('Push send error:', err);
    return { success: false, endpoint: subscription.endpoint };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Verify admin
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');

    if (!vapidPrivateKey || !vapidPublicKey) {
      return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify caller is admin
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader! } }
    });
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { title, message } = await req.json();
    if (!title || !message) {
      return new Response(JSON.stringify({ error: 'title and message required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth');

    if (subError) throw subError;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No subscribers' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({ title, body: message, url: '/' });
    const expiredIds: string[] = [];
    let sentCount = 0;

    for (const sub of subscriptions) {
      const result = await sendPushNotification(sub, payload, vapidPrivateKey, vapidPublicKey);
      if (result.success) {
        sentCount++;
      } else if (result.status === 404 || result.status === 410) {
        expiredIds.push(sub.id);
      }
    }

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expiredIds);
    }

    return new Response(JSON.stringify({ sent: sentCount, total: subscriptions.length, expired: expiredIds.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-push error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
