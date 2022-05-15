/**
 * A Keystore implemented as a cloudflare worker.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    return new Response("Hello World!");
  },
};
