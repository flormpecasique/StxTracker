/**
 * api/hiro-proxy.js
 *
 * Vercel serverless function that proxies Stacks API calls.
 * Handles two operations:
 *
 *   1. BNS name resolution (?name=flor.btc)
 *      Calls the on-chain BNS contract — Hiro deprecated REST BNS endpoints.
 *
 *   2. STX balance lookup (?balance=SP...)
 *      Proxies to /extended/v1/address/{addr}/balances so the browser
 *      never has to carry the Hiro API key.
 *
 * WHY A PROXY?
 * ------------
 * The HIRO_API_KEY must stay server-side. If we called Hiro from the
 * browser, the key would be visible in DevTools.
 *
 * ENV VAR (Vercel → Settings → Environment Variables):
 *   HIRO_API_KEY = your key from platform.hiro.so
 */

export default async function handler(req, res) {
  const { name, balance } = req.query;

  // Branch on what the client asked for
  if (name) {
    return await resolveBns(name, res);
  }
  if (balance) {
    return await fetchBalance(balance, res);
  }

  return res.status(400).json({
    error: "Missing parameter. Expected 'name' (for BNS) or 'balance' (for address balance).",
  });
}

// ─── Hiro fetch helper ──────────────────────────────────────────────────────

function hiroFetch(url, init = {}) {
  const apiKey = process.env.HIRO_API_KEY;
  const headers = {
    'Accept': 'application/json',
    ...(init.headers || {}),
  };
  // Hiro expects the x-api-key header (NOT Authorization: Bearer).
  if (apiKey) headers['x-api-key'] = apiKey;
  return fetch(url, { ...init, headers });
}

// ─── Balance lookup ─────────────────────────────────────────────────────────

async function fetchBalance(address, res) {
  const url = `https://api.hiro.so/extended/v1/address/${encodeURIComponent(address)}/balances`;
  try {
    const response = await hiroFetch(url);
    if (!response.ok) {
      return res.status(response.status).json({
        error: `Hiro API returned ${response.status}`,
      });
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Balance fetch error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// ─── BNS resolution via on-chain Clarity contract ───────────────────────────
//
// Hiro deprecated /v1/names/ in late 2026. We now call the BNS contract
// directly through /v2/contracts/call-read/ and decode the result.

const BNS_CONTRACT_ADDR = 'SP000000000000000000002Q6VF78';
const BNS_CONTRACT_NAME = 'bns';
const BNS_FUNCTION      = 'name-resolve';
const DUMMY_CALLER      = 'SP000000000000000000002Q6VF78';

async function resolveBns(name, res) {
  const lower = String(name).toLowerCase().trim();
  const parts = lower.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return res.status(400).json({ error: `Invalid BNS name format: "${name}"` });
  }
  const [bnsName, bnsNamespace] = parts;

  const url = `https://api.hiro.so/v2/contracts/call-read/${BNS_CONTRACT_ADDR}/${BNS_CONTRACT_NAME}/${BNS_FUNCTION}`;
  const body = {
    sender: DUMMY_CALLER,
    arguments: [
      stringToClarityBuffHex(bnsNamespace),
      stringToClarityBuffHex(bnsName),
    ],
  };

  try {
    const response = await hiroFetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `BNS resolution failed: ${response.status}`,
      });
    }

    const data = await response.json();
    if (!data.okay || !data.result) {
      return res.status(404).json({ error: `BNS name "${name}" not registered` });
    }

    const resultHex = typeof data.result === 'string'
      ? (data.result.startsWith('0x') ? data.result.slice(2) : data.result)
      : '';

    const address = parseClarityPrincipalFromResponse(resultHex);
    if (!address) {
      return res.status(404).json({ error: `BNS name "${name}" has no associated address` });
    }

    // Match the response shape the existing client code expects: { address: "SP..." }
    return res.status(200).json({ address });
  } catch (error) {
    console.error('BNS resolution error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// ─── Clarity encoding helpers ───────────────────────────────────────────────

function stringToClarityBuffHex(s) {
  const bytes = Buffer.from(s, 'utf8');
  const len   = bytes.length;
  const lenHex = len.toString(16).padStart(8, '0');
  const dataHex = bytes.toString('hex');
  return '0x02' + lenHex + dataHex;
}

function hexToBytes(hex) {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  return Buffer.from(clean, 'hex');
}

// ─── C32 encoding (Stacks address format) ───────────────────────────────────

const C32_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function sha256(bytes) {
  const { createHash } = require('crypto');
  return createHash('sha256').update(bytes).digest();
}

function c32checksum(versionByte, hash160) {
  const data = Buffer.concat([Buffer.from([versionByte]), hash160]);
  return sha256(sha256(data)).slice(0, 4);
}

function c32encodeBytes(bytes) {
  let result = '';
  let carry = 0;
  let carryBits = 0;
  for (let i = bytes.length - 1; i >= 0; i--) {
    const current = (bytes[i] << carryBits) | carry;
    result = C32_ALPHABET[current & 0x1f] + result;
    carry = current >> 5;
    carryBits = carryBits + 8 - 5;
    if (carryBits >= 5) {
      result = C32_ALPHABET[carry & 0x1f] + result;
      carry = carry >> 5;
      carryBits -= 5;
    }
  }
  if (carryBits > 0) {
    result = C32_ALPHABET[carry & 0x1f] + result;
  }
  let numLeadingZeroBytes = 0;
  for (const b of bytes) {
    if (b === 0) numLeadingZeroBytes++;
    else break;
  }
  result = result.replace(/^0+/, '');
  for (let i = 0; i < numLeadingZeroBytes; i++) result = '0' + result;
  return result;
}

function c32address(versionByte, hash160) {
  const checksum = c32checksum(versionByte, hash160);
  const combined = Buffer.concat([hash160, checksum]);
  return 'S' + C32_ALPHABET[versionByte] + c32encodeBytes(combined);
}

function parseClarityPrincipalFromResponse(hex) {
  const bytes = hexToBytes(hex);
  for (let i = 0; i < bytes.length - 21; i++) {
    if (bytes[i] === 0x05) {
      const version = bytes[i + 1];
      if (version === 22 || version === 20 || version === 26 || version === 21) {
        const hash160 = bytes.slice(i + 2, i + 22);
        if (hash160.length === 20) {
          return c32address(version, hash160);
        }
      }
    }
  }
  return null;
}
