import { createHash } from 'node:crypto';
import { lookup } from 'node:dns';
import https from 'node:https';
import { BlockList, isIP } from 'node:net';
import { createClient } from '@supabase/supabase-js';

const MAX_BYTES = 5 * 1024 * 1024;
const types = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' };
const blocked = new BlockList();
for (const [address, prefix] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.168.0.0', 16], ['192.0.0.0', 24], ['198.18.0.0', 15], ['224.0.0.0', 3]]) blocked.addSubnet(address, prefix, 'ipv4');
blocked.addSubnet('::', 128, 'ipv6');
blocked.addSubnet('::1', 128, 'ipv6');
blocked.addSubnet('fc00::', 7, 'ipv6');
blocked.addSubnet('fe80::', 10, 'ipv6');
blocked.addSubnet('ff00::', 8, 'ipv6');

export function isPublicImageAddress(address, family) {
  return !(family === 6 && address.toLowerCase().startsWith('::ffff:')) && !blocked.check(address, family === 6 ? 'ipv6' : 'ipv4');
}

function publicLookup(hostname, options, callback) {
  lookup(hostname, { all: true }, (error, addresses) => {
    if (error) return callback(error);
    if (!addresses.length || addresses.some(({ address, family }) => !isPublicImageAddress(address, family))) return callback(new Error('Image URL must resolve to a public address.'));
    callback(null, options.all ? addresses : addresses[0].address, addresses[0].family);
  });
}

async function download(source, redirects = 0) {
  const url = new URL(source);
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || isIP(url.hostname.replace(/^\[|\]$/g, ''))) throw new Error('Image URLs must use HTTPS with a public hostname.');
  return new Promise((resolve, reject) => {
    const request = https.get(url, { lookup: publicLookup, signal: AbortSignal.timeout(20000), headers: { Accept: 'image/*' } }, (response) => {
      const status = response.statusCode ?? 0;
      if ([301, 302, 303, 307, 308].includes(status) && response.headers.location) {
        response.resume();
        if (redirects >= 4) return reject(new Error('Too many image redirects.'));
        resolve(download(new URL(response.headers.location, url).href, redirects + 1));
        return;
      }
      const type = response.headers['content-type']?.split(';')[0].trim().toLowerCase();
      if (status !== 200 || !types[type]) {
        response.resume();
        return reject(new Error(`Image download failed (HTTP ${status}, ${type || 'unknown type'}).`));
      }
      let size = 0;
      const chunks = [];
      response.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_BYTES) response.destroy(new Error('Images must be 5 MB or smaller.'));
        else chunks.push(chunk);
      });
      response.on('error', reject);
      response.on('end', () => size ? resolve({ bytes: Buffer.concat(chunks), type }) : reject(new Error('Image is empty.')));
    });
    request.on('error', reject);
  });
}

export function isOwnedImage(source) {
  if (!source) return true;
  // Bundled site assets already belong to us; protocol-relative URLs do not.
  if (source.startsWith('/') && !source.startsWith('//') && !source.includes('\\')) return true;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  try {
    const url = new URL(source);
    return url.origin === new URL(base).origin && url.pathname.startsWith(`/storage/v1/object/public/${process.env.SUPABASE_STORAGE_BUCKET || 'images'}/`);
  } catch { return false; }
}

/** Copies every unique source once per product; deterministic paths also deduplicate reruns. */
export async function storeProductImages(product) {
  const replacements = new Map();
  const sources = [...new Set([product.image, ...product.images].filter(Boolean))];
  async function copy(source) {
    if (isOwnedImage(source)) { replacements.set(source, source); return; }
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!base || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to copy product images.');
    const { bytes, type } = await download(source);
    const path = `products/imported/${createHash('sha256').update(bytes).digest('hex')}.${types[type]}`;
    const storage = createClient(base, key, { auth: { persistSession: false, autoRefreshToken: false } }).storage.from(process.env.SUPABASE_STORAGE_BUCKET || 'images');
    const { error } = await storage.upload(path, bytes, { contentType: type, cacheControl: '31536000', upsert: false });
    if (error && String(error.statusCode) !== '409') throw new Error(`Image upload failed: ${error.message}`);
    replacements.set(source, storage.getPublicUrl(path).data.publicUrl);
  }
  // Bound concurrency so large galleries finish within the route duration without flooding hosts.
  for (let index = 0; index < sources.length; index += 3) {
    const results = await Promise.allSettled(sources.slice(index, index + 3).map(copy));
    const failed = results.find((result) => result.status === 'rejected');
    if (failed) throw failed.reason;
  }
  return { image: replacements.get(product.image) ?? '', images: product.images.map((source) => replacements.get(source)) };
}
