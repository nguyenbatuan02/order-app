const API_BASE_URL = 'http://192.168.1.7:3001';

export interface AuthUser {
  ma: string;
  ten: string;
  quyen: string;
}

export interface Session {
  token: string;
  user: AuthUser;
}

export async function login(ma: string, matKhau: string): Promise<Session> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ma, mat_khau: matKhau }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `Đăng nhập thất bại (${res.status})`);
  }
  return body;
}

export async function logout(token: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}

export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
