const API_BASE = process.env.REACT_APP_API_BASE || '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export async function fetchAll(endpoint, search = '') {
  const url = search ? `${API_BASE}/${endpoint}?search=${encodeURIComponent(search)}` : `${API_BASE}/${endpoint}`;
  const res = await fetch(url, { headers: getHeaders() });
  return res.json();
}

export async function fetchOne(endpoint, id) {
  const res = await fetch(`${API_BASE}/${endpoint}/${id}`, { headers: getHeaders() });
  return res.json();
}

export async function createItem(endpoint, data) {
  const res = await fetch(`${API_BASE}/${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error);
  return result;
}

export async function updateItem(endpoint, id, data) {
  const res = await fetch(`${API_BASE}/${endpoint}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error);
  return result;
}

export async function deleteItem(endpoint, id) {
  const res = await fetch(`${API_BASE}/${endpoint}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error);
  return result;
}

export async function runAI(endpoint, data) {
  const res = await fetch(`${API_BASE}/ai/${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error);
  return result;
}

// Paginated list helper (page, limit, search)
export async function fetchPaginated(endpoint, { page = 1, limit = 20, search = '' } = {}) {
  const qs = new URLSearchParams({ page, limit, ...(search ? { search } : {}) });
  const res = await fetch(`${API_BASE}/${endpoint}?${qs}`, { headers: getHeaders() });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch');
  return res.json();
}

export async function fetchAIResults({ page = 1, limit = 20, endpoint = '' } = {}) {
  const qs = new URLSearchParams({ page, limit, ...(endpoint ? { endpoint } : {}) });
  const res = await fetch(`${API_BASE}/ai/results?${qs}`, { headers: getHeaders() });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch');
  return res.json();
}

export async function listWebhooks() {
  const res = await fetch(`${API_BASE}/webhooks`, { headers: getHeaders() });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed');
  return res.json();
}

export async function createWebhook(data) {
  const res = await fetch(`${API_BASE}/webhooks`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error);
  return result;
}

export async function deleteWebhook(id) {
  const res = await fetch(`${API_BASE}/webhooks/${id}`, { method: 'DELETE', headers: getHeaders() });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed');
  return res.json();
}

export async function testWebhook(id) {
  const res = await fetch(`${API_BASE}/webhooks/${id}/test`, { method: 'POST', headers: getHeaders() });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed');
  return res.json();
}

export async function submitAIFeedback(payload) {
  const res = await fetch(`${API_BASE}/ai/feedback`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed');
  return res.json();
}
