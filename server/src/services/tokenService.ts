import axios from 'axios';

const LOGIN_URL = 'https://api.idg.vnpt.vn/auth/oauth/token';
const USERNAME  = process.env.VNPT_USERNAME!;
const PASSWORD  = process.env.VNPT_PASSWORD!;
const CLIENT_ID = process.env.VNPT_CLIENT_ID || '8_hour';
const CLIENT_SECRET = process.env.VNPT_CLIENT_SECRET || 'password';

interface TokenCache {
  token: string;
  expiresAt: number; // ms timestamp
}

let cache: TokenCache | null = null;

export async function getAccessToken(overrideToken?: string): Promise<string> {
  if (overrideToken) return overrideToken;

  // Còn hạn (buffer 5 phút)
  if (cache && Date.now() < cache.expiresAt - 5 * 60 * 1000) {
    return cache.token;
  }

  console.log('[tokenService] 🔑 Lấy access token mới từ VNPT...');
  const params = new URLSearchParams({
    grant_type: 'password',
    username: USERNAME,
    password: PASSWORD,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await axios.post(LOGIN_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 10000,
  });

  const { access_token, expires_in } = res.data as { access_token: string; expires_in: number };
  cache = {
    token: access_token,
    expiresAt: Date.now() + expires_in * 1000,
  };

  console.log(`[tokenService] ✅ Token mới, hết hạn sau ${Math.round(expires_in / 3600)}h`);
  return cache.token;
}

/** Xóa cache để force refresh lần sau */
export function invalidateToken(): void {
  cache = null;
}
