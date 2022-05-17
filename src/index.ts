import { createChallengeForAddress, getUser } from "./auth";
import { Env } from "./env";
import { MAX_KEY_LENGTH, MAX_VALUE_LENGTH } from "./limits";
import { router } from "./router";
import { storageGet, storagePut } from "./storage";
export { LongTermStorage } from "./storage";

// A health check
async function index(req: Request, params: any): Promise<Response> {
  return new Response(
    `This a project run by rwtp.org.
See the code at https://github.com/rwtp/keystore

Please consider being a better ancestor than your ancestors.`
  );
}

// Check if you're logged in
async function whoami(req: Request, env: Env, params: any): Promise<Response> {
  const user = await getUser(req, env);

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  return new Response(user.address);
}

// Get a new challenge
async function challenge(
  req: Request,
  env: Env,
  params: { address: string }
): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const challenge = await createChallengeForAddress(env, params.address);

  return new Response(challenge);
}

// Write to a key
async function put(
  req: Request,
  env: Env,
  params: { key: string }
): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const user = await getUser(req, env);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Limit the size of the key
  const key = params.key;
  if (key.length > MAX_KEY_LENGTH) {
    return new Response("Key too long", { status: 413 });
  }

  // Limit the size of the value
  const body = await req.text();
  if (body.length > MAX_VALUE_LENGTH) {
    return new Response("Value too long", { status: 413 });
  }

  await storagePut(req, env, user.address, key, body);

  return new Response("Success", { status: 200 });
}

// Read from a key
async function get(
  req: Request,
  env: Env,
  params: { key: string }
): Promise<Response> {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }
  const user = await getUser(req, env);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await storageGet(req, env, user.address, params.key);

  return new Response(result, { status: 200 });
}

/**
 * A Keystore implemented as a cloudflare worker.
 */
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    return router(req, env, {
      "/": index,
      "/whoami": whoami,
      "/challenge/:address": challenge,
      "/put/:key": put,
      "/get/:key": get,
    });
  },
};
