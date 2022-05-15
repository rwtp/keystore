# Keystore

Keystore is a very simple key-value store that allows reads and writes if given a signed, [EIP-191](https://eips.ethereum.org/EIPS/eip-191)-compatible message from an Ethereum wallet.

## Authorizing

You can authorize the key-value store by having a user sign a message with their Ethereum wallet. To get the message, the client must first request a challenge with the address of the user.

```js
// Request a challenge for a user
const result = fetch("/challenge/0xc05c2aaDfAdb5CdD8EE25ec67832B524003B2E37", {
  method: "POST",
});
const { challenge } = await result.json();
```

The challenge, if printed, is a human-readable string asking if the user is comfortable allowing the application to store private information. It must include a random "nonce" string unique to that challenge. For example:

Sign this message if you trust this application to access private
information, such as the names, addresses, and emails of your customers.

```
URL: https://keystore.rwtp.org
Nonce: someRandomString
```

Then, a client may sign the challenge, and use it as the password in Basic Auth, where the username is the address of the user.

```js
base64(address + ":" + signedChallenge); // pseudocode
```

You can use ethers or wagmi to sign the challenge.

```
import { useSigner } from 'wagmi';

// Sign the message
const signer = useSigner();
const signedChallenge = signer.data.signMessage(challenge);

// Create a Basic auth toekn
const token = new Buffer(
  await signer.getAddress() + ":" + signedChallenge
).toString('base64');
```

Writing to the key-value store

```js
const result = await fetch("/put/someKey", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Basic " + token,
  },
  body: "myArbitraryData",
});

const { data } = await result.json();
```

Read from the key-value store

```js
const result = await fetch("/get/someKey", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Basic " + token,
  },
});

const { data } = await result.json();
console.log(data); // "myArbitraryData"
```

## CORS

This must support CORS from anywhere. We should not assume that rwtp.org is the only frontend that will use this.
