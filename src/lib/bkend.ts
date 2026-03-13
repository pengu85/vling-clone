const BKEND_URL = process.env.NEXT_PUBLIC_BKEND_URL || "https://api.bkend.ai";
const BKEND_API_KEY = process.env.BKEND_API_KEY || "";

export const bkendClient = {
  async get<T>(path: string, token?: string): Promise<T> {
    const res = await fetch(`${BKEND_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(BKEND_API_KEY ? { "x-api-key": BKEND_API_KEY } : {}),
      },
    });
    if (!res.ok) throw new Error(`bkend error: ${res.status}`);
    return res.json();
  },
  async post<T>(path: string, body: unknown, token?: string): Promise<T> {
    const res = await fetch(`${BKEND_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(BKEND_API_KEY ? { "x-api-key": BKEND_API_KEY } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`bkend error: ${res.status}`);
    return res.json();
  },
  async put<T>(path: string, body: unknown, token?: string): Promise<T> {
    const res = await fetch(`${BKEND_URL}${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(BKEND_API_KEY ? { "x-api-key": BKEND_API_KEY } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`bkend error: ${res.status}`);
    return res.json();
  },
  async delete(path: string, token?: string): Promise<void> {
    const res = await fetch(`${BKEND_URL}${path}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(BKEND_API_KEY ? { "x-api-key": BKEND_API_KEY } : {}),
      },
    });
    if (!res.ok) throw new Error(`bkend error: ${res.status}`);
  },
};
