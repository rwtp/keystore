import { ethers } from "ethers";
import { CHALLENGE_PREFIX } from "./kv";

export function createChallenge(nonce: string) {
  // WARNING!!! If you change this information, every user will need to re-login.
  return `
Sign this message if you trust this application to access private information, such as names, addresses, and emails. It costs nothing to sign this message.
    
URL: https://keystore.rwtp.org
Nonce: ${nonce}`.trim();
}

// Returns a user if authorized, otherwise returns false.
export async function getUser(
  req: Request
): Promise<false | { address: string }> {
  try {
    // If there's no authorization header, fail
    const authorization = req.headers.get("Authorization");
    if (!authorization) return false;

    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Basic" || !token || token.length === 0) return false;

    // Use Basic Auth atob(address + ":" + signature)
    const basicAuth = btoa(token);
    const [address, signature] = basicAuth.split(":");

    // If there's no nonce (it might have expired), fail.
    const nonce = await KEYSTORE.get(CHALLENGE_PREFIX + address);
    if (!nonce) return false;

    // Recreate the challenge, and compare it against the signature.
    // If they don't match, fail
    const challenge = createChallenge(nonce);
    const signer = ethers.utils.verifyMessage(challenge, signature);
    if (!signer) return false;
    if (signer !== address) return false;

    // Otherwise, return the signer!
    return { address: signer };
  } catch (e) {
    console.error(e);
    return false;
  }
}
