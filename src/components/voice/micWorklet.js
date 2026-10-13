// Captures the mic in ~85 ms blocks (4096 samples at 48 kHz) and posts them to
// the main thread. Runs inside an AudioWorklet, loaded from a Blob URL so no
// extra file has to be served.
const SOURCE = `
class PcmCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.parts = [];
    this.count = 0;
    this.size = 4096;
  }
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel && channel.length) {
      this.parts.push(new Float32Array(channel));
      this.count += channel.length;
      if (this.count >= this.size) {
        const out = new Float32Array(this.count);
        let offset = 0;
        for (const part of this.parts) { out.set(part, offset); offset += part.length; }
        this.parts = [];
        this.count = 0;
        this.port.postMessage(out, [out.buffer]);
      }
    }
    return true;
  }
}
registerProcessor("pcm-capture", PcmCapture);
`;

export function createMicWorkletUrl() {
  return URL.createObjectURL(new Blob([SOURCE], { type: "application/javascript" }));
}
