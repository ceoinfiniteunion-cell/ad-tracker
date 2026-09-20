import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dir, '..')
const SVG_PATH = resolve(__dir, 'favicon.svg')
const PUBLIC = resolve(ROOT, 'public')

const svg = readFileSync(SVG_PATH)

const png32 = await sharp(svg).resize(32, 32).png().toBuffer()
writeFileSync(resolve(PUBLIC, 'favicon-32x32.png'), png32)
console.log('✓ public/favicon-32x32.png')

const png16 = await sharp(svg).resize(16, 16).png().toBuffer()
writeFileSync(resolve(PUBLIC, 'favicon-16x16.png'), png16)
console.log('✓ public/favicon-16x16.png')

function makeICO(entries) {
  const n = entries.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(n, 4)

  const dir = Buffer.alloc(16 * n)
  let offset = 6 + 16 * n
  entries.forEach(([sz, png], i) => {
    const e = dir.subarray(i * 16)
    e[0] = sz >= 256 ? 0 : sz
    e[1] = sz >= 256 ? 0 : sz
    e[2] = 0
    e[3] = 0
    e.writeUInt16LE(1, 4)
    e.writeUInt16LE(32, 6)
    e.writeUInt32LE(png.length, 8)
    e.writeUInt32LE(offset, 12)
    offset += png.length
  })

  return Buffer.concat([header, dir, ...entries.map(([, png]) => png)])
}

const ico = makeICO([[32, png32], [16, png16]])
writeFileSync(resolve(PUBLIC, 'favicon.ico'), ico)
console.log(`✓ public/favicon.ico  (${ico.length} bytes, 16×16 + 32×32)`)
