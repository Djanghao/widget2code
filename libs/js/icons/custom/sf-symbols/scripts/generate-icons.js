import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ICONS_SOURCE_ROOT = path.resolve(__dirname, '../../../../assets/icons/sf-symbols-dynamic')
const ICONS_OUTPUT_DIR = path.resolve(__dirname, '../src/components')
const ICONS_OLD_OUTPUT_DIR = path.resolve(__dirname, '../src/generated')
const ICONS_PREV_OUTPUT_DIR = path.resolve(__dirname, '../src/icons')
const ICONS_INDEX_FILE = path.resolve(__dirname, '../src/index.jsx')
const ICONS_MAP_FILE = path.resolve(__dirname, '../src/map.js')
const ICONS_DYNAMIC_FILE = path.resolve(__dirname, '../src/dynamicIconImports.js')
const ICONS_META_FILE = path.resolve(__dirname, '../src/metadata.json')

function toComponentName(str) {
  const parts = str.split(/[.-]/).filter(Boolean)
  const core = parts
    .map(p => p.replace(/[^A-Za-z0-9_$]/g, ''))
    .map(p => (p ? p.charAt(0).toUpperCase() + p.slice(1) : ''))
    .join('')
  const base = core || 'Unnamed'
  const withPrefix = base.startsWith('Sf') ? base : 'Sf' + base
  return withPrefix
}

function collectSvgFiles(dir) {
  const files = []
  const stack = [dir]
  while (stack.length) {
    const d = stack.pop()
    if (!fs.existsSync(d)) continue
    const entries = fs.readdirSync(d, { withFileTypes: true })
    for (const e of entries) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) stack.push(p)
      else if (e.isFile() && p.toLowerCase().endsWith('.svg')) files.push(p)
    }
  }
  return files
}

