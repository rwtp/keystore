import { Env } from "./env";

/**
 * Cloudflare's KV is eventually consistent, which introduces
 * bugs where the app may overwrite a user's encryption key on accident.
 *
 * This is an implementation of KV using Durable Objects, which has
 * strong consistency guarantees.
 */
export class LongTermStorage {
  state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async put(key: string, value: string): Promise<void> {
    await this.state.storage?.put(key, value);
  }

  async get(key: string): Promise<string | undefined> {
    return this.state.storage?.get<string>(key);
  }

  async fetch(request: Request) {
    let url = new URL(request.url);

    let key = url.pathname.replace("/", "");

    switch (request.method) {
      case "GET":
        const result = await this.get(key);
        if (!result) {
          return new Response("Not found", { status: 404 });
        }
        return new Response(result, { status: 200 });
      case "POST":
        const body = await request.text();
        await this.put(key, body);
        return new Response("Success", { status: 200 });
      default:
        throw new Error(`Unsupported method: ${request.method}`);
    }
  }
}

const STORAGE_NAMESPACE = "storage:";

export async function storagePut(
  req: Request,
  env: Env,
  address: string,
  key: string,
  value: string
) {
  const url = new URL(req.url);

  const id = env.storage.idFromName(STORAGE_NAMESPACE + address);
  const obj = env.storage.get(id);
  const resp = await obj.fetch(url.origin + "/" + key, {
    method: "POST",
    body: value,
  });

  if (resp.status !== 200) {
    throw new Error(`Failed to put key: ${key}`);
  }
  return;
}

export async function storageGet(
  req: Request,
  env: Env,
  address: string,
  key: string
) {
  const url = new URL(req.url);

  const id = env.storage.idFromName(STORAGE_NAMESPACE + address);
  const obj = env.storage.get(id);
  const resp = await obj.fetch(url.origin + "/" + key);

  if (resp.status === 404) {
    return null;
  }

  return resp.text();
}
