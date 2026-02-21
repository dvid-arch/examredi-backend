/**
 * sync_topics_to_guides.js
 * -------------------------
 * Syncs topics.json (JAMB syllabus) into guides.json by adding missing topic/subject
 * shells. Existing content and structure are NEVER removed or overwritten.
 *
 * Safe to re-run — fully idempotent.
 *
 * After running this, seed the updated guides.json into MongoDB:
 *   node src/scripts/seed_guides.js
 *
 * Usage:
 *   node src/scripts/sync_topics_to_guides.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'db');
const topicsPath = path.join(dbPath, 'topics.json');
const guidesPath = path.join(dbPath, 'guides.json');

const topicsRaw = JSON.parse(fs.readFileSync(topicsPath, 'utf8'));
const guides = JSON.parse(fs.readFileSync(guidesPath, 'utf8'));

// Index guides by id for quick lookup; keep order stable
const guideMap = new Map(guides.map(g => [g.id, g]));

let addedSubjects = 0;
let addedTopics = 0;

for (const [subjectSlug, subjectData] of Object.entries(topicsRaw)) {
    const syllabusTopics = subjectData.topics || [];
    if (syllabusTopics.length === 0) continue; // Nothing to add for subjects with no JAMB topics

    let guide = guideMap.get(subjectSlug);

    // ── Case 1: Subject missing entirely from guides.json ──────────────────
    if (!guide) {
        guide = {
            id: subjectSlug,
            subject: subjectData.label,
            lastUpdated: new Date().toISOString().slice(0, 10),
            topics: []
        };
        guides.push(guide);
        guideMap.set(subjectSlug, guide);
        addedSubjects++;
        console.log(`➕ Added new subject: ${subjectData.label}`);
    }

    // ── Case 2: Subject exists — add any missing topics as empty shells ─────
    const existingTopicIds = new Set(guide.topics.map(t => t.id));

    for (const syllabicTopic of syllabusTopics) {
        if (existingTopicIds.has(syllabicTopic.slug)) continue; // Already present

        guide.topics.push({
            id: syllabicTopic.slug,
            title: syllabicTopic.label,
            description: '',
            subTopics: [] // Empty shell — content to be populated later
        });
        existingTopicIds.add(syllabicTopic.slug);
        addedTopics++;
        console.log(`  ✚ ${subjectData.label}: added topic "${syllabicTopic.label}"`);
    }
}

// Write back
fs.writeFileSync(guidesPath, JSON.stringify(guides, null, 2));

console.log('\n═══════════════════════════════════════════════════════');
console.log(` Sync complete.`);
console.log(`   New subjects  : ${addedSubjects}`);
console.log(`   New topics    : ${addedTopics}`);
console.log('═══════════════════════════════════════════════════════');
if (addedSubjects + addedTopics > 0) {
    console.log('\n⚠  Remember to re-seed MongoDB:');
    console.log('   node src/scripts/seed_guides.js\n');
} else {
    console.log('\n✅ guides.json is already in sync with topics.json — nothing to do.\n');
}