function normalizeSvg(svg) {
  let s = svg
    .replace(/<\?xml[^?]*\?>/g, '')
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<!DOCTYPE[^>]*>/g, '')
    .replace(/\s+width=\"[^\"]*\"/g, '')
    .replace(/\s+height=\"[^\"]*\"/g, '')
    .replace(/\s+xmlns:xlink=/g, ' xmlnsXlink=')
    .replace(/\s+fill-opacity=/g, ' fillOpacity=')
    .replace(/\s+stroke-opacity=/g, ' strokeOpacity=')
    .replace(/\s+stroke-width=/g, ' strokeWidth=')
    .replace(/\s+stroke-linecap=/g, ' strokeLinecap=')
    .replace(/\s+stroke-linejoin=/g, ' strokeLinejoin=')
    .replace(/\s+stroke-dasharray=/g, ' strokeDasharray=')
    .replace(/\s+stroke-dashoffset=/g, ' strokeDashoffset=')
    .replace(/\s+clip-path=/g, ' clipPath=')
    .replace(/\s+clip-rule=/g, ' clipRule=')
    .replace(/\s+fill-rule=/g, ' fillRule=')
    .trim()
  if (!s.startsWith('<svg')) {
    const m = s.match(/<svg[\s\S]*?<\/svg>/)
    if (m) s = m[0]
  }
  s = s.replace('<svg', '<svg width="100%" height="100%"')
  return s
}

function extractColors(svg) {
  const colors = new Set()
  const add = v => {
    if (!v) return
    const val = v.trim().replace(/['"]/g, '').toLowerCase()
    if (val === 'none' || val === 'currentcolor' || val === 'inherit' || val === 'transparent') return
    colors.add(val)
  }
  const fillRe = /fill=(["'])[^"]*?\1/gi
  const strokeRe = /stroke=(["'])[^"]*?\1/gi
  const styleRe = /style=(["'])(.*?)\1/gi
  let m
  while ((m = fillRe.exec(svg))) add(m[0].split('=').slice(1).join('=').slice(1, -1))
  while ((m = strokeRe.exec(svg))) add(m[0].split('=').slice(1).join('=').slice(1, -1))
  while ((m = styleRe.exec(svg))) {
    const style = m[2]
    style.split(';').forEach(pair => {
      const [k, v] = pair.split(':')
      if (!k || !v) return
      const key = k.trim().toLowerCase()
      const val = v.trim()
      if (key === 'fill' || key === 'stroke') add(val)
    })
  }
  return Array.from(colors)
}

function toSingleColor(svg) {
  let s = svg
  s = s.replace(/fill=(["'])(?!none|currentColor|inherit)[^"']*\1/gi, 'fill="currentColor"')
  s = s.replace(/stroke=(["'])(?!none|currentColor|inherit)[^"']*\1/gi, 'stroke="currentColor"')
  s = s.replace(/style=(["'])(.*?)\1/gi, (m, q, inner) => {
    const parts = inner.split(';').map(x => x.trim()).filter(Boolean)
    const next = parts.map(p => {
      const [k, v] = p.split(':')
      if (!k || !v) return p
      const key = k.trim().toLowerCase()
      const val = v.trim()
      if (key === 'fill' && !/^none$|^currentcolor$|^inherit$/i.test(val)) return 'fill:currentColor'
      if (key === 'stroke' && !/^none$|^currentcolor$|^inherit$/i.test(val)) return 'stroke:currentColor'
      return p
    })
    return next.length ? `style=${q}${next.join(';')}${q}` : ''
  })
  return s
}

function generateComponentCode(componentName, svg) {
  return `import React from 'react';\n\nexport default function ${componentName}() {\n  return (\n    ${svg}\n  );\n}\n`
}

if (fs.existsSync(ICONS_OUTPUT_DIR)) {
  fs.rmSync(ICONS_OUTPUT_DIR, { recursive: true, force: true })
}
if (fs.existsSync(ICONS_OLD_OUTPUT_DIR)) {
  fs.rmSync(ICONS_OLD_OUTPUT_DIR, { recursive: true, force: true })
}
if (fs.existsSync(ICONS_PREV_OUTPUT_DIR)) {
  fs.rmSync(ICONS_PREV_OUTPUT_DIR, { recursive: true, force: true })
}
fs.mkdirSync(ICONS_OUTPUT_DIR, { recursive: true })

const svgFiles = collectSvgFiles(ICONS_SOURCE_ROOT)
const entries = []
const meta = {}

for (const file of svgFiles) {
  const name = path.basename(file, '.svg')
  const raw = fs.readFileSync(file, 'utf-8')
  const normalized = normalizeSvg(raw)
  const svgFinal = normalized
  const compName = toComponentName(name)
  const outPath = path.join(ICONS_OUTPUT_DIR, `${compName}.jsx`)
  fs.writeFileSync(outPath, generateComponentCode(compName, svgFinal))
  entries.push({ name, compName })
  meta[name] = { supportsDynamicColor: true }
  process.stdout.write(`Generated ${compName}\n`)
}

const dynamicLines = []
dynamicLines.push('export const sfDynamicIconImports = {')
for (const { name, compName } of entries) {
  // Support both dot notation (e.g., 'bolt.fill') and PascalCase (e.g., 'SfBoltFill')
  dynamicLines.push(`  '${name}': () => import('./components/${compName}.jsx'),`)
  dynamicLines.push(`  '${compName}': () => import('./components/${compName}.jsx'),`)
}
dynamicLines.push('};')
dynamicLines.push('')
fs.writeFileSync(ICONS_DYNAMIC_FILE, dynamicLines.join('\n'))

fs.writeFileSync(ICONS_META_FILE, JSON.stringify(meta, null, 2))

const indexCode = [
  "export { sfDynamicIconImports } from './dynamicIconImports.js';",
  "export { default as metadata } from './metadata.json'",
  ''
].join('\n')
fs.writeFileSync(ICONS_INDEX_FILE, indexCode)

process.stdout.write(`\nTotal icons: ${entries.length}\n`)
