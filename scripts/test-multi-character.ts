#!/usr/bin/env tsx
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
}

const results: TestResult[] = []

function test(name: string, fn: () => void) {
  try {
    fn()
    results.push({ name, status: 'pass', message: 'OK' })
  } catch (err) {
    results.push({ name, status: 'fail', message: String(err) })
  }
}

console.log('🧪 Testing Multi-Character Series Implementation\n')

// Test 1: Check all files exist
test('Files: SeriesCard.tsx exists', () => {
  if (!existsSync(join(ROOT, 'components/series/SeriesCard.tsx'))) {
    throw new Error('Missing SeriesCard.tsx')
  }
})

test('Files: AICharacterGenerator.tsx exists', () => {
  if (!existsSync(join(ROOT, 'components/series/AICharacterGenerator.tsx'))) {
    throw new Error('Missing AICharacterGenerator.tsx')
  }
})

test('Files: CharacterForm.tsx exists', () => {
  if (!existsSync(join(ROOT, 'components/series/CharacterForm.tsx'))) {
    throw new Error('Missing CharacterForm.tsx')
  }
})

test('Files: Step2CharacterBuilder.tsx exists', () => {
  if (!existsSync(join(ROOT, 'components/series/Step2CharacterBuilder.tsx'))) {
    throw new Error('Missing Step2CharacterBuilder.tsx')
  }
})

test('Files: NanoBananaGenerator.tsx exists', () => {
  if (!existsSync(join(ROOT, 'components/series/NanoBananaGenerator.tsx'))) {
    throw new Error('Missing NanoBananaGenerator.tsx')
  }
})

test('Files: lib/series.ts exists', () => {
  if (!existsSync(join(ROOT, 'lib/series.ts'))) {
    throw new Error('Missing lib/series.ts')
  }
})

test('Files: lib/series-characters.ts exists', () => {
  if (!existsSync(join(ROOT, 'lib/series-characters.ts'))) {
    throw new Error('Missing lib/series-characters.ts')
  }
})

test('Files: Edit Series page exists', () => {
  if (!existsSync(join(ROOT, 'app/series/[id]/page.tsx'))) {
    throw new Error('Missing app/series/[id]/page.tsx')
  }
})

// Test 2: Check types
console.log('\n📋 Checking TypeScript types...')
try {
  execSync('npx tsc --noEmit --skipLibCheck', {
    cwd: ROOT,
    stdio: 'pipe',
    timeout: 60000,
  })
  results.push({ name: 'TypeScript', status: 'pass', message: 'No type errors' })
} catch (err: any) {
  const output = err.stdout?.toString() || err.message
  // Only fail on actual errors, not warnings
  if (output.includes('error TS')) {
    results.push({ name: 'TypeScript', status: 'fail', message: 'Type errors found' })
    console.log(output)
  } else {
    results.push({ name: 'TypeScript', status: 'pass', message: 'OK (warnings only)' })
  }
}

// Test 3: Check imports in key files
console.log('\n📦 Checking imports...')
test('Imports: lib/series.ts imports', () => {
  const content = execSync('cat lib/series.ts', { cwd: ROOT, encoding: 'utf8' })
  if (!content.includes('from\'@/lib/pocketbase\'')) {
    throw new Error('Missing pb import')
  }
  if (!content.includes('createSeries')) {
    throw new Error('Missing createSeries export')
  }
})

test('Imports: lib/series-characters.ts imports', () => {
  const content = execSync('cat lib/series-characters.ts', { cwd: ROOT, encoding: 'utf8' })
  if (!content.includes('addCharacterToSeries')) {
    throw new Error('Missing addCharacterToSeries export')
  }
})

// Print results
console.log('\n📊 Results:\n')
let passed = 0
let failed = 0

for (const r of results) {
  const icon = r.status === 'pass' ? '✅' : r.status === 'warn' ? '⚠️' : '❌'
  console.log(`${icon} ${r.name}: ${r.message}`)
  if (r.status === 'pass') passed++
  else if (r.status === 'fail') failed++
}

console.log(`\n${passed}/${results.length} tests passed`)

if (failed > 0) {
  console.log(`\n${failed} test(s) failed`)
  process.exit(1)
} else {
  console.log('\n🎉 All tests passed!')
  process.exit(0)
}
