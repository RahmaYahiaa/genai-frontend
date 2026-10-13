// Audio format helpers for the LernaVoice protocol.
// Mic: PCM16, 16 kHz, mono, little-endian (binary frames).
// Speaker: PCM16, 24 kHz, mono, little-endian (base64 in assistant.audio.chunk).

export const INPUT_RATE = 16000;
export const OUTPUT_RATE = 24000;

/** Float32 mic frame at any capture rate -> Int16 PCM at 16 kHz (linear resample). */
export function floatToPcm16(input, inRate, outRate = INPUT_RATE) {
  const ratio = inRate / outRate;
  const outLength = Math.floor(input.length / ratio);
  const out = new Int16Array(outLength);
  for (let i = 0; i < outLength; i += 1) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const frac = pos - i0;
    const sample = Math.max(-1, Math.min(1, input[i0] * (1 - frac) + input[i1] * frac));
    out[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return out;
}

export function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Assistant audio -> Float32 samples at 24 kHz. The spec says raw PCM16, but
 * some examples carry a WAV (RIFF) header; if one is present, skip to the
 * "data" chunk so the decoder works for both.
 */
export function pcm16ToFloat32(bytes) {
  let offset = 0;
  const isRiff = bytes.length > 44 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  if (isRiff) {
    for (let i = 12; i < bytes.length - 8; i += 1) {
      if (bytes[i] === 0x64 && bytes[i + 1] === 0x61 && bytes[i + 2] === 0x74 && bytes[i + 3] === 0x61) {
        offset = i + 8;
        break;
      }
    }
  }
  const count = Math.floor((bytes.length - offset) / 2);
  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, count * 2);
  const out = new Float32Array(count);
  for (let i = 0; i < count; i += 1) out[i] = view.getInt16(i * 2, true) / 0x8000;
  return out;
}
