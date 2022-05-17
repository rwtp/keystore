import { nanoid } from "nanoid";
import { createChallenge, getUser } from "./auth";
import { CHALLENGE_PREFIX, KEYSTORE_PREFIX } from "./kv";
import { MAX_KEY_LENGTH, MAX_VALUE_LENGTH } from "./limits";
import { router } from "./router";

// A health check
async function index(req: Request, params: any): Promise<Response> {
  return new Response(
    `This a project run by rwtp.org.
See the code at https://github.com/rwtp/keystore

Please consider being a better ancestor than your ancestors.`
  );
}

// Check if you're logged in
async function whoami(
  req: Request,
  env: { KEYSTORE: KVNamespace },
  params: any
): Promise<Response> {
  const user = await getUser(req);

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  return new Response(user.address);
}

// Get a new challenge
async function challenge(
  req: Request,
  env: { KEYSTORE: KVNamespace },
  params: { address: string }
): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const nonce = nanoid();
  const challenge = createChallenge(nonce);

  await env.KEYSTORE.put(CHALLENGE_PREFIX + params.address, nonce, {
    expirationTtl: 1000 * 60 * 60 * 24, // 1 day expiration date
  });

  return new Response(challenge);
}

// Write to a key
async function put(
  req: Request,
  env: { KEYSTORE: KVNamespace },
  params: { key: string }
): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const user = await getUser(req);
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

  await KEYSTORE.put(KEYSTORE_PREFIX + user.address + ":" + key, body);

  return new Response("Success", { status: 200 });
}

// Read from a key
async function get(
  req: Request,
  env: { KEYSTORE: KVNamespace },
  params: { key: string }
): Promise<Response> {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const user = await getUser(req);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const value = await KEYSTORE.get(
    KEYSTORE_PREFIX + user.address + ":" + params.key
  );

  return new Response(value, { status: 200 });
}

/**
 * A Keystore implemented as a cloudflare worker.
 */
export default {
  async fetch(req: Request, env: { KEYSTORE: KVNamespace }): Promise<Response> {
    return router(req, env, {
      "/": index,
      "/whoami": whoami,
      "/challenge/:address": challenge,
      "/put/:key": put,
      "/get/:key": get,
    });
  },
};
