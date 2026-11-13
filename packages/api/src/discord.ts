import { TRPCError } from "@trpc/server";

export async function discordRequest<T>(url: string, init: RequestInit, action: string): Promise<T> {
  let response: Response;
  try {
    response = await globalThis.fetch(url, init);
  } catch {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `${action}: Discord could not be reached` });
  }

  if (!response.ok) {
    let detail = "";
    let discordCode: number | undefined;
    try {
      const body = await response.json() as { message?: string; code?: number };
      detail = typeof body.message === "string" ? `: ${body.message}` : "";
      discordCode = typeof body.code === "number" ? body.code : undefined;
    } catch { /* Discord may return an empty or non-JSON error body. */ }
    const code = response.status === 401 ? "UNAUTHORIZED" :
      response.status === 403 ? "FORBIDDEN" :
      response.status === 404 ? "NOT_FOUND" :
      response.status === 429 ? "TOO_MANY_REQUESTS" : "INTERNAL_SERVER_ERROR";
    throw new TRPCError({ code, message: `${action}: Discord returned ${response.status}${detail}`,
      cause: { discordCode } });
  }

  if (response.status === 204) return undefined as T;
  try {
    return await response.json() as T;
  } catch {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `${action}: Discord returned an invalid response` });
  }
}
