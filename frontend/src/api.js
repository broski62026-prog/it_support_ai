const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:8000`;

async function readResponse(response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(data, fallback) {
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.detail)) {
    return data.detail.map((item) => item.msg).filter(Boolean).join(", ");
  }
  return fallback;
}

export async function apiRequest(endpoint, options = {}) {
  const token = sessionStorage.getItem("access_token");
  const headers = new Headers(options.headers || {});

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof URLSearchParams)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  const data = await readResponse(response);

  if (response.status === 401) {
    sessionStorage.removeItem("access_token");
    window.dispatchEvent(new Event("auth-expired"));
    throw new Error(getErrorMessage(data, "Session expired. Please login again."));
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, `Request failed (${response.status})`));
  }

  return data;
}

export async function loginUser(username, password) {
  const formData = new URLSearchParams({
    username: username.trim(),
    password,
  });
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });
  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Login failed"));
  }

  sessionStorage.setItem("access_token", data.access_token);
  return data;
}

export async function registerUser(username, email, password) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
  });
}

export async function getCurrentUser() {
  return apiRequest("/api/auth/me");
}

export async function getRoleAccess(role) {
  const endpoint = role === "admin" ? "/api/auth/admin-only" : "/api/auth/employee-only";
  return apiRequest(endpoint);
}

export async function sendChatMessage(message, conversationId) {
  return apiRequest("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      ...(conversationId ? { conversation_id: conversationId } : {}),
    }),
  });
}

export async function submitChatFeedback(conversationId, resolved) {
  return apiRequest(`/api/chat/${conversationId}/feedback`, {
    method: "POST",
    body: JSON.stringify({ resolved }),
  });
}

export async function getConversations() {
  return apiRequest("/api/conversations/");
}

export async function getConversation(conversationId) {
  return apiRequest(`/api/conversations/${conversationId}`);
}

export async function getMyTickets() {
  return apiRequest("/api/tickets/my");
}

export async function getMyTicket(ticketId) {
  return apiRequest(`/api/tickets/${ticketId}`);
}

export async function getAdminTicketSummary() {
  return apiRequest("/api/admin/tickets/summary");
}

export async function getAdminUsers() {
  return apiRequest("/api/admin/users/");
}

export async function createAdminUser(user) {
  return apiRequest("/api/admin/users/", {
    method: "POST",
    body: JSON.stringify(user),
  });
}

export async function updateAdminUserStatus(userId, isActive) {
  return apiRequest(`/api/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
}

export async function getAdminTickets({ limit = 20, skip = 0, ...filters } = {}) {
  const params = new URLSearchParams({ limit: String(limit), skip: String(skip) });
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined && value !== false) {
      params.set(key, String(value));
    }
  });
  return apiRequest(`/api/admin/tickets/?${params}`);
}

export async function getAdminTicket(ticketId) {
  return apiRequest(`/api/admin/tickets/${ticketId}`);
}

export async function updateAdminTicket(ticketId, updates) {
  return apiRequest(`/api/admin/tickets/${ticketId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function assignAdminTicket(ticketId, assignedTo) {
  return apiRequest(`/api/admin/tickets/${ticketId}/assignment`, {
    method: "PATCH",
    body: JSON.stringify({ assigned_to: assignedTo }),
  });
}

export function logoutUser() {
  sessionStorage.removeItem("access_token");
}
