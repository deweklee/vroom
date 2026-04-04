const AUTH_EVENT = "vroom:authchange";

export const getToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

export const setToken = (t: string) => {
  localStorage.setItem("token", t);
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const clearToken = () => {
  localStorage.removeItem("token");
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const onAuthChange = (cb: () => void) => {
  window.addEventListener(AUTH_EVENT, cb);
  return () => window.removeEventListener(AUTH_EVENT, cb);
};

export const isTokenExpired = (): boolean => {
  const token = getToken();
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const clearIfExpired = (): void => {
  if (isTokenExpired()) clearToken();
};
