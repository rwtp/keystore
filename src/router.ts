import { match } from "path-to-regexp";

// A very tiny router
export function router(
  req: Request,
  routes: { [path: string]: (req: Request, params: any) => Promise<Response> }
) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  for (const route in routes) {
    const pathMatcher = match(route, {
      decode: decodeURIComponent,
    });
    const matched = pathMatcher(pathname);
    if (!matched) continue;
    return routes[route](req, matched.params);
  }

  return new Response("Not Found", { status: 404 });
}
