
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db', 'guides.json');
const guides = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const findGuide = (id, subject) => guides.find(g => g.id === id || g.subject === subject);

const artGuide = findGuide('fine-art', 'Fine Art');
const frenchGuide = findGuide('french', 'French');
const hausaGuide = findGuide('hausa', 'Hausa');
const historyGuide = findGuide('history', 'History');
const homeEcGuide = findGuide('home-economics', 'Home Economics');
const musicGuide = findGuide('music', 'Music');
const pheGuide = findGuide('phe', 'Physical and Health Education (PHE)');

const contentData = {
    // Music
    "rudiments": `## Rudiments of Music
Musical rudiments are the basic building blocks of music theory, notation, and performance.

### 1. Notation and the Staff
Music is written on a **staff** (or stave) consisting of five lines and four spaces.
- **Clefs:** Assign names to the lines and spaces (Treble Clef for high notes, Bass Clef for low notes).
- **Notes and Rests:** Represent the duration of sounds and silences (e.g., Semibreve, Minim, Crotchet).

### 2. Time Signatures
Determine the number of beats in a measure.
- **Common Time (4/4):** Four crotchet beats per bar.
- **Triple Time (3/4):** Three crotchet beats per bar.

### 3. Scales and Intervals
- **Scale:** A series of notes in ascending or descending order (e.g., Major and Minor scales).
- **Interval:** The distance between two musical notes.`,

    // Home Economics
    "nutrients": `## Food and Nutrition: Nutrients
Nutrients are chemical substances in food that the body needs for growth, energy, and health.

### The Six Classes of Nutrients
1. **Carbohydrates:** Primary source of energy (e.g., Yam, Rice, Bread).
2. **Proteins:** For growth and repair of body tissues (e.g., Meat, Fish, Beans).
3. **Fats and Oils:** Concentrated energy source and insulation (e.g., Butter, Vegetable oil).
4. **Vitamins:** Protect the body from diseases (e.g., Fruits, Vegetables).
5. **Minerals:** For strong bones, teeth, and blood (e.g., Calcium, Iron).
6. **Water:** Vital for all body processes and temperature regulation.

### Balanced Diet
A diet that contains all the six classes of nutrients in the right proportions for the body's needs.`,

    // History
    "pre-colonial-nigeria": `## Pre-Colonial Nigeria
Before European arrival, Nigeria consisted of various independent states and kingdoms with sophisticated political and social systems.

### 1. The Hausa/Fulani (North)
The Hausa city-states (Kano, Katsina, Zaria) were centers of trade. After the 1804 Jihad led by **Usman dan Fodio**, they were centralized into the **Sokoto Caliphate** with an Emirate system.

### 2. The Yoruba (West)
The **Old Oyo Empire** was a powerful military state with a system of checks and balances (Alaafin and the Oyomesi council).

### 3. The Igbo (East)
Known for their **segmentary (stateless)** societies. Political decisions were made through village assemblies (Oha-na-eze) and elders' councils.`,

    // Fine Art
    "art-history": `## Introduction to Art History
Art history is the study of how art has changed over time and its reflection of different cultures.

### 1. Ancient Civilizations
- **Egyptian Art:** Focused on the afterlife, used hieroglyphs and stylized human forms.
- **Greek/Roman Art:** Emphasized realism, idealism, and classical proportions.

### 2. Major Art Movements
- **Renaissance:** A "rebirth" of art and science in Europe (e.g., Leonardo da Vinci, Michelangelo).
- **Impressionism:** Focused on light and color (e.g., Monet).
- **Cubism:** Breaking objects into geometric shapes (e.g., Picasso).

### 3. African Art Traditions
Includes Nok terracottas, Benin bronzes, and Ife heads, known for their spiritual significance and intricate craftsmanship.`,

    // French
    "grammar": `## Grammaire Française (French Grammar)
French grammar follows specific rules for gender, number, and conjugation.

### 1. Nouns and Gender
Every noun in French is either **Masculine** (*le/un*) or **Feminine** (*la/une*). Adjectives must agree in gender and number with the nouns they describe.

### 2. Articles
- **Definite:** *Le, La, L', Les* (The).
- **Indefinite:** *Un, Une, Des* (A/Some).

### 3. Verbs and Conjugation
Verbs are grouped into three categories based on their endings: *-er, -ir, -re*.
- **Present Tense:** *Je parle* (I speak), *Je finis* (I finish), *Je vends* (I sell).
- **Common Tenses:** *Passé Composé* (Past), *Futur Simple* (Future), *Imparfait* (Continuous past).`,

    // Hausa
    "nahawun-hausa": `## Nahawun Hausa (Hausa Grammar)
Hausa is one of the most widely spoken languages in Africa, belonging to the Chadic branch.

### 1. Alphabet and Vowels
- **Alphabet:** Uses both Arabic (Ajami) and Latin (Boko) scripts.
- **Vowels (Wasula):** Five short vowels (a, e, i, o, u) and five long counterparts.

### 2. Nouns and Gender
Unlike English, Hausa distinguishes gender for both living and non-living things.
- **Suna (Noun):** Can be *Namiji* (Male) or *Mace* (Female).

### 3. Sentence Structure
A typical Hausa sentence follows the **Subject-People-Verb** pattern, where the "person pronoun" indicates the tense.`,

    // PHE
    "health-and-fitness": `## Health, Fitness, and Well-being
Physical and Health Education (PHE) promotes a healthy lifestyle through physical activity and health awareness.

### 1. Physical Fitness
The ability of the body to perform daily tasks without undue fatigue.
- **Components:** Strength, Endurance, Flexibility, Speed, and Agility.
- **Benefits:** Weight control, reduced risk of heart disease, and improved mental health.

### 2. Health Education
Focuses on preventing illness and promoting wellness.
- **Personal Hygiene:** Keeping the body clean to prevent infections.
- **Nutrition:** The role of a balanced diet in maintaining health.
- **Drug Abuse:** The dangers of misusing substances like tobacco, alcohol, and illicit drugs.`
};

const updateGuide = (guide) => {
    if (!guide) return;
    guide.topics.forEach(topic => {
        topic.subTopics.forEach(subTopic => {
            // Check for both subTopic.id and a manual mapping if needed
            let contentId = subTopic.id;

            // Adjust for specific ID mappings in the script
            if (guide.id === 'physics' && subTopic.id === 'measurements') contentId = 'measurements-and-units';
            if (guide.id === 'hausa' && subTopic.id === 'grammar') contentId = 'nahawun-hausa';
            if (guide.id === 'history' && subTopic.id === 'pre-colonial') contentId = 'pre-colonial-nigeria';
            if (guide.id === 'phe' && subTopic.id === 'health') contentId = 'health-and-fitness';

            if (contentData[contentId]) {
                subTopic.content = contentData[contentId];
                console.log(`Updated [${guide.subject}] -> ${subTopic.id}`);
            }
        });
    });
};

updateGuide(artGuide);
updateGuide(frenchGuide);
updateGuide(hausaGuide);
updateGuide(historyGuide);
updateGuide(homeEcGuide);
updateGuide(musicGuide);
updateGuide(pheGuide);

fs.writeFileSync(dbPath, JSON.stringify(guides, null, 2));
console.log("Batch 3 (Arts, Languages, History, PHE) populated successfully.");
