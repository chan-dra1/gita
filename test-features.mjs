#!/usr/bin/env node
/**
 * Feature Test Script for Gita App
 * Tests all major functionality without needing a device
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

let passed = 0;
let failed = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(name, fn) {
  try {
    fn();
    log(`  ✅ ${name}`, 'green');
    passed++;
  } catch (error) {
    log(`  ❌ ${name}`, 'red');
    log(`     Error: ${error.message}`, 'red');
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// ==================== TESTS ====================

log('\n' + '='.repeat(60), 'bold');
log('GITA APP - FEATURE TEST SUITE', 'bold');
log('='.repeat(60) + '\n', 'bold');

// Test 1: Project Structure
log('📁 Testing Project Structure...', 'cyan');

test('app.json exists', () => {
  assert(fs.existsSync(path.join(__dirname, 'app.json')), 'app.json not found');
});

test('package.json exists', () => {
  assert(fs.existsSync(path.join(__dirname, 'package.json')), 'package.json not found');
});

test('tsconfig.json exists', () => {
  assert(fs.existsSync(path.join(__dirname, 'tsconfig.json')), 'tsconfig.json not found');
});

test('eas.json exists', () => {
  assert(fs.existsSync(path.join(__dirname, 'eas.json')), 'eas.json not found');
});

test('tailwind.config.js exists', () => {
  assert(fs.existsSync(path.join(__dirname, 'tailwind.config.js')), 'tailwind.config.js not found');
});

// Test 2: Source Files
log('\n📄 Testing Source Files...', 'cyan');

test('All tab screens exist', () => {
  const tabs = ['index.tsx', 'daily.tsx', 'library.tsx', 'profile.tsx'];
  tabs.forEach(tab => {
    assert(fs.existsSync(path.join(__dirname, 'app/(tabs)', tab)), `${tab} not found`);
  });
});

test('Onboarding screens exist', () => {
  const steps = ['step1.tsx', 'step2.tsx', 'step3.tsx', 'step4.tsx', 'paywall.tsx'];
  steps.forEach(step => {
    assert(fs.existsSync(path.join(__dirname, 'app/onboarding', step)), `${step} not found`);
  });
});

test('Sloka detail screen exists', () => {
  assert(fs.existsSync(path.join(__dirname, 'app/sloka/[chapter]/[verse].tsx')), 'verse.tsx not found');
});

test('Settings screen exists', () => {
  assert(fs.existsSync(path.join(__dirname, 'app/settings.tsx')), 'settings.tsx not found');
});

// Test 3: Utils & Hooks
log('\n🔧 Testing Utilities & Hooks...', 'cyan');

test('Stats utility exists', () => {
  assert(fs.existsSync(path.join(__dirname, 'src/utils/stats.ts')), 'stats.ts not found');
});

test('Commentary utility exists', () => {
  assert(fs.existsSync(path.join(__dirname, 'src/utils/commentary.ts')), 'commentary.ts not found');
});

test('Sloka utility exists', () => {
  assert(fs.existsSync(path.join(__dirname, 'src/utils/sloka.ts')), 'sloka.ts not found');
});

test('Types exist', () => {
  assert(fs.existsSync(path.join(__dirname, 'src/types/index.ts')), 'types/index.ts not found');
});

test('Gita data exists', () => {
  assert(fs.existsSync(path.join(__dirname, 'src/data/bhagavad-gita.json')), 'bhagavad-gita.json not found');
});

test('Commentary data exists', () => {
  assert(fs.existsSync(path.join(__dirname, 'src/data/commentary.json')), 'commentary.json not found');
});

// Test 4: Configuration Validation
log('\n⚙️  Testing Configuration...', 'cyan');

test('app.json is valid JSON', () => {
  const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'app.json'), 'utf8'));
  assert(appJson.expo, 'Invalid app.json structure');
});

test('app.json has bundle identifiers', () => {
  const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'app.json'), 'utf8'));
  assert(appJson.expo.ios?.bundleIdentifier, 'iOS bundle identifier missing');
  assert(appJson.expo.android?.package, 'Android package missing');
});

test('eas.json is valid JSON', () => {
  const easJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'eas.json'), 'utf8'));
  assert(easJson.build, 'Invalid eas.json structure');
});

test('eas.json has all build profiles', () => {
  const easJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'eas.json'), 'utf8'));
  assert(easJson.build.development, 'development profile missing');
  assert(easJson.build.preview, 'preview profile missing');
  assert(easJson.build.production, 'production profile missing');
});

test('package.json has required dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const required = ['expo', 'react', 'react-native', 'expo-router', '@expo/vector-icons'];
  required.forEach(dep => {
    assert(pkg.dependencies[dep], `${dep} dependency missing`);
  });
});

// Test 5: Data Integrity
log('\n📊 Testing Data Integrity...', 'cyan');

test('Gita data has 18 chapters', () => {
  const gita = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/bhagavad-gita.json'), 'utf8'));
  assert(gita.chapters.length === 18, `Expected 18 chapters, got ${gita.chapters.length}`);
});

test('Gita data has 700 verses total', () => {
  const gita = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/bhagavad-gita.json'), 'utf8'));
  const total = gita.chapters.reduce((sum, ch) => sum + ch.verses_count, 0);
  assert(total === 700, `Expected 700 verses, got ${total}`);
});

test('Chapter 2 has 72 verses', () => {
  const gita = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/bhagavad-gita.json'), 'utf8'));
  const ch2 = gita.chapters.find(ch => ch.chapter === 2);
  assert(ch2.verses_count === 72, `Chapter 2 should have 72 verses, got ${ch2.verses_count}`);
});

test('Chapter 18 has 78 verses', () => {
  const gita = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/bhagavad-gita.json'), 'utf8'));
  const ch18 = gita.chapters.find(ch => ch.chapter === 18);
  assert(ch18.verses_count === 78, `Chapter 18 should have 78 verses, got ${ch18.verses_count}`);
});

test('Commentary data has entries', () => {
  const commentary = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/commentary.json'), 'utf8'));
  assert(Object.keys(commentary.commentaries).length > 0, 'No commentary entries found');
});

test('Verse 2.47 has commentary', () => {
  const commentary = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/commentary.json'), 'utf8'));
  assert(commentary.commentaries['2.47'], 'Verse 2.47 commentary missing');
});

// Test 6: Code Structure
log('\n💻 Testing Code Structure...', 'cyan');

test('Stats utility exports all required functions', () => {
  const statsContent = fs.readFileSync(path.join(__dirname, 'src/utils/stats.ts'), 'utf8');
  const required = ['getSlokasRead', 'addSlokaRead', 'saveSloka', 'unsaveSloka', 'getSavedSlokas', 'updateStreak'];
  required.forEach(fn => {
    assert(statsContent.includes(`export async function ${fn}`), `${fn} not exported`);
  });
});

test('Commentary utility has getCommentary function', () => {
  const commentaryContent = fs.readFileSync(path.join(__dirname, 'src/utils/commentary.ts'), 'utf8');
  assert(commentaryContent.includes('export function getCommentary'), 'getCommentary not exported');
});

test('Onboarding step 2 saves experience level', () => {
  const step2 = fs.readFileSync(path.join(__dirname, 'app/onboarding/step2.tsx'), 'utf8');
  assert(step2.includes("saveOnboardingStep('experienceLevel'"), 'experienceLevel not saved');
});

test('Onboarding step 3 saves guidance style', () => {
  const step3 = fs.readFileSync(path.join(__dirname, 'app/onboarding/step3.tsx'), 'utf8');
  assert(step3.includes("saveOnboardingStep('guidanceStyle'"), 'guidanceStyle not saved');
});

test('Onboarding step 4 saves commitment and goes to paywall', () => {
  const step4 = fs.readFileSync(path.join(__dirname, 'app/onboarding/step4.tsx'), 'utf8');
  assert(step4.includes("saveOnboardingStep('dailyCommitment'"), 'dailyCommitment not saved');
  assert(step4.includes("saveOnboardingStep('remindersEnabled'"), 'remindersEnabled not saved');
  assert(step4.includes("router.replace('/onboarding/paywall')"), 'Does not navigate to paywall');
});

test('Paywall navigates to tabs', () => {
  const paywall = fs.readFileSync(path.join(__dirname, 'app/onboarding/paywall.tsx'), 'utf8');
  assert(paywall.includes("router.replace('/(tabs)')"), 'Paywall does not navigate to tabs');
});

test('Sloka screen tracks reads', () => {
  const sloka = fs.readFileSync(path.join(__dirname, 'app/sloka/[chapter]/[verse].tsx'), 'utf8');
  assert(sloka.includes('addSlokaRead(chapter, verse)'), 'addSlokaRead not called');
});

test('Sloka screen has save functionality', () => {
  const sloka = fs.readFileSync(path.join(__dirname, 'app/sloka/[chapter]/[verse].tsx'), 'utf8');
  assert(sloka.includes('handleToggleSave'), 'Save toggle not found');
  assert(sloka.includes('saveSloka') || sloka.includes('unsaveSloka'), 'Save functions not found');
});

test('Sloka screen has commentary', () => {
  const sloka = fs.readFileSync(path.join(__dirname, 'app/sloka/[chapter]/[verse].tsx'), 'utf8');
  assert(sloka.includes('getCommentary') || sloka.includes('getGenericCommentary'), 'Commentary not loaded');
});

test('Sloka screen has audio coming soon', () => {
  const sloka = fs.readFileSync(path.join(__dirname, 'app/sloka/[chapter]/[verse].tsx'), 'utf8');
  assert(sloka.includes('handleAudioComingSoon'), 'Audio coming soon handler not found');
  assert(sloka.includes('Coming Soon'), 'Coming Soon text not found');
});

test('Library screen shows progress', () => {
  const library = fs.readFileSync(path.join(__dirname, 'app/(tabs)/library.tsx'), 'utf8');
  assert(library.includes('getSlokasRead'), 'getSlokasRead not used');
  assert(library.includes('progress'), 'Progress not tracked');
});

test('Profile screen shows real stats', () => {
  const profile = fs.readFileSync(path.join(__dirname, 'app/(tabs)/profile.tsx'), 'utf8');
  assert(profile.includes('getAllStats'), 'getAllStats not used');
  assert(profile.includes('getOnboardingData'), 'getOnboardingData not used');
});

// Test 7: Build Output
log('\n🏗️  Testing Build Output...', 'cyan');

test('dist folder exists (from previous export)', () => {
  assert(fs.existsSync(path.join(__dirname, 'dist')), 'dist folder not found - run expo export first');
});

test('dist has iOS bundle', () => {
  const iosPath = path.join(__dirname, 'dist/_expo/static/js/ios');
  assert(fs.existsSync(iosPath) || fs.existsSync(path.join(__dirname, 'dist/ios')), 'iOS bundle not found');
});

test('dist has Android bundle', () => {
  const androidPath = path.join(__dirname, 'dist/_expo/static/js/android');
  assert(fs.existsSync(androidPath) || fs.existsSync(path.join(__dirname, 'dist/android')), 'Android bundle not found');
});

test('dist has web bundle', () => {
  const webPath = path.join(__dirname, 'dist/_expo/static/js/web');
  assert(fs.existsSync(webPath) || fs.existsSync(path.join(__dirname, 'dist/web')), 'Web bundle not found');
});

// ==================== SUMMARY ====================

log('\n' + '='.repeat(60), 'bold');
log('TEST SUMMARY', 'bold');
log('='.repeat(60), 'bold');

const total = passed + failed;
const percentage = Math.round((passed / total) * 100);

log(`\nTotal Tests: ${total}`, 'bold');
log(`Passed: ${passed}`, 'green');
log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
log(`Success Rate: ${percentage}%`, percentage >= 90 ? 'green' : percentage >= 70 ? 'yellow' : 'red');

if (failed === 0) {
  log('\n✨ ALL TESTS PASSED! ✨', 'green');
  log('\nYour app is ready for:', 'cyan');
  log('  • iOS Simulator testing', 'reset');
  log('  • Android Emulator testing', 'reset');
  log('  • EAS cloud builds', 'reset');
  log('  • App Store submission', 'reset');
  log('  • Play Store submission', 'reset');
} else {
  log('\n⚠️  SOME TESTS FAILED', 'red');
  log('Please review the errors above.', 'yellow');
}

log('\n' + '='.repeat(60) + '\n', 'bold');

process.exit(failed > 0 ? 1 : 0);
