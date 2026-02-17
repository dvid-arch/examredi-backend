
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db', 'guides.json');
const guides = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const chemistryGuide = guides.find(g => g.id === 'chemistry');

if (!chemistryGuide) {
    console.error("Chemistry guide not found!");
    process.exit(1);
}

const contentData = {
    "separation-of-mixtures": `## Separation of Mixtures
A mixture consists of two or more substances that are physically combined. Pure substances have fixed boiling and melting points, while mixtures do not.

### Techniques for Separation
1. **Filtration:** Separating an insoluble solid from a liquid (e.g., sand from water).
2. **Evaporation:** Recovering a soluble solid from a liquid by heating the liquid until it evaporates.
3. **Crystallization:** Obtaining pure crystals from a saturated solution.
4. **Distillation:** Separating a liquid from a solution by boiling and condensation.
   - **Fractional Distillation:** Separating miscible liquids with different boiling points (e.g., crude oil).
5. **Chromatography:** Separating components of a mixture based on their different rates of movement through a medium (e.g., dyes/inks).
6. **Sublimation:** Separating a substance that changes directly from solid to gas (e.g., iodine, ammonium chloride).`,

    "atomic-structure-and-bonding": `## Atomic Structure and Chemical Bonding
Matter is composed of tiny particles called atoms.

### The Atom
Atoms consist of three sub-atomic particles:
- **Protons ($p^+$):** Positively charged, found in the nucleus.
- **Neutrons ($n^0$):** Neutral, found in the nucleus.
- **Electrons ($e^-$):** Negatively charged, orbit the nucleus in shells.

### Isotopes
Atoms of the same element with the same number of protons but different number of neutrons (e.g., $Carbon-12$ and $Carbon-14$).

### Chemical Bonding
1. **Ionic (Electrovalent) Bond:** Transfer of electrons from a metal to a non-metal (e.g., $NaCl$).
2. **Covalent Bond:** Sharing of electrons between non-metals (e.g., $H_2O, CO_2$).
3. **Metallic Bond:** Attraction between positive metal ions and a "sea" of delocalized electrons.
4. **Hydrogen Bond:** A weak attraction between a hydrogen atom and a highly electronegative atom ($F, O, N$).`,

    "stoichiometry": `## Stoichiometry: The Mole Concept
Stoichiometry is the study of the quantitative relationships between reactants and products in a chemical reaction.

### The Mole
A mole is the amount of substance containing $6.02 \\times 10^{23}$ particles (Avogadro's constant).
- $Mole = \\frac{Mass}{Molar Mass}$
- $Mole = \\frac{Number of Particles}{6.02 \\times 10^{23}}$
- $Mole = \\frac{Volume of Gas}{22.4 dm^3}$ (at STP)

### Empirical and Molecular Formulae
- **Empirical Formula:** The simplest whole-number ratio of atoms in a compound.
- **Molecular Formula:** The actual number of atoms of each element in a molecule ($MF = (EF)_n$).`,

    "states-of-matter": `## States of Matter and Gas Laws
Matter exists in three main states: Solid, Liquid, and Gas.

### Kinetic Theory of Matter
- Matter is composed of tiny particles in constant motion.
- Temperature is a measure of the average kinetic energy of the particles.
- Solid (low energy, fixed shape), Liquid (moderate energy, flows), Gas (high energy, expands).

### Gas Laws
1. **Boyle's Law:** Volume is inversely proportional to pressure ($P_1V_1 = P_2V_2$).
2. **Charles' Law:** Volume is directly proportional to absolute temperature ($\\frac{V_1}{T_1} = \\frac{V_2}{T_2}$).
3. **Graham's Law of Diffusion:** The rate of diffusion of a gas is inversely proportional to the square root of its density.`,

    "acids-bases-salts": `## Acids, Bases, and Salts
These are fundamental classes of chemical compounds.

### 1. Acids
- **Definitions:** Donate protons ($H^+$) or produce $H_3O^+$ in water.
- **Types:** Organic (e.g., Citric) and Inorganic (e.g., $HCl, H_2SO_4$).
- **Properties:** Sour taste, turn blue litmus red.

### 2. Bases and Alkalis
- **Definitions:** Accept protons or produce $OH^-$ in water. Soluble bases are called **alkalis**.
- **Properties:** Bitter taste, soapy feel, turn red litmus blue.

### 3. pH Scale
Measures acidity or alkalinity (0-14). 
- pH < 7: Acidic
- pH = 7: Neutral
- pH > 7: Basic

### 4. Salts
Formed by the neutralization reaction: $Acid + Base \\rightarrow Salt + Water$.`
};

// Update Chemistry Subtopics
chemistryGuide.topics.forEach(topic => {
    topic.subTopics.forEach(subTopic => {
        if (contentData[subTopic.id]) {
            subTopic.content = contentData[subTopic.id];
            console.log(`Updated content for: ${subTopic.id}`);
        }
    });
});

fs.writeFileSync(dbPath, JSON.stringify(guides, null, 2));
console.log("Chemistry content populated successfully.");
