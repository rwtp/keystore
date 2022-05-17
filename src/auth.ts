import { ethers } from "ethers";
import { nanoid } from "nanoid";
import { Env } from "./env";

function asChallenge(nonce: string) {
  // WARNING!!! If you change this information, every user will need to re-login.
  return `
Sign this message if you trust this application to access private information, such as names, addresses, and emails. It costs nothing to sign this message.
    
URL: https://keystore.rwtp.org
Nonce: ${nonce}`.trim();
}

const CHALLENGE_PREFIX = "challenge:";

// Creates and saves a challenge for a user
export async function createChallengeForAddress(env: Env, address: string) {
  const nonce = nanoid();

  const challenge = asChallenge(nonce);
  await env.challenges.put(CHALLENGE_PREFIX + address, challenge, {
    expirationTtl: 60 * 60 * 24, // 1 day
  });

  return challenge;
}

// Returns a user if authorized, otherwise returns false.
export async function getUser(
  req: Request,
  env: Env
): Promise<false | { address: string }> {
  try {
    // If there's no authorization header, fail
    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      return false;
    }

    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Basic" || !token || token.length === 0) {
      return false;
    }

    // Use Basic Auth atob(address + ":" + signature)
    const basicAuth = atob(token);
    const [address, signature] = basicAuth.split(":");

    // If there's no nonce (it might have expired), fail.
    const challenge = await env.challenges.get(CHALLENGE_PREFIX + address);
    if (!challenge) {
      return false;
    }

    // Recreate the challenge, and compare it against the signature.
    // If they don't match, fail
    const signer = ethers.utils.verifyMessage(challenge, signature);
    if (!signer) {
      return false;
    }
    if (signer !== address) {
      return false;
    }

    // Otherwise, return the signer!
    return { address: signer };
  } catch (e) {
    console.error("Something went wrong", e);
    return false;
  }
}
