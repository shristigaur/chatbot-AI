import { API } from './api';

export async function apiFetch(url, options = {}) {
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('accessToken');
  }

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const config = {
    ...options,
    headers,
    credentials: 'include',
  };

  let response = await fetch(url, config);

  if (response.status === 401 && typeof window !== 'undefined') {
    // try to refresh
    const refreshRes = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      localStorage.setItem('accessToken', data.accessToken);
      
      // Retry original request
      headers.set('Authorization', `Bearer ${data.accessToken}`);
      response = await fetch(url, { ...config, headers });
    } else {
      localStorage.removeItem('accessToken');
      // Dispatch custom event to trigger logout flow
      window.dispatchEvent(new Event('auth-expired'));
    }
  }

  return response;
}
