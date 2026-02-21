import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db');
const guidesPath = path.join(dbPath, 'guides.json');
const topicsPath = path.join(dbPath, 'topics.json');
const outputPath = path.join(dbPath, 'guides.json'); // Overwriting after backup

async function migrate() {
    try {
        console.log('Starting migration to flat guide structure...');

        // 1. Load Data
        const guidesRaw = await fs.readFile(guidesPath, 'utf-8');
        const guides = JSON.parse(guidesRaw);

        const topicsRaw = await fs.readFile(topicsPath, 'utf-8');
        const jambSyllabus = JSON.parse(topicsRaw);

        // Backup
        await fs.writeFile(`${guidesPath}.bak`, guidesRaw);
        console.log('Backup created at guides.json.bak');

        const newGuides = [];

        // 2. Process each subject in the JAMB syllabus
        for (const [subjectSlug, subjectData] of Object.entries(jambSyllabus)) {
            const subjectLabel = subjectData.label;
            console.log(`Processing subject: ${subjectLabel} (${subjectSlug})`);

            // Find existing guide for this subject
            const existingGuide = guides.find(g => g.id === subjectSlug || g.subject.toLowerCase() === subjectLabel.toLowerCase());

            const flatTopics = [];

            // 3. For each official JAMB topic, find content from subtopics
            for (const jambTopic of subjectData.topics) {
                const newTopic = {
                    id: jambTopic.slug,
                    title: jambTopic.label,
                    description: '',
                    content: '',
                    keywords: [],
                    videos: [],
                    inlineQuestions: []
                };

                if (existingGuide) {
                    // Search for matching content in existing structure
                    // Strategy: Check if any subtopic title matches the JAMB topic label exactly or partially
                    for (const oldGroup of existingGuide.topics) {
                        // Check if the group itself matches (sometimes groups ARE the topics)
                        if (oldGroup.title.toLowerCase() === jambTopic.label.toLowerCase() || oldGroup.id === jambTopic.slug) {
                            newTopic.description = oldGroup.description || '';
                            // If it has content directly (unlikely in old structure but possible)
                            if (oldGroup.content) newTopic.content = oldGroup.content;
                        }

                        for (const sub of oldGroup.subTopics) {
                            const subTitleLower = sub.title.toLowerCase();
                            const jambLabelLower = jambTopic.label.toLowerCase();

                            // Exact match or significant overlap
                            if (subTitleLower === jambLabelLower || sub.id === jambTopic.slug || jambLabelLower.includes(subTitleLower) && subTitleLower.length > 5) {
                                console.log(`  Matching content found for "${jambTopic.label}" in subtopic "${sub.title}"`);

                                // Merge content
                                if (sub.content) {
                                    newTopic.content = sub.content;
                                }
                                if (sub.keywords) {
                                    newTopic.keywords = [...new Set([...newTopic.keywords, ...sub.keywords])];
                                }
                                if (sub.videos) {
                                    newTopic.videos = [...new Set([...newTopic.videos, ...sub.videos])];
                                }
                                if (sub.inlineQuestions) {
                                    newTopic.inlineQuestions = sub.inlineQuestions;
                                }
                            }
                        }
                    }
                }

                flatTopics.push(newTopic);
            }

            newGuides.push({
                id: subjectSlug,
                subject: subjectLabel,
                lastUpdated: new Date().toISOString().split('T')[0],
                topics: flatTopics
            });
        }

        // 4. Save
        await fs.writeFile(outputPath, JSON.stringify(newGuides, null, 2));
        console.log(`Migration complete! Saved ${newGuides.length} guides to ${outputPath}`);

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
