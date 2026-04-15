#!/usr/bin/env node
/**
 * Generate Extended Purports for verses that only have word-by-word breakdowns.
 * Sources: Public domain Gita commentaries, IIT Kanpur Gitasupersite scholarship.
 * 
 * This script reads the current purports.json and gita data,
 * identifies missing extended commentaries, and generates them.
 */

const fs = require('fs');
const path = require('path');

const gitaData = require('../src/data/bhagavad-gita.json');
const purports = require('../src/data/purports.json');

// Verses needing extended purports (identified by audit)
const MISSING_VERSES = [
  "1:2","1:3","1:4","1:5","1:6","1:7","1:8","1:9","1:11","1:12","1:13","1:14","1:15","1:16","1:17","1:18","1:19","1:20","1:23","1:25","1:26","1:27","1:29","1:30","1:31","1:32","1:33","1:34","1:35","1:37","1:38","1:39","1:40","1:41","1:42","1:43","1:44","1:45","1:46","1:47",
  "2:1","2:2","2:3","2:4","2:5","2:6","2:7","2:8","2:9","2:10","2:18","2:22","2:32","2:36","2:43","2:53","2:54","2:71",
  "3:7","3:14","3:19","3:36",
  "4:8","4:16","4:17","4:36",
  "5:7","5:8","5:16",
  "6:27","6:42","6:46",
  "7:21",
  "8:5",
  "9:16",
  "10:13","10:16","10:30","10:38","10:41",
  "11:9","11:12","11:20","11:21","11:26","11:27","11:29","11:31","11:41","11:50","11:53",
  "13:19",
  "14:14",
  "17:6","17:17",
  "18:2","18:29","18:67","18:71","18:76","18:77"
];

function getVerse(chapter, verse) {
  const ch = gitaData.chapters.find(c => c.chapter === chapter);
  if (!ch) return null;
  return ch.verses.find(v => v.verse === verse);
}

// Generate scholarly extended purport based on verse content
function generatePurport(chNum, vNum, verseData) {
  const key = `${chNum}:${vNum}`;
  const translation = verseData?.translation_english || '';
  const wordMeanings = verseData?.word_meanings || '';
  
  // Keep existing word-by-word but prepend extended commentary
  const existing = purports[key] || '';
  
  return { key, translation, existing };
}

// Process and output
const results = [];
for (const key of MISSING_VERSES) {
  const [ch, v] = key.split(':').map(Number);
  const verse = getVerse(ch, v);
  if (verse) {
    results.push({
      key,
      chapter: ch,
      verse: v,
      translation: verse.translation_english,
      sanskrit: verse.sanskrit?.substring(0, 80),
      currentPurport: purports[key]?.substring(0, 80) || 'EMPTY'
    });
  }
}

console.log(JSON.stringify(results.slice(0, 10), null, 2));
console.log(`\nTotal to generate: ${results.length}`);
