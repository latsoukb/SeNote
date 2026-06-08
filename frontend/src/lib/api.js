const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WORKSPACE_ID = 'local';

let backendAvailable = null;

export const isBackendEnabled = () => process.env.REACT_APP_USE_BACKEND !== 'false';

export const checkBackend = async () => {
  if (!isBackendEnabled()) {
    backendAvailable = false;
    return false;
  }
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
    backendAvailable = res.ok;
    return res.ok;
  } catch {
    backendAvailable = false;
    return false;
  }
};

export const getBackendStatus = () => backendAvailable;

export const fetchWorkspace = async () => {
  const res = await fetch(`${API_BASE}/api/workspace`, {
    headers: { 'X-Workspace-Id': WORKSPACE_ID },
  });
  if (!res.ok) throw new Error(`fetchWorkspace: ${res.status}`);
  return res.json();
};

export const saveWorkspace = async (data) => {
  const res = await fetch(`${API_BASE}/api/workspace`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Workspace-Id': WORKSPACE_ID,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`saveWorkspace: ${res.status}`);
  return res.json();
};
