import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export function encodeCardData(data) {
  const json = JSON.stringify(data);
  return compressToEncodedURIComponent(json);
}

export function decodeCardData(encoded) {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getShareUrl(cardData) {
  const encoded = encodeCardData(cardData);
  const base = window.location.origin + window.location.pathname;
  return `${base}#/card/${encoded}`;
}

export function getCardFromUrl() {
  const hash = window.location.hash;
  const match = hash.match(/#\/card\/(.+)/);
  if (!match) return null;
  return decodeCardData(match[1]);
}
