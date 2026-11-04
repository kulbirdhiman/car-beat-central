import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import { Readable } from 'node:stream';
import { EventEmitter } from 'node:events';
import { storeProductImages, isOwnedImage, isPublicImageAddress } from '../lib/server/product-images.mjs';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.SUPABASE_STORAGE_BUCKET = 'images';
const own = 'https://example.supabase.co/storage/v1/object/public/images/products/test.jpg';

test('allows public IPv4 and IPv6 while blocking internal addresses', () => {
  assert.equal(isPublicImageAddress('151.101.105.91', 4), true);
  assert.equal(isPublicImageAddress('2a04:4e42:19::347', 6), true);
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '192.168.1.1']) assert.equal(isPublicImageAddress(address, 4), false);
  for (const address of ['::1', '::ffff:127.0.0.1', 'fc00::1']) assert.equal(isPublicImageAddress(address, 6), false);
  assert.equal(isOwnedImage('/images/example.jpg'), true);
  assert.equal(isOwnedImage('//external.test/example.jpg'), false);
});

test('owned URLs bypass downloads and external sources are not mistaken for owned URLs', async () => {
  assert.equal(isOwnedImage(own), true);
  assert.equal(isOwnedImage('https://example.supabase.co.evil.test/storage/v1/object/public/images/x'), false);
  assert.equal(isOwnedImage('https://example.supabase.co/storage/v1/object/public/other/x'), false);
  assert.deepEqual(await storeProductImages({ image: own, images: [own] }), { image: own, images: [own] });
});

test('copies both fields, deduplicates sources, and keeps gallery order', async () => {
  let downloads = 0;
  let uploads = 0;
  const get = mock.method(https, 'get', (_url, _options, callback) => {
    downloads++;
    const response = Readable.from([Buffer.from('test-image')]);
    response.statusCode = 200;
    response.headers = { 'content-type': 'image/jpeg' };
    queueMicrotask(() => callback(response));
    return new EventEmitter();
  });
  const fetch = mock.method(globalThis, 'fetch', async () => {
    uploads++;
    return new Response(JSON.stringify({ Key: 'test' }), { status: 200, headers: { 'content-type': 'application/json' } });
  });
  try {
    const source = 'https://i.ebayimg.com/image.jpg';
    const result = await storeProductImages({ image: source, images: [own, source, source] });
    assert.equal(downloads, 1);
    assert.equal(uploads, 1);
    assert.equal(isOwnedImage(result.image), true);
    assert.deepEqual(result.images, [own, result.image, result.image]);
  } finally { get.mock.restore(); fetch.mock.restore(); }
});

test('rejects unsafe URLs rather than preserving external links', async () => {
  for (const source of ['http://i.ebayimg.com/x', 'https://127.0.0.1/x', 'https://user:password@example.com/x']) {
    await assert.rejects(storeProductImages({ image: source, images: [] }), /HTTPS/);
  }
});

test('failed downloads fail the product, including a later gallery image', async () => {
  const get = mock.method(https, 'get', (_url, _options, callback) => {
    const response = Readable.from([]);
    response.statusCode = 404;
    response.headers = {};
    queueMicrotask(() => callback(response));
    return new EventEmitter();
  });
  try {
    await assert.rejects(storeProductImages({ image: own, images: ['https://cloudfront.net/missing.jpg'] }), /HTTP 404/);
  } finally { get.mock.restore(); }
});

test('rejects oversized downloads and storage errors', async () => {
  let oversized = true;
  const get = mock.method(https, 'get', (_url, _options, callback) => {
    const response = Readable.from([Buffer.alloc(oversized ? 5 * 1024 * 1024 + 1 : 10)]);
    response.statusCode = 200;
    response.headers = { 'content-type': 'image/png' };
    queueMicrotask(() => callback(response));
    return new EventEmitter();
  });
  const fetch = mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ statusCode: '403', error: 'Forbidden', message: 'Denied' }), { status: 403, headers: { 'content-type': 'application/json' } }));
  try {
    const product = { image: 'https://i.ebayimg.com/test.png', images: [] };
    await assert.rejects(storeProductImages(product), /5 MB/);
    oversized = false;
    await assert.rejects(storeProductImages(product), /Image upload failed/);
  } finally { get.mock.restore(); fetch.mock.restore(); }
});
