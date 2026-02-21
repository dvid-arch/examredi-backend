import fs from 'fs/promises';
import path from 'path';

async function sync() {
    const topicsPath = path.join(process.cwd(), 'be/examredi-backend/src/db/topics.json');
    const guidesPath = path.join(process.cwd(), 'be/examredi-backend/src/db/guides.json');
    const backupPath = path.join(process.cwd(), 'be/examredi-backend/src/db/guides.json.pre-sync.bak');

    try {
        const jambSyllabus = JSON.parse(await fs.readFile(topicsPath, 'utf8'));
        const existingGuides = JSON.parse(await fs.readFile(guidesPath, 'utf8'));

        // Backup existing guides
        await fs.writeFile(backupPath, JSON.stringify(existingGuides, null, 2));
        console.log('Backup created at:', backupPath);

        const guidesMap = new Map(existingGuides.map(g => [g.id, g]));
        const now = new Date().toISOString();

        for (const [subjectSlug, subjectData] of Object.entries(jambSyllabus)) {
            let guide = guidesMap.get(subjectSlug);

            if (!guide) {
                console.log(`Adding missing subject: ${subjectData.label} (${subjectSlug})`);
                guide = {
                    id: subjectSlug,
                    subject: subjectData.label,
                    lastUpdated: now,
                    topics: []
                };
                existingGuides.push(guide);
                guidesMap.set(subjectSlug, guide);
            }

            const currentTopicIds = new Set(guide.topics.map(t => t.id));

            for (const jambTopic of subjectData.topics) {
                if (!currentTopicIds.has(jambTopic.slug)) {
                    console.log(`  Adding missing topic to ${subjectSlug}: ${jambTopic.label}`);
                    guide.topics.push({
                        id: jambTopic.slug,
                        title: jambTopic.label,
                        description: `Syllabus topic: ${jambTopic.label}`,
                        content: "",
                        keywords: [jambTopic.label],
                        videos: [],
                        inlineQuestions: []
                    });
                }
            }
        }

        // Sort guides by subject name for tidiness
        existingGuides.sort((a, b) => a.subject.localeCompare(b.subject));

        await fs.writeFile(guidesPath, JSON.stringify(existingGuides, null, 2));
        console.log(`Successfully synced guides. Total subjects: ${existingGuides.length}`);

    } catch (error) {
        console.error('Sync failed:', error);
    }
}

sync();
