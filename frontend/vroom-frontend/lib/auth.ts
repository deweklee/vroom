export const getToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

export const setToken = (t: string) => localStorage.setItem("token", t);

export const clearToken = () => localStorage.removeItem("token");
