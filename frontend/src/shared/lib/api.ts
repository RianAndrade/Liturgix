const BASE_URL = "/api";

export async function api<T>(
  path: string,
  options: RequestInit & { skipAuthRedirect?: boolean } = {},
): Promise<T> {
  const { skipAuthRedirect, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    ...((fetchOptions.headers as Record<string, string>) ?? {}),
  };
  if (fetchOptions.body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && !skipAuthRedirect) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  const data = await res.json();
  if (!res.ok) {
    throw { statusCode: res.status, message: data?.message ?? "Erro inesperado" };
  }
  return data;
}
