export type Role = "admin" | "engineer" | "viewer";

export interface AuthUser {
  username: string;
  role: Role;
}

interface UserRecord {
  salt: string;
  hash: string;
  role: Role;
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator",
  engineer: "Engineer",
  viewer: "Viewer",
};

export const ROLE_DESC: Record<Role, string> = {
  admin: "Akses penuh — input, impor, dan reset data",
  engineer: "Bisa input & impor data produksi",
  viewer: "Hanya melihat dashboard",
};

export function getSecret(): string {
  return process.env.JWT_SECRET ?? "eng-perf-dashboard-secret-2026";
}

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_LENGTH = 256;
const MAX_AGE = 60 * 60 * 8;

const INITIAL_ACCOUNTS: Record<string, { password: string; role: Role }> = {
  admin: { password: "admin123", role: "admin" },
  engineer: { password: "engineer123", role: "engineer" },
  viewer: { password: "viewer123", role: "viewer" },
};

let usersCache: Record<string, UserRecord> | null = null;
let usersPromise: Promise<Record<string, UserRecord>> | null = null;

function b64urlFromBytes(bytes: Uint8Array) {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function bytesFromB64url(input: string) {
  const pad = input.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesFromText(text: string) {
  return new TextEncoder().encode(text);
}

export async function hashPassword(
  password: string,
  salt?: string
): Promise<{ salt: string; hash: string }> {
  const saltBytes = salt ? bytesFromB64url(salt) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", bytesFromText(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations: PBKDF2_ITERATIONS },
    key,
    PBKDF2_KEY_LENGTH
  );
  return { salt: b64urlFromBytes(saltBytes), hash: b64urlFromBytes(new Uint8Array(bits)) };
}

export async function verifyPassword(
  password: string,
  salt: string,
  hash: string
): Promise<boolean> {
  try {
    const derived = await hashPassword(password, salt);
    const a = bytesFromB64url(derived.hash);
    const b = bytesFromB64url(hash);
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
  } catch {
    return false;
  }
}

export async function getUsers(): Promise<Record<string, UserRecord>> {
  if (usersCache) return usersCache;
  if (!usersPromise) {
    usersPromise = (async () => {
      const users: Record<string, UserRecord> = {};
      for (const [username, acc] of Object.entries(INITIAL_ACCOUNTS)) {
        users[username] = { ...(await hashPassword(acc.password)), role: acc.role };
      }
      usersCache = users;
      return users;
    })();
  }
  return usersPromise;
}

export async function getUser(
  username: string
): Promise<{ username: string; salt: string; hash: string; role: Role } | null> {
  const users = await getUsers();
  const record = users[username];
  return record ? { username, ...record } : null;
}

export async function setUserPassword(username: string, password: string): Promise<void> {
  const users = await getUsers();
  const record = users[username];
  if (!record) return;
  users[username] = { ...(await hashPassword(password)), role: record.role };
}

export async function setUserRole(username: string, role: Role): Promise<void> {
  const users = await getUsers();
  if (users[username]) users[username].role = role;
}

export async function signJwt(payload: Record<string, unknown>): Promise<string> {
  const header = b64urlFromBytes(bytesFromText(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64urlFromBytes(
    bytesFromText(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + MAX_AGE }))
  );
  const key = await crypto.subtle.importKey(
    "raw",
    bytesFromText(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, bytesFromText(`${header}.${body}`));
  return `${header}.${body}.${b64urlFromBytes(new Uint8Array(sig))}`;
}

export async function verifyJwt(token: string): Promise<AuthUser | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const key = await crypto.subtle.importKey(
      "raw",
      bytesFromText(getSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      bytesFromB64url(sig),
      bytesFromText(`${header}.${body}`)
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(bytesFromB64url(body))) as {
      sub: string;
      role: Role;
      exp: number;
    };
    if (payload.exp * 1000 < Date.now()) return null;
    return { username: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

export const COOKIE_NAME = "eng_token";
export const AUTH_MAX_AGE = MAX_AGE;