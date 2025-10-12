import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SOURCE_DIR = path.resolve(__dirname, '../../../assets/icons/sf-symbols-multicolor-4a0088')
const OUTPUT_DIR = path.resolve(__dirname, '../../../assets/icons/sf-symbols-dynamic')

console.log('🎨 Preparing dynamic icon library...')
console.log(`📂 Source: ${SOURCE_DIR}`)
console.log(`📁 Output: ${OUTPUT_DIR}`)

if (!fs.existsSync(SOURCE_DIR)) {
  console.error(`❌ Source directory not found: ${SOURCE_DIR}`)
  process.exit(1)
}

if (fs.existsSync(OUTPUT_DIR)) {
  console.log('🗑️  Cleaning existing output directory...')
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true })
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

const files = fs.readdirSync(SOURCE_DIR).filter(f => f.toLowerCase().endsWith('.svg'))

console.log(`\n📊 Processing ${files.length} icons...`)

let processedCount = 0
let replacedCount = 0

files.forEach((fileName, index) => {
  const sourcePath = path.join(SOURCE_DIR, fileName)
  const outputPath = path.join(OUTPUT_DIR, fileName)

  let content = fs.readFileSync(sourcePath, 'utf-8')

  const matches = content.match(/#4a0088/gi)
  const replaceCount = matches ? matches.length : 0

  const processed = content.replace(
    /#4a0088/gi,
    'var(--icon-color, rgba(255, 255, 255, 0.85))'
  )

  fs.writeFileSync(outputPath, processed, 'utf-8')

  processedCount++
  replacedCount += replaceCount

  if ((index + 1) % 500 === 0) {
    console.log(`  ⏳ Processed ${index + 1}/${files.length} icons...`)
  }
})

console.log(`\n✅ Done!`)
console.log(`📦 Processed: ${processedCount} icons`)
console.log(`🎨 Replaced: ${replacedCount} color instances`)
console.log(`📁 Output: ${OUTPUT_DIR}`)
console.log(`\n💡 Next steps:`)
console.log(`   1. Run: npm run build:icons`)
console.log(`   2. Use: <Icon name="person.fill" color="#ff6b6b" size={32} />`)
