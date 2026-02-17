
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db', 'guides.json');
const guides = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

let englishGuide = guides.find(g => g.id === 'english-language' || g.subject === 'English Language' || g.id === 'english');

if (!englishGuide) {
    console.log("English guide not found. Creating placeholder...");
    englishGuide = {
        "id": "english-language",
        "subject": "English Language",
        "lastUpdated": new Date().toISOString().split('T')[0],
        "topics": [
            {
                "id": "lexis-and-structure",
                "title": "Lexis and Structure",
                "subTopics": [
                    { "id": "vocabulary", "title": "Vocabulary", "keywords": ["synonyms", "antonyms", "idioms"] },
                    { "id": "grammar", "title": "Grammar", "keywords": ["noun", "verb", "concord"] },
                    { "id": "sentence-structure", "title": "Sentence Structure", "keywords": ["clause", "phrase", "punctuation"] }
                ]
            },
            {
                "id": "comprehension-and-summary",
                "title": "Comprehension and Summary",
                "subTopics": [
                    { "id": "reading-comprehension", "title": "Reading Comprehension", "keywords": ["inference", "main idea"] }
                ]
            },
            {
                "id": "oral-forms",
                "title": "Oral Forms (Oral English)",
                "subTopics": [
                    { "id": "vowels-and-consonants", "title": "Vowels and Consonants", "keywords": ["phonology", "stress", "intonation"] }
                ]
            }
        ]
    };
    guides.push(englishGuide);
}

const contentData = {
    "vocabulary": `## Lexis and Vocabulary
Vocabulary development is essential for understanding and expressing complex ideas in English.

### Word Formation
1. **Prefixes:** Letters added to the beginning of a word to change its meaning (e.g., *un-* in *unhappy*, *re-* in *rewrite*).
2. **Suffixes:** Letters added to the end of a word (e.g., *-ness* in *happiness*, *-ly* in *quickly*).
3. **Compound Words:** Two or more words joined to create a new meaning (e.g., *notebook*, *blackboard*).

### Meanings and Relationships
- **Synonyms:** Words with similar meanings (e.g., *big/large*).
- **Antonyms:** Words with opposite meanings (e.g., *hot/cold*).
- **Homonyms:** Words with the same spelling/sound but different meanings (e.g., *bank* of a river vs. *bank* for money).
- **Idioms:** Expressions whose meaning is not literal (e.g., *kick the bucket*, *it's raining cats and dogs*).

### Registers
Registers are sets of vocabulary associated with specific fields:
- **Agriculture:** *irrigation, pest, harvest, fertilization*.
- **Medicine:** *diagnosis, therapy, surgery, prescription*.
- **Law:** *litigation, plaintiff, defendant, verdict*.`,

    "grammar": `## English Grammar: Structure and Concord
Grammar is the system of rules that defines how words are combined into meaningful sentences.

### Word Classes (Parts of Speech)
1. **Nouns:** Names of people, places, or things.
2. **Verbs:** Action or state words (e.g., *run, be*).
3. **Adjectives:** Describe nouns (e.g., *beautiful*).
4. **Adverbs:** Describe verbs, adjectives, or other adverbs (e.g., *loudly*).
5. **Pronouns:** Replace nouns (e.g., *he, she, it*).
6. **Prepositions:** Show relationships (e.g., *in, on, at*).
7. **Conjunctions:** Join words/sentences (e.g., *and, but*).

### Concord (Subject-Verb Agreement)
The fundamental rule is that a singular subject takes a singular verb, and a plural subject takes a plural verb.
- **Rule of "Each/Every":** Subjects starting with "each" or "every" are singular (e.g., *Every student has a book*).
- **Fraction/Percentage:** The verb agrees with the noun following "of" (e.g., *Half of the cake is gone* vs. *Half of the cakes are gone*).

### Tenses
- **Present:** *I talk*.
- **Past:** *I talked*.
- **Future:** *I will talk*.
- **Perfect:** *I have talked*.`,

    "sentence-structure": `## Sentence Structure and Mechanics
A sentence is a group of words that expresses a complete thought.

### Types of Sentences
1. **Simple:** One independent clause (*She smiled*).
2. **Compound:** Two independent clauses joined by a conjunction (*She smiled, and he laughed*).
3. **Complex:** One independent and one or more dependent clauses (*When she smiled, he laughed*).

### Clauses and Phrases
- **Phrase:** A group of words without a subject-verb unit (e.g., *in the morning*).
- **Clause:** A group of words with a subject and a verb.

### Punctuation
- **Full Stop (.):** Ends a statement.
- **Comma (,):** Indicates a brief pause or separates items in a list.
- **Question Mark (?):** Ends a question.
- **Apostrophe ('):** Shows possession (*John's*) or contraction (*don't*).`,

    "reading-comprehension": `## Reading Comprehension
Comprehension involves understanding, interpreting, and drawing conclusions from written text.

### Key Skills
1. **Identifying Main Ideas:** What is the paragraph primarily about?
2. **Finding Supporting Details:** Facts or examples that explain the main idea.
3. **Inference:** Understanding what is implied but not explicitly stated.
4. **Vocabulary in Context:** Figuring out the meaning of a word based on the surrounding sentences.

### Author's Tone and Attitude
- **Objective:** Factual and neutral.
- **Subjective:** Emotional and biased.
- **Sarcastic:** Using irony to mock or convey contempt.
- **Enthusiastic:** Showing great interest and excitement.`,

    "vowels-and-consonants": `## Oral English: Phonology
Oral English focuses on the sounds of the English language.

### English Sounds
There are 44 sounds in English, divided into Vowels and Consonants.
- **Vowels (20 sounds):**
  - **Monophthongs:** Pure vowel sounds (e.g., /i:/ as in *sheep*).
  - **Diphthongs:** Gliding sounds (e.g., /ei/ as in *day*).
- **Consonants (24 sounds):** Voiced vs. Voiceless (e.g., /p/ is voiceless, /b/ is voiced).

### Stress and Intonation
- **Word Stress:** The emphasis placed on a specific syllable in a word (e.g., *PRE-sent* vs. *pre-SENT*).
- **Sentence Stress:** Emphasis on key words in a sentence to convey meaning.
- **Intonation:** The rise and fall of the voice in speaking (Falling for statements, Rising for yes/no questions).`
};

// Update English Subtopics
englishGuide.topics.forEach(topic => {
    topic.subTopics.forEach(subTopic => {
        if (contentData[subTopic.id]) {
            subTopic.content = contentData[subTopic.id];
            console.log(`Updated content for: ${subTopic.id}`);
        }
    });
});

fs.writeFileSync(dbPath, JSON.stringify(guides, null, 2));
console.log("English content populated successfully.");
