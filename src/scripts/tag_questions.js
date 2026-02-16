import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PAPERS_FILE_PATH = path.join(__dirname, '..', '..', 'src', 'db', 'papers.json');
const TOPICS_FILE_PATH = "C:\\Users\\derri\\.gemini\\antigravity\\brain\\6285ea70-9175-4607-8b42-9e397eb5dffb\\study_guide_topics_v2.md";

function parseTopics(content) {
    const lines = content.split('\n');
    const subjectMap = {};
    let currentSubject = null;
    let currentTopic = null;

    for (const line of lines) {
        if (line.startsWith('## ')) {
            currentSubject = line.substring(3).trim();
            subjectMap[currentSubject] = {};
        } else if (line.startsWith('### ') && currentSubject) {
            // "1. Number and Numeration" -> "Number and Numeration"
            currentTopic = line.substring(4).replace(/^\d+\.\s*/, '').trim();
            if (!subjectMap[currentSubject][currentTopic]) {
                subjectMap[currentSubject][currentTopic] = [];
            }
        } else if (line.trim().startsWith('*') && currentSubject && currentTopic) {
            // Extract keywords from bullet points
            const text = line.trim().substring(1).trim();

            // Extract potential sub-topic from bold text: **SubTopic:** patterns
            const boldMatch = text.match(/^\*\*(.*?)\:\*\*/);
            let subTopic = null;
            if (boldMatch) {
                subTopic = boldMatch[1].trim();
            }

            // Extract keywords: find text after the colon if possible, or just split everything
            let keywordsSource = text;
            if (text.includes(':')) {
                keywordsSource = text.substring(text.indexOf(':') + 1);
            } else {
                keywordsSource = text.replace(/\*\*/g, '');
            }

            // Split by comma and clean up parentheses
            const keywords = keywordsSource.split(',').map(k => {
                return k.replace(/[()]/g, '').trim();
            }).filter(k => k.length > 2);

            if (subTopic) {
                // Add subtopic itself as a keyword/tag source
                keywords.push(subTopic);
            }

            // New Structure: subjectMap[Subject] = [ { mainTopic, subTopic, keywords } ]
            // We use an array because multiple bullet points belong to the same Main Topic
            if (!Array.isArray(subjectMap[currentSubject])) {
                // Convert from object to array on first subtopic found (or if we initialized it as object in previous loop, reset or handle)
                // Actually, simpler: let's store everything in a flat array for the subject, 
                // as we iterate questions we check against all entries for that subject.
                if (Object.keys(subjectMap[currentSubject]).length === 0 || !Array.isArray(subjectMap[currentSubject])) {
                    subjectMap[currentSubject] = [];
                }
            }

            // If we previously added empty arrays (from the ### line), ignore/overwrite them effectively by just pushing new structure

            subjectMap[currentSubject].push({
                mainTopic: currentTopic,
                subTopic: subTopic,
                keywords: keywords
            });
        }
    }
    return subjectMap;
}

function tagQuestions() {
    try {
        console.log("Reading topics from:", TOPICS_FILE_PATH);
        const topicsContent = fs.readFileSync(TOPICS_FILE_PATH, 'utf8');
        const subjectMap = parseTopics(topicsContent);

        const dbPath = path.join(__dirname, '..', 'db', 'papers.json');
        console.log("Reading papers from:", dbPath);

        const papersContent = fs.readFileSync(dbPath, 'utf8');
        const papers = JSON.parse(papersContent);
        let totalTagged = 0;

        for (const paper of papers) {
            // Normalize paper subject
            let paperSubject = paper.subject;
            const subjectMappings = {
                'Eng': 'English Language',
                'Maths': 'Mathematics',
                'CRK': 'Christian Religious Knowledge (CRK)',
                'Lit': 'Literature in English',
                'Govt': 'Government',
                'Econs': 'Economics',
                'IRK': 'Islamic Religious Knowledge (IRK)',
                'Physical and Health Education': 'Physical and Health Education (PHE)',
                'Hausa': 'Hausa',
                'Music': 'Music',
                'History': 'History',
                'Biology': 'Biology',
                'Chemistry': 'Chemistry',
                'Physics': 'Physics',
                'Commerce': 'Commerce',
                'Accounting': 'Accounting',
                'Geography': 'Geography',
                'Fine Art': 'Fine Art',
                'Computer Studies': 'Computer Studies',
                'Home Economics': 'Home Economics',
                'Agriculture': 'Agriculture' // Assuming Agriculture is in papers.json but maybe not in topics yet? (It is in papers, I didn't add it to topics... oops, let's just map it if I add it later, or it will fail matching which is fine)
            };

            if (subjectMappings[paperSubject]) {
                paperSubject = subjectMappings[paperSubject];
            }

            // Find matching subject key in our map
            // We check if the topic file subject KEY includes the paper subject or vice versa to handle (PHE) etc.
            const mapSubjectKey = Object.keys(subjectMap).find(k => {
                const mapKeyNorm = k.toLowerCase();
                const paperSubNorm = paperSubject.toLowerCase();
                return mapKeyNorm === paperSubNorm ||
                    mapKeyNorm.includes(paperSubNorm) ||
                    paperSubNorm.includes(mapKeyNorm);
            });

            if (!mapSubjectKey) continue;

            const topicEntries = subjectMap[mapSubjectKey]; // Array of { mainTopic, subTopic, keywords }

            for (const question of paper.questions) {
                const newTopics = new Set(question.topics || []);
                const textToSearch = `${question.question} ${question.options ? Object.values(question.options).map(o => o.text).join(' ') : ''} ${question.explanation || ''}`.toLowerCase();

                // Helper to check if a phrase is in the text
                const hasMatch = (phrase) => textToSearch.includes(phrase.toLowerCase());

                for (const entry of topicEntries) {
                    let matched = false;

                    // 1. Check Main Topic Name
                    if (entry.mainTopic && hasMatch(entry.mainTopic)) {
                        newTopics.add(entry.mainTopic);
                        matched = true;
                    }

                    // 2. Check Sub Topic Name (e.g. "Nuclear Physics")
                    if (entry.subTopic && hasMatch(entry.subTopic)) {
                        newTopics.add(entry.subTopic);
                        matched = true;
                    }

                    // 3. Check Keywords
                    for (const keyword of entry.keywords) {
                        if (hasMatch(keyword)) {
                            // If keyword matches, we assume the question belongs to this Main Topic and Sub Topic
                            newTopics.add(entry.mainTopic);
                            if (entry.subTopic) newTopics.add(entry.subTopic);
                            matched = true;
                            break; // Found one keyword for this entry is enough
                        }
                    }
                }

                if (newTopics.size > (question.topics ? question.topics.length : 0)) {
                    question.topics = Array.from(newTopics);
                    totalTagged++;
                }
            }
        }

        fs.writeFileSync(dbPath, JSON.stringify(papers, null, 2));
        console.log(`\nTagging complete. Tagged/Updated ${totalTagged} questions.`);
    } catch (err) {
        console.error("Error tagging questions:", err);
    }
}

tagQuestions();
