import { match } from "path-to-regexp";
import { handleOptions } from "./cors";
import { Env } from "./env";

// A very tiny router
export async function router(
  req: Request,
  env: Env,
  routes: {
    [path: string]: (req: Request, env: Env, params: any) => Promise<Response>;
  }
) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Handle OPTIONS
  if (req.method === "OPTIONS") {
    return handleOptions(req);
  }

  for (const route in routes) {
    const pathMatcher = match(route, {
      decode: decodeURIComponent,
    });
    const matched = pathMatcher(pathname);
    if (!matched) continue;
    const resp = await routes[route](req, env, matched.params);

    // Handle CORS
    resp.headers.set(
      "Access-Control-Allow-Origin",
      req.headers.get("Origin") || "*"
    );

    return resp;
  }

  return new Response("Not Found", { status: 404 });
}
