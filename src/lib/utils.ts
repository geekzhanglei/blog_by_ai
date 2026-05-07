export function formatTime(timestamp: number | string, format = 'yyyy年MM月dd日'): string {
  const time = new Date(Number(timestamp));
  const date: Record<string, number> = {
    'M+': time.getMonth() + 1,
    'd+': time.getDate(),
    'h+': time.getHours(),
    'm+': time.getMinutes(),
    's+': time.getSeconds(),
    'q+': Math.floor((time.getMonth() + 3) / 3),
    'S+': time.getMilliseconds()
  };

  let result = format;
  if (/(y+)/i.test(result)) {
    result = result.replace(RegExp.$1, `${time.getFullYear()}`.slice(4 - RegExp.$1.length));
  }

  for (const key in date) {
    if (new RegExp(`(${key})`).test(result)) {
      const value = `${date[key]}`;
      result = result.replace(RegExp.$1, RegExp.$1.length === 1 ? value : `00${value}`.slice(value.length));
    }
  }

  return result;
}

export function formatUnixTime(unixTime?: number | string, format = 'yyyy年MM月dd日'): string {
  if (!unixTime) return '';
  return formatTime(Number(unixTime) * 1000, format);
}

export function normalizeWebsite(website: string): string {
  if (!website) return '';
  if (/^https?:\/\//.test(website)) return website;
  return `http://${website}`;
}

type ImageSize = {
  width: number;
  height: number;
};

const imageSizeCache = new Map<string, Promise<ImageSize | null> | ImageSize | null>();

function readUint16BE(bytes: Uint8Array, offset: number) {
  return (bytes[offset] << 8) + bytes[offset + 1];
}

function readUint16LE(bytes: Uint8Array, offset: number) {
  return bytes[offset] + (bytes[offset + 1] << 8);
}

function readUint24LE(bytes: Uint8Array, offset: number) {
  return bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16);
}

function readUint32BE(bytes: Uint8Array, offset: number) {
  return (
    (bytes[offset] << 24) +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  ) >>> 0;
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function parsePngSize(bytes: Uint8Array): ImageSize | null {
  if (bytes.length < 24) return null;
  if (bytes[0] !== 0x89 || ascii(bytes, 1, 3) !== 'PNG') return null;
  const width = readUint32BE(bytes, 16);
  const height = readUint32BE(bytes, 20);
  return width > 0 && height > 0 ? { width, height } : null;
}

function parseGifSize(bytes: Uint8Array): ImageSize | null {
  if (bytes.length < 10 || !ascii(bytes, 0, 3).startsWith('GIF')) return null;
  const width = readUint16LE(bytes, 6);
  const height = readUint16LE(bytes, 8);
  return width > 0 && height > 0 ? { width, height } : null;
}

function parseJpegSize(bytes: Uint8Array): ImageSize | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset + 9 < bytes.length) {
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 2 > bytes.length) break;
    const length = readUint16BE(bytes, offset);
    if (length < 2 || offset + length > bytes.length) break;
    if (sofMarkers.has(marker)) {
      const height = readUint16BE(bytes, offset + 3);
      const width = readUint16BE(bytes, offset + 5);
      return width > 0 && height > 0 ? { width, height } : null;
    }
    offset += length;
  }
  return null;
}

function parseWebpSize(bytes: Uint8Array): ImageSize | null {
  if (bytes.length < 30 || ascii(bytes, 0, 4) !== 'RIFF' || ascii(bytes, 8, 4) !== 'WEBP') return null;
  const chunk = ascii(bytes, 12, 4);
  if (chunk === 'VP8X') {
    const width = readUint24LE(bytes, 24) + 1;
    const height = readUint24LE(bytes, 27) + 1;
    return width > 0 && height > 0 ? { width, height } : null;
  }
  if (chunk === 'VP8 ' && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    const width = readUint16LE(bytes, 26) & 0x3fff;
    const height = readUint16LE(bytes, 28) & 0x3fff;
    return width > 0 && height > 0 ? { width, height } : null;
  }
  if (chunk === 'VP8L' && bytes.length >= 25 && bytes[20] === 0x2f) {
    const width = 1 + (((bytes[22] & 0x3f) << 8) | bytes[21]);
    const height = 1 + (((bytes[24] & 0x0f) << 10) | (bytes[23] << 2) | ((bytes[22] & 0xc0) >> 6));
    return width > 0 && height > 0 ? { width, height } : null;
  }
  return null;
}

function parseImageSize(bytes: Uint8Array): ImageSize | null {
  return parsePngSize(bytes) || parseGifSize(bytes) || parseJpegSize(bytes) || parseWebpSize(bytes);
}

async function fetchImageSize(src: string): Promise<ImageSize | null> {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const cacheKey = url.toString();
  const cached = imageSizeCache.get(cacheKey);
  if (cached instanceof Promise) return cached;
  if (cached !== undefined) return cached;

  const promise = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(cacheKey, {
        headers: { Range: 'bytes=0-65535' },
        signal: controller.signal
      });
      if (!response.ok) return null;
      const bytes = new Uint8Array(await response.arrayBuffer());
      return parseImageSize(bytes);
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  })();

  imageSizeCache.set(cacheKey, promise);
  const size = await promise;
  imageSizeCache.set(cacheKey, size);
  return size;
}

function hasAttribute(tag: string, name: string) {
  return new RegExp(`\\s${name}(?:\\s*=|\\s|>|/)`, 'i').test(tag);
}

function getAttribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match?.[1] || match?.[2] || match?.[3] || '';
}

function addAttribute(tag: string, name: string, value: string | number) {
  if (hasAttribute(tag, name)) return tag;
  return tag.replace(/\s*\/?>$/, (ending) => ` ${name}="${value}"${ending}`);
}

function removeAttribute(tag: string, name: string) {
  return tag.replace(new RegExp(`\\s${name}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+)`, 'gi'), '');
}

async function stabilizeImageTag(tag: string) {
  let next = tag;
  const src = getAttribute(tag, 'src');
  const size = src && (!hasAttribute(tag, 'width') || !hasAttribute(tag, 'height'))
    ? await fetchImageSize(src)
    : null;

  if (size) {
    next = addAttribute(next, 'width', size.width);
    next = addAttribute(next, 'height', size.height);
  }
  next = addAttribute(next, 'loading', 'lazy');
  next = addAttribute(next, 'decoding', 'async');
  return next;
}

function normalizeRichTextHeadings(html: string) {
  return html.replace(/<h([1-6])\b[^>]*>/gi, (tag) => removeAttribute(tag, 'style'));
}

export async function addImageDimensions(html: string): Promise<string> {
  if (!html) return html;
  let result = normalizeRichTextHeadings(html);
  if (!/<img\b/i.test(result)) return result;
  const imgTags = Array.from(result.matchAll(/<img\b[^>]*>/gi), (match) => match[0]);
  const replacements = await Promise.all(imgTags.map(async (tag) => [tag, await stabilizeImageTag(tag)] as const));
  for (const [tag, replacement] of replacements) {
    result = result.replace(tag, replacement);
  }
  return result;
}
