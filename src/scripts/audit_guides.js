/**
 * audit_guides.js
 * ----------------
 * Compares topics.json (JAMB syllabus) against guides.json (study guide content).
 * Prints a coverage report.  READ-ONLY — does not modify any file.
 *
 * Usage:
 *   node src/scripts/audit_guides.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'db');

const topicsRaw = JSON.parse(fs.readFileSync(path.join(dbPath, 'topics.json'), 'utf8'));
const guides = JSON.parse(fs.readFileSync(path.join(dbPath, 'guides.json'), 'utf8'));

// Index guides by id for quick lookup
const guideMap = new Map(guides.map(g => [g.id, g]));

let totalTopics = 0;
let coveredTopics = 0;
let missingSubjects = [];

console.log('\n═══════════════════════════════════════════════════════');
console.log(' ExamRedi — Study Guide Coverage Audit');
console.log('═══════════════════════════════════════════════════════\n');

for (const [subjectSlug, subjectData] of Object.entries(topicsRaw)) {
    const syllabusTopics = subjectData.topics || [];
    if (syllabusTopics.length === 0) continue; // Skip subjects with no JAMB topics listed

    totalTopics += syllabusTopics.length;

    const guide = guideMap.get(subjectSlug);
    if (!guide) {
        missingSubjects.push({ slug: subjectSlug, label: subjectData.label, count: syllabusTopics.length });
        console.log(`❌ MISSING SUBJECT: ${subjectData.label} (${subjectSlug})`);
        console.log(`   ${syllabusTopics.length} JAMB topics not covered at all.\n`);
        continue;
    }

    // Index the guide's topics by id
    const guideTopicIds = new Set(guide.topics.map(t => t.id));

    const missing = syllabusTopics.filter(t => !guideTopicIds.has(t.slug));
    const covered = syllabusTopics.length - missing.length;
    coveredTopics += covered;

    const pct = Math.round((covered / syllabusTopics.length) * 100);
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));

    console.log(`📘 ${subjectData.label} (${subjectSlug})`);
    console.log(`   [${bar}] ${pct}%  (${covered}/${syllabusTopics.length} topics)`);

    if (missing.length > 0) {
        console.log(`   ⚠  Missing topics (${missing.length}):`);
        missing.forEach(t => console.log(`      • ${t.label} (${t.slug})`));
    }
    console.log();
}

console.log('═══════════════════════════════════════════════════════');
console.log(` SUMMARY`);
console.log(`   Covered : ${coveredTopics} / ${totalTopics} JAMB topics`);
console.log(`   Missing subjects (with topics): ${missingSubjects.length}`);
console.log('═══════════════════════════════════════════════════════\n');

if (missingSubjects.length > 0) {
    console.log('Run `node src/scripts/sync_topics_to_guides.js` to add empty shells for missing entries.\n');
}
