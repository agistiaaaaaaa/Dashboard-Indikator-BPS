import type { Request } from "express";

/** Express 5 may type route params as string | string[]. */
export function routeParam(req: Request, name: string): string {
  const raw = req.params[name];
  if (Array.isArray(raw)) return raw[0] ?? "";
  return raw ?? "";
}
