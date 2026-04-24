const API_BASE = 'http://localhost:3001/api';

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
