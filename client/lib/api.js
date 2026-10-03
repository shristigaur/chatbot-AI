const configuredBase = String(process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
const isDevelopment = process.env.NODE_ENV === 'development';
export const API = configuredBase ? `${configuredBase}/api` : (isDevelopment ? 'http://localhost:4000/api' : '');

function requireApiUrl() {
  if (!API) {
    const error = new Error('API URL is not configured. Set NEXT_PUBLIC_API_URL and redeploy the frontend.');
    console.error(error.message);
    throw error;
  }
  return API;
}

export function apiUrl(path) {
  const base = requireApiUrl();
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function safeJson(response) {
  const body = await response.text();
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) throw new Error(`Server error (${response.status}). Please try again.`);
  if (!contentType.includes('application/json')) throw new Error(`Server returned an unexpected response (${response.status}). Please try again.`);
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`Server returned invalid JSON (${response.status}). Please try again.`);
  }
}

export async function assertEventStream(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    let detail = '';
    try { detail = toText((await safeJson(response)).error); } catch { detail = ''; }
    throw new Error(detail || `Server error (${response.status}). Please try again.`);
  }
  if (!contentType.includes('text/event-stream')) throw new Error(`Server returned an unexpected response (${response.status}). Please try again.`);
  return response;
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function request(path, options = {}, { retries = 0 } = {}) {
  const attempt = async () => {
    const response = await fetch(apiUrl(path), { ...options, headers: { 'Content-Type': 'application/json', 'x-anonymous-id': anonymousId(), ...options.headers } });
    return safeJson(response);
  };
  for (let attemptNumber = 0; ; attemptNumber += 1) {
    try {
      return await attempt();
    } catch (error) {
      if (attemptNumber >= retries) throw error;
      await wait(700 * (attemptNumber + 1));
    }
  }
}

export async function warmApi() {
  return request('/health', {}, { retries: 3 });
}

function anonymousId() {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('lumina-anonymous-id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('lumina-anonymous-id', id); }
  return id;
}

function toText(value) {
  if (typeof value === 'string') return value;
  if (value?.message) return String(value.message);
  return value ? JSON.stringify(value) : '';
}
