"use client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sessionKey = "beauty-supabase-session";

type SupabaseError = {
  error?: string;
  error_description?: string;
  msg?: string;
  message?: string;
};

export type AuthUser = {
  id?: string;
  email?: string;
  email_confirmed_at?: string | null;
};

export type AuthResult<T = { user?: AuthUser }> = {
  data: T;
  error: Error | null;
};

export function isSupabaseConfigured() {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes("your-project-ref") &&
      !supabaseAnonKey.includes("your-supabase-anon-key"),
  );
}

function requireSupabaseConfig() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase 还没有配置。请填写 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。");
  }
  return {
    url: supabaseUrl as string,
    anonKey: supabaseAnonKey as string,
  };
}

function authHeaders(anonKey: string, accessToken?: string) {
  return {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${accessToken || anonKey}`,
  };
}

async function parseAuthResponse<T>(response: Response): Promise<AuthResult<T>> {
  const data = (await response.json().catch(() => ({}))) as T & SupabaseError;
  if (!response.ok) {
    return {
      data: data as T,
      error: new Error(data.error_description || data.message || data.msg || data.error || "Supabase request failed."),
    };
  }
  return { data: data as T, error: null };
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult<{ user?: AuthUser }>> {
  const { url, anonKey } = requireSupabaseConfig();
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/login?confirmed=1`;
  const response = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: authHeaders(anonKey),
    body: JSON.stringify({
      email,
      password,
      data: { source: "beauty-ai-platform" },
      redirect_to: redirectTo,
    }),
  });
  return parseAuthResponse(response);
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult<{ access_token?: string; refresh_token?: string; user: AuthUser }>> {
  const { url, anonKey } = requireSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: authHeaders(anonKey),
    body: JSON.stringify({ email, password }),
  });
  const result = await parseAuthResponse<{ access_token?: string; refresh_token?: string; user: AuthUser }>(response);
  if (!result.error && result.data.access_token) {
    localStorage.setItem(sessionKey, JSON.stringify(result.data));
  }
  return result;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { url, anonKey } = requireSupabaseConfig();
  const session = JSON.parse(localStorage.getItem(sessionKey) || "{}") as { access_token?: string };
  if (!session.access_token) return null;

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: authHeaders(anonKey, session.access_token),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as AuthUser;
  return data;
}

export async function signOut() {
  localStorage.removeItem(sessionKey);
}
