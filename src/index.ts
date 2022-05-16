import { router } from "./router";

// A health check
async function index(req: Request, params: any): Promise<Response> {
  return new Response(
    `This a project run by rwtp.org.
See the code at https://github.com/rwtp/keystore

Please consider being a better ancestor than your ancestors.`
  );
}

// Get a new challenge
async function challenge(req: Request, params: any): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  return new Response("Challenge", { status: 200 });
}

// Write to a key
async function put(req: Request, params: any): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  return new Response("Put", { status: 200 });
}

// Read from a key
async function get(req: Request, params: any): Promise<Response> {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  return new Response("Get", { status: 200 });
}

/**
 * A Keystore implemented as a cloudflare worker.
 */
export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    router(req, {
      "/": index,
      "/challenge/:challenge": challenge,
      "/put/:key": put,
      "/get/:key": get,
    });

    return new Response("Hello World!");
  },
};
