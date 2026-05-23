import type { AsaasErrorBody } from "./types";

interface RequestOptions {
  apiKey?: string;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

export class AsaasError extends Error {
  status: number;
  body: AsaasErrorBody;
  constructor(status: number, body: AsaasErrorBody, message?: string) {
    super(message ?? body.errors?.[0]?.description ?? `Asaas request failed (${status})`);
    this.status = status;
    this.body = body;
  }
}

function baseUrl(): string {
  const url = process.env.ASAAS_API_URL;
  if (!url) throw new Error("ASAAS_API_URL is not set");
  return url.replace(/\/$/, "");
}

function masterKey(): string {
  const k = process.env.ASAAS_API_KEY;
  if (!k) throw new Error("ASAAS_API_KEY is not set");
  return k;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  opts: RequestOptions = {},
): Promise<T> {
  const apiKey = opts.apiKey ?? masterKey();
  const url = buildUrl(path, opts.query);

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          access_token: apiKey,
          "User-Agent": "caixinha-dos-noivos/1.0",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: opts.signal,
      });

      if (res.status === 204) return undefined as T;

      const text = await res.text();
      const parsed = text ? (JSON.parse(text) as unknown) : ({} as unknown);

      if (!res.ok) {
        throw new AsaasError(res.status, parsed as AsaasErrorBody);
      }

      return parsed as T;
    } catch (err) {
      lastError = err;
      if (err instanceof AsaasError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        continue;
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Asaas request failed");
}

export const asaas = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("POST", path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("PUT", path, body, opts),
  del: <T>(path: string, opts?: RequestOptions) => request<T>("DELETE", path, undefined, opts),
};
