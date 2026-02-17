
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db', 'guides.json');
const guides = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const biologyGuide = guides.find(g => g.id === 'biology');

if (!biologyGuide) {
    console.error("Biology guide not found!");
    process.exit(1);
}

const contentData = {
    "life-and-cells": `## The Nature of Life and Cells
Biology is the study of life. All living things share common characteristics and are made of units called cells.

### Characteristics of Life (MR NIGER D)
1. **Movement:** Ability to change position.
2. **Respiration:** Releasing energy from food.
3. **Nutrition:** Obtaining energy and materials.
4. **Irritability:** Responding to stimuli.
5. **Growth:** Permanent increase in size/complexity.
6. **Excretion:** Removal of metabolic waste.
7. **Reproduction:** Creating offspring.
8. **Death:** All organisms eventually die.

### The Cell Theory
- All living things are composed of cells.
- The cell is the basic structural and functional unit of life.
- New cells arise from pre-existing cells.

### Cell Organelles
- **Nucleus:** Contains genetic material (DNA).
- **Mitochondria:** Site of aerobic respiration (Powerhouse).
- **Chloroplasts:** Site of photosynthesis (only in plants).
- **Cell Wall:** Provides support (only in plants).
- **Cell Membrane:** Controls what enters and leaves the cell.`,

    "classification-of-organisms": `## Classification of Organisms
Classification is the arrangement of organisms into groups based on their similarities.

### Hierarchy of Classification
1. Kingdom (The broadest group)
2. Phylum
3. Class
4. Order
5. Family
6. Genus
7. Species (The basic unit)

### The Five Kingdoms
1. **Kingdom Monera:** Prokaryotes (e.g., bacteria).
2. **Kingdom Protista:** Unicellular eukaryotes (e.g., Amoeba).
3. **Kingdom Fungi:** Saprophytes (e.g., Mushrooms, yeast).
4. **Kingdom Plantae:** Multicellular autotrophs.
5. **Kingdom Animalia:** Multicellular heterotrophs.

### Binomial Nomenclature
A two-name system for naming species (e.g., *Homo sapiens*). The first name is the **Genus** (capitalized) and the second is the **Species** (lowercase).`,

    "transport-systems": `## Transport in Living Organisms
Transport involves moving materials (nutrients, gases, waste) within an organism.

### Transport in Plants
- **Xylem:** Conducts water and minerals from roots to leaves.
- **Phloem:** Conducts manufactured food (glucose) from leaves to other parts.
- **Transpiration:** Loss of water vapor from leaves through stomata.

### Transport in Animals
- **Blood Components:**
  - **Plasma:** Liquid part that carries nutrients/hormones.
  - **Red Blood Cells:** Carry oxygen using hemoglobin.
  - **White Blood Cells:** Fight infections.
  - **Platelets:** Help in blood clotting.
- **Circulatory Systems:**
  - **Open:** Blood flows into body cavities (e.g., insects).
  - **Closed:** Blood is confined to vessels (e.g., earthworms, mammals).`,

    "respiration": `## Respiration
Respiration is the metabolic process by which cells break down food to release energy (in the form of ATP).

### Types of Respiration
1. **Aerobic Respiration:** Occurs in the presence of oxygen.
   - $C_6H_{12}O_6 + 6O_2 \\rightarrow 6CO_2 + 6H_2O + Energy$
2. **Anaerobic Respiration:** Occurs without oxygen (e.g., fermentation in yeast or lactic acid production in muscles).

### Respiratory Organs
- Gills (Fish)
- Lungs (Mammals, Reptiles, Birds)
- Trachea (Insects)
- Skin (Earthworms, Amphibians)
- Stomata (Plants)`,

    "heredity-and-genetics": `## Heredity and Genetics
Genetics is the study of how traits are passed from parents to offspring.

### Basic Terms
- **Gene:** The unit of inheritance.
- **Allele:** Alternative forms of a gene.
- **Genotype:** The genetic makeup of an organism (e.g., TT, Tt).
- **Phenotype:** The physical appearance (e.g., Tall, Short).
- **Dominant:** Allele that masks the effect of another.
- **Recessive:** Allele whose effect is masked.

### Mendel's Laws
1. **Law of Segregation:** During gamete formation, alleles separate so each gamete carries only one.
2. **Law of Independent Assortment:** Genes for different traits can segregate independently during the formation of gametes.

### Variations
- **Continuous:** Range of values (e.g., height, weight).
- **Discontinuous:** Distinct categories (e.g., blood group, ability to roll tongue).`
};

// Update Biology Subtopics
biologyGuide.topics.forEach(topic => {
    topic.subTopics.forEach(subTopic => {
        if (contentData[subTopic.id]) {
            subTopic.content = contentData[subTopic.id];
            console.log(`Updated content for: ${subTopic.id}`);
        }
    });
});

fs.writeFileSync(dbPath, JSON.stringify(guides, null, 2));
console.log("Biology content populated successfully.");
