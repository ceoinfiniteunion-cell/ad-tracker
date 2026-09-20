/**
 * Generates favicon.ico (16x16 + 32x32) with a red ∞ on dark background.
 * No external dependencies — uses only Node.js built-ins.
 *
 * Usage: node scripts/gen-favicon.mjs
 */

import { writeFileSync, mkdirSync } from 'fs'
import { deflateSync } from 'zlib'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT  = resolve(__dir, '..')

// ── CRC32 ────────────────────────────────────────────────────────────────────

const CRC_TABLE = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  CRC_TABLE[i] = c
}
function crc32(buf) {
  let c = 0xFFFFFFFF
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

// ── PNG builder ──────────────────────────────────────────────────────────────

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data)
  const lenBuf = Buffer.alloc(4); lenBuf.writeUInt32BE(d.length)
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, d])))
  return Buffer.concat([lenBuf, t, d, crcBuf])
}

function makePNG(size, drawFn) {
  // RGBA pixels
  const rgba = new Uint8Array(size * size * 4)
  drawFn(rgba, size)

  // None (0) filter per row
  const raw = []
  for (let y = 0; y < size; y++) {
    raw.push(0)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      raw.push(rgba[i], rgba[i+1], rgba[i+2], rgba[i+3])
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6   // 8-bit RGBA

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.from(raw))),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── ∞ renderer ───────────────────────────────────────────────────────────────

function drawIcon(rgba, size) {
  const BG = 10   // #0a
  const RR = 0xEF, RG = 0x44, RB = 0x44  // #ef4444

  // Background
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = BG; rgba[i+1] = BG; rgba[i+2] = BG; rgba[i+3] = 255
  }

  // ∞ = two circles side by side, drawn as anti-aliased rings
  const cx = size / 2, cy = size / 2
  const r  = size * 0.24          // lobe radius
  const dx = size * 0.22          // center offset per lobe
  const thick = Math.max(1.2, size * 0.075)  // ring thickness (px)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Distance to each lobe centre
      const dL = Math.hypot(x + 0.5 - (cx - dx), y + 0.5 - cy)
      const dR = Math.hypot(x + 0.5 - (cx + dx), y + 0.5 - cy)

      // Distance to ring edge (0 = on ring, positive = outside ring boundary)
      const rL = Math.abs(dL - r) - thick * 0.5
      const rR = Math.abs(dR - r) - thick * 0.5

      // Take the minimum signed distance (negative = inside ring stroke)
      const sd = Math.min(rL, rR)

      if (sd < 0.6) {
        // Smooth alpha based on signed distance
        const alpha = Math.min(1, Math.max(0, (0.6 - sd) / 0.6))
        const idx = (y * size + x) * 4
        rgba[idx]   = Math.round(BG + alpha * (RR - BG))
        rgba[idx+1] = Math.round(BG + alpha * (RG - BG))
        rgba[idx+2] = Math.round(BG + alpha * (RB - BG))
        rgba[idx+3] = 255
      }
    }
  }
}

// ── ICO builder ──────────────────────────────────────────────────────────────

function makeICO(entries) {
  // entries: Array<[size, pngBuffer]>
  const n = entries.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)  // reserved
  header.writeUInt16LE(1, 2)  // type: ICO
  header.writeUInt16LE(n, 4)  // count

  const dir = Buffer.alloc(16 * n)
  let offset = 6 + 16 * n

  entries.forEach(([sz, png], i) => {
    const e = dir.slice(i * 16)
    e[0] = sz >= 256 ? 0 : sz   // width  (0 = 256)
    e[1] = sz >= 256 ? 0 : sz   // height
    e[2] = 0                     // color count
    e[3] = 0                     // reserved
    e.writeUInt16LE(1, 4)        // planes
    e.writeUInt16LE(32, 6)       // bpp
    e.writeUInt32LE(png.length, 8)
    e.writeUInt32LE(offset, 12)
    offset += png.length
  })

  return Buffer.concat([header, dir, ...entries.map(([, png]) => png)])
}

// ── Generate ──────────────────────────────────────────────────────────────────

const png32 = makePNG(32, drawIcon)
const png16 = makePNG(16, drawIcon)
const ico   = makeICO([[32, png32], [16, png16]])

mkdirSync(resolve(ROOT, 'public'), { recursive: true })
mkdirSync(resolve(ROOT, 'src/app'), { recursive: true })

writeFileSync(resolve(ROOT, 'public/favicon.ico'), ico)
writeFileSync(resolve(ROOT, 'src/app/favicon.ico'), ico)

console.log(`✓ favicon.ico  ${ico.length} bytes  (16x16 + 32x32, PNG-in-ICO)`)
