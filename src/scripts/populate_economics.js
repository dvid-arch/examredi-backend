
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db', 'guides.json');
const guides = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const economicsGuide = guides.find(g => g.id === 'economics');

if (!economicsGuide) {
    console.error("Economics guide not found!");
    process.exit(1);
}

const contentData = {
    "introduction-to-economics": `## Basic Concepts of Economics
Economics is the study of how society manages its scarce resources to satisfy unlimited human wants.

### Scarcity, Choice, and Opportunity Cost
1. **Scarcity:** The fundamental economic problem where human wants exceed available resources.
2. **Choice:** Because resources are scarce, individuals and societies must choose which wants to satisfy.
3. **Scale of Preference:** A list of unsatisfied wants arranged in order of importance.
4. **Opportunity Cost:** The value of the next best alternative forgone when a choice is made. It is the real cost of a decision.

### Basic Economic Problems of Society
Every society must answer three fundamental questions:
- **What to produce?** (Determining the types and quantities of goods).
- **How to produce?** (Choosing the method of production—labor-intensive vs. capital-intensive).
- **For whom to produce?** (Determining the distribution of the produced goods).`,

    "economic-systems": `## Economic Systems
An economic system is a set of institutional arrangements used to allocate scarce resources.

### 1. Capitalism (Free Market Economy)
- **Features:** Private ownership of resources, price mechanism, competition, and profit motive.
- **Advantages:** Efficiency, innovation, and consumer sovereignty.
- **Disadvantages:** Inequality, monopoly power, and neglect of public goods.

### 2. Socialism (Command Economy)
- **Features:** Public/State ownership, central planning, and social welfare motive.
- **Advantages:** Reduced inequality, full employment, and provision of essentials.
- **Disadvantages:** Inefficiency, lack of incentives, and bureaucracy.

### 3. Mixed Economy
- **Features:** Co-existence of private and public sectors. Most modern economies (including Nigeria) are mixed.`,

    "production": `## Theory of Production
Production is the transformation of raw materials into finished goods to create utility.

### Factors of Production
1. **Land:** Natural resources used in production. Reward: **Rent**.
2. **Labor:** Human effort (physical/mental). Reward: **Wages/Salaries**.
3. **Capital:** Man-made tools and machinery. Reward: **Interest**.
4. **Entrepreneur:** The person who organizes other factors and bears risks. Reward: **Profit**.

### Division of Labor and Specialization
- **Division of Labor:** Breaking down a production process into smaller tasks performed by different individuals.
- **Specialization:** When an individual, firm, or country concentrates on producing a limited range of goods.
- **Benefits:** Increased efficiency, time-saving, and development of skills.`,

    "demand-and-supply": `## Theory of Demand and Supply
Demand and Supply are the two forces that determine the market price of goods.

### 1. Demand
- **Law of Demand:** Other things being equal, the higher the price, the lower the quantity demanded.
- **Determinants:** Price of the good, income of consumers, tastes/preferences, prices of related goods (substitutes/complements).

### 2. Supply
- **Law of Supply:** Other things being equal, the higher the price, the higher the quantity supplied.
- **Determinants:** Cost of production, technology, government policy (taxes/subsidies), weather conditions (for agriculture).

### 3. Market Equilibrium
Equilibrium occurs where the quantity demanded equals the quantity supplied (**Qd = Qs**). The resulting price is the **Market Clearing Price**.`,

    "business-organizations": `## Business Organizations
Different forms of business units that operate in an economy.

### 1. Sole Proprietorship
Owned and managed by one person. Unlimited liability but easy to form and quick decision-making.

### 2. Partnership
Owned by 2 to 20 people. Pooled capital and shared risks.

### 3. Limited Liability Companies (Private/Public)
Legal entities separate from their owners. Liability is limited to the amount invested. Public companies can sell shares on the stock exchange.

### 4. Public Corporations
Owned and funded by the government to provide essential services (e.g., utility companies).`,

    "national-income": `## National Income
National income is the total value of all final goods and services produced in a country in a year.

### Key Concepts
- **GDP (Gross Domestic Product):** Total output produced *within* a country's borders.
- **GNP (Gross National Product):** Total output produced by a country's *citizens* (regardless of location).
- **Real vs. Nominal:** Real income is adjusted for inflation (constant prices), while nominal income uses current prices.

### Methods of Measurement
1. **Income Method:** Summing all incomes (wages, rent, interest, profit).
2. **Output Method:** Summing the value-added at each stage of production.
3. **Expenditure Method:** Summing consumption, investment, government spending, and net exports (C + I + G + [X - M]).`
};

// Update Economics Subtopics
economicsGuide.topics.forEach(topic => {
    topic.subTopics.forEach(subTopic => {
        if (contentData[subTopic.id]) {
            subTopic.content = contentData[subTopic.id];
            console.log(`Updated content for: ${subTopic.id}`);
        }
    });
});

fs.writeFileSync(dbPath, JSON.stringify(guides, null, 2));
console.log("Economics content populated successfully.");
