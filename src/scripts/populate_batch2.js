
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db', 'guides.json');
const guides = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const findGuide = (id, subject) => guides.find(g => g.id === id || g.subject === subject);

const govtGuide = findGuide('government', 'Government');
const crkGuide = findGuide('crk', 'Christian Religious Knowledge (CRK)');
const irkGuide = findGuide('irk', 'Islamic Religious Knowledge (IRK)');
const litGuide = findGuide('literature', 'Literature in English');

const contentData = {
    // Government
    "basic-concepts": `## Basic Concepts of Government
Government is the agency of the state through which its will is expressed and carried out.

### Key Concepts
1. **The State:** A politically organized body of people occupying a definite territory with a sovereign government.
2. **Sovereignty:** The supreme power of the state to make and enforce laws without external interference.
3. **Power:** The ability to influence the behavior of others, often backed by force.
4. **Authority:** The legal right to command and be obeyed.
5. **Legitimacy:** The popular acceptance of a government's right to rule.
6. **Rule of Law:** The principle that everyone, including the government, is subject to the law.
7. **Separation of Powers:** Dividing government powers among the Executive, Legislature, and Judiciary to prevent tyranny.`,

    "forms-of-government": `## Forms and Systems of Government
Different nations adopt different structures based on their history and needs.

### 1. Democracy
Government by the people, for the people.
- **Direct Democracy:** People participate directly in decision-making.
- **Representative Democracy:** People elect officials to represent them.

### 2. Unitary vs. Federal Systems
- **Unitary:** All power is concentrated in the central government (e.g., UK, France).
- **Federal:** Power is shared between the central and regional governments (e.g., Nigeria, USA).

### 3. Presidential vs. Parliamentary
- **Presidential:** The President is both Head of State and Head of Government (Separation of powers).
- **Parliamentary:** The Prime Minister is the Head of Government, while a Monarch or President is the Head of State (Fusion of powers).`,

    // CRK
    "christian-living": `## Christian Living and Ethics
This section explores the practical application of Christian faith in daily life, as taught in the Epistles.

### 1. Justification by Faith
Based on Paul's letter to the Romans, justification is the act of God declaring a sinner righteous through faith in Jesus Christ, not by works of the law.

### 2. Spiritual Gifts and the Fruit of the Spirit
- **Spiritual Gifts:** Abilities given by the Holy Spirit for the building of the Church (e.g., prophecy, healing, wisdom).
- **Fruit of the Spirit:** The character traits produced by the Spirit (Love, Joy, Peace, Patience, Kindness, Goodness, Faithfulness, Gentleness, and Self-control).

### 3. Love (Agāpē)
As described in 1 Corinthians 13, love is the greatest virtue. It is patient, kind, does not envy, and never fails.`,

    "ministry-of-jesus": `## The Ministry of Jesus Christ
Jesus Christ is the central figure of Christianity. His ministry is recorded in the four Gospels.

### Key Events
1. **Baptism:** By John the Baptist in River Jordan, marking the start of his public ministry.
2. **Temptation:** Overcoming trials in the wilderness for 40 days.
3. **Call of the Disciples:** Choosing twelve men to follow him and spread the Gospel.
4. **Miracles:** Signs of God's power (e.g., turning water to wine, healing the sick, raising Lazarus).
5. **Parables:** Stories using earthly examples to teach heavenly truths (e.g., The Prodigal Son, The Good Samaritan).

### The Passion
The suffering, death, and resurrection of Jesus, which Christians believe provided salvation for humanity.`,

    // IRK
    "articles-of-faith": `## Articles of Faith (Iman)
In Islam, faith consists of six fundamental beliefs that every Muslim must hold.

### The Six Articles
1. **Belief in Allah (Tawhid):** The Oneness of God. He has no partners or equals.
2. **Belief in Angels (Mala'ikah):** Created from light to serve Allah (e.g., Jibril for revelation, Mikail for sustenance).
3. **Belief in Holy Books:** The Qur'an (final), Tawrah (Musa), Zabur (Dawud), and Injil (Isa).
4. **Belief in Prophets (Rusul):** Starting from Adam to Muhammad (SAW), the final prophet.
5. **Belief in the Last Day (Yawm al-Qiyamah):** The Day of Judgment and life after death.
6. **Belief in Divine Decree (Qadr):** Everything happens by the will and knowledge of Allah.`,

    // Literature in English
    "drama": `## Introduction to Drama
Drama is a genre of literature meant to be performed on stage. It relies on dialogue and action.

### Key Elements
1. **Plot:** The sequence of events in a play.
2. **Characterization:** The development of characters (Protagonist, Antagonist).
3. **Dialogue:** Conversation between characters.
4. **Stage Directions:** Instructions for actors and directors.

### Types of Drama
- **Tragedy:** Ends in the downfall or death of the protagonist (e.g., Shakespeare's *Hamlet*).
- **Comedy:** Ends happily, often with a wedding or celebration.
- **Tragicomedy:** Contains elements of both tragedy and comedy.
- **Farce:** A comedy characterized by exaggerated and improbable situations.`,

    "poetry": `## Understanding Poetry
Poetry is a form of literature that uses aesthetic and rhythmic qualities of language.

### Literary Devices in Poetry
1. **Simile:** Comparison using "like" or "as" (e.g., *As brave as a lion*).
2. **Metaphor:** Direct comparison (e.g., *Life is a journey*).
3. **Personification:** Giving human qualities to non-human things.
4. **Alliteration:** Repetition of initial consonant sounds.
5. **Onomatopoeia:** Words that imitate sounds (e.g., *buzz, hiss*).

### Forms of Poetry
- **Sonnet:** A 14-line poem with a specific rhyme scheme.
- **Ode:** A poem of praise.
- **Elegy:** A poem mourning the dead.
- **Epic:** A long narrative poem about heroic deeds.`
};

const updateGuide = (guide) => {
    if (!guide) return;
    guide.topics.forEach(topic => {
        topic.subTopics.forEach(subTopic => {
            if (contentData[subTopic.id]) {
                subTopic.content = contentData[subTopic.id];
                console.log(`Updated [${guide.subject}] -> ${subTopic.id}`);
            }
        });
    });
};

updateGuide(govtGuide);
updateGuide(crkGuide);
updateGuide(irkGuide);
updateGuide(litGuide);

fs.writeFileSync(dbPath, JSON.stringify(guides, null, 2));
console.log("Batch 2 (Govt, CRK, IRK, Lit) populated successfully.");
