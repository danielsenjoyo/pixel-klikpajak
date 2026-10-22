/**
 * Minimal .xlsx read/write for the SPT import templates — DJP ships its Coretax import
 * templates as workbooks (DATA / Petunjuk Pengisian / Ref sheets), so a CSV-only import
 * would make every preparer re-save DJP's file first.
 *
 * No dependency: an .xlsx is a zip of XML parts. Reading inflates entries with the
 * browser's DecompressionStream; writing stores them uncompressed (still a valid zip,
 * and template files are tiny). Only what the templates need is supported — strings,
 * numbers, booleans, a bold style, text-formatted columns, column widths. Formulas are
 * read by their cached value; dates arrive as Excel serial numbers (see `excelSerialToDmy`).
 */

export type Cell = string | number | boolean | null
export interface Sheet { name: string, rows: Cell[][] }

/** What `writeXlsx` takes per sheet. */
export interface SheetSpec extends Sheet {
  /** Width (characters) and text format per column; text keeps leading zeros (NPWP, 0401). */
  cols?: { width?: number, text?: boolean }[]
  /** 0-based row indexes rendered bold (headers). */
  boldRows?: number[]
}

// ── Zip ──────────────────────────────────────────────────────────────────────
const enc = new TextEncoder()
const dec = new TextDecoder()

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw' as CompressionFormat))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function unzip(buf: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const bytes = new Uint8Array(buf)
  const view = new DataView(buf)
  // End of central directory: scan back over the (≤64 KB) archive comment.
  let eocd = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65_535); i--) {
    if (view.getUint32(i, true) === 0x06054B50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('not a zip')
  const count = view.getUint16(eocd + 10, true)
  let p = view.getUint32(eocd + 16, true)
  const out = new Map<string, Uint8Array>()
  for (let n = 0; n < count; n++) {
    if (view.getUint32(p, true) !== 0x02014B50) throw new Error('bad central directory')
    const method = view.getUint16(p + 10, true)
    const size = view.getUint32(p + 20, true)
    const nameLen = view.getUint16(p + 28, true)
    const extraLen = view.getUint16(p + 30, true)
    const commentLen = view.getUint16(p + 32, true)
    const local = view.getUint32(p + 42, true)
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen))
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true)
    const raw = bytes.subarray(start, start + size)
    if (method === 0) out.set(name, raw)
    else if (method === 8) out.set(name, await inflateRaw(raw))
    p += 46 + nameLen + extraLen + commentLen
  }
  return out
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[i] = c >>> 0
  }
  return t
})()
function crc32(data: Uint8Array) {
  let c = 0xFFFFFFFF
  for (const b of data) c = CRC_TABLE[(c ^ b) & 0xFF]! ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

/** Stored (method 0) zip — valid for Excel, and template files are a few KB. */
function zip(files: { name: string, data: Uint8Array }[]): Blob {
  const parts: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0
  for (const f of files) {
    const name = enc.encode(f.name)
    const crc = crc32(f.data)
    const local = new Uint8Array(30 + name.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034B50, true)
    lv.setUint16(4, 20, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, f.data.length, true)
    lv.setUint32(22, f.data.length, true)
    lv.setUint16(26, name.length, true)
    local.set(name, 30)

    const cd = new Uint8Array(46 + name.length)
    const cv = new DataView(cd.buffer)
    cv.setUint32(0, 0x02014B50, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, f.data.length, true)
    cv.setUint32(24, f.data.length, true)
    cv.setUint16(28, name.length, true)
    cv.setUint32(42, offset, true)
    cd.set(name, 46)

    parts.push(local, f.data)
    central.push(cd)
    offset += local.length + f.data.length
  }
  const cdSize = central.reduce((a, c) => a + c.length, 0)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054B50, true)
  ev.setUint16(8, files.length, true)
  ev.setUint16(10, files.length, true)
  ev.setUint32(12, cdSize, true)
  ev.setUint32(16, offset, true)
  return new Blob([...parts, ...central, end] as BlobPart[], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

// ── Read ─────────────────────────────────────────────────────────────────────
const xml = (bytes: Uint8Array | undefined) => (bytes ? new DOMParser().parseFromString(dec.decode(bytes), 'application/xml') : null)
/** Namespace-agnostic: some writers prefix SpreadsheetML elements (`x:c`). */
const tags = (el: Document | Element, name: string) => Array.from(el.getElementsByTagNameNS('*', name))
const textOf = (el: Element) => tags(el, 't').map(t => t.textContent ?? '').join('')

/** "AB12" → 27 (0-based column). */
function colIndex(ref: string) {
  let n = 0
  for (const ch of ref.replace(/\d+$/, '')) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

export async function readXlsx(buf: ArrayBuffer): Promise<Sheet[]> {
  const files = await unzip(buf)
  const shared = (() => {
    const doc = xml(files.get('xl/sharedStrings.xml'))
    return doc ? tags(doc, 'si').map(textOf) : []
  })()
  const wb = xml(files.get('xl/workbook.xml'))
  const rels = xml(files.get('xl/_rels/workbook.xml.rels'))
  if (!wb || !rels) throw new Error('not a workbook')
  const target = new Map(tags(rels, 'Relationship').map(r => [r.getAttribute('Id'), r.getAttribute('Target') ?? '']))

  return tags(wb, 'sheet').map((s) => {
    const rid = s.getAttribute('r:id') ?? s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id')
    const t = target.get(rid) ?? ''
    const path = t.startsWith('/') ? t.slice(1) : `xl/${t}`
    const doc = xml(files.get(path))
    const rows: Cell[][] = []
    if (doc) {
      for (const r of tags(doc, 'row')) {
        const ri = Number(r.getAttribute('r')) - 1
        const row: Cell[] = []
        for (const c of tags(r, 'c')) {
          const type = c.getAttribute('t')
          const v = tags(c, 'v')[0]?.textContent ?? null
          let value: Cell = null
          if (type === 's') value = v === null ? null : shared[Number(v)] ?? null
          else if (type === 'inlineStr') value = textOf(c)
          else if (type === 'str') value = v
          else if (type === 'b') value = v === '1'
          else if (type === 'e') value = null
          else if (v !== null && v !== '') value = Number(v)
          row[colIndex(c.getAttribute('r') ?? 'A')] = value
        }
        rows[ri] = Array.from(row, x => x ?? null)
      }
    }
    return { name: s.getAttribute('name') ?? '', rows: Array.from(rows, r => r ?? []) }
  })
}

/** Excel's 1900 date system → `DD/MM/YYYY` (serial 25569 = 1 Jan 1970). */
export function excelSerialToDmy(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 1) return null
  const d = new Date(Math.round((serial - 25569) * 86_400_000))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`
}

// ── Write ────────────────────────────────────────────────────────────────────
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
function colName(i: number) {
  let s = ''
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s
  return s
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="49" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`

function sheetXml(s: SheetSpec) {
  const bold = new Set(s.boldRows ?? [])
  const cols = s.cols?.length
    ? `<cols>${s.cols.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width ?? 14}"${c.text ? ' style="2"' : ''} customWidth="1"/>`).join('')}</cols>`
    : ''
  const rows = s.rows.map((r, ri) => {
    const cells = r.map((v, ci) => {
      if (v === null || v === '') return ''
      const ref = `${colName(ci)}${ri + 1}`
      const style = (bold.has(ri) ? 1 : 0) + (s.cols?.[ci]?.text ? 2 : 0)
      const st = style ? ` s="${style}"` : ''
      if (typeof v === 'number') return `<c r="${ref}"${st}><v>${v}</v></c>`
      if (typeof v === 'boolean') return `<c r="${ref}"${st} t="b"><v>${v ? 1 : 0}</v></c>`
      return `<c r="${ref}"${st} t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`
    }).join('')
    return `<row r="${ri + 1}">${cells}</row>`
  }).join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${rows}</sheetData></worksheet>`
}

export function writeXlsx(sheets: SheetSpec[]): Blob {
  const files = [
    { name: '[Content_Types].xml', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
    { name: '_rels/.rels', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: 'xl/workbook.xml', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${esc(s.name.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: 'xl/styles.xml', text: STYLES },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, text: sheetXml(s) })),
  ]
  return zip(files.map(f => ({ name: f.name, data: enc.encode(f.text) })))
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
