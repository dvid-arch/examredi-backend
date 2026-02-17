
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db', 'guides.json');
const guides = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const findGuide = (id, subject) => guides.find(g => g.id === id || g.subject === subject);

const agriGuide = findGuide('agriculture', 'Agriculture');
const commGuide = findGuide('commerce', 'Commerce');
const csGuide = findGuide('computer-studies', 'Computer Studies');
const geogGuide = findGuide('geography', 'Geography');

const contentData = {
    // Agriculture
    "importance-of-agric": `## Importance of Agriculture
Agriculture is the mainstay of many economies, especially in West Africa. It involves the cultivation of crops and the rearing of animals for human use.

### Economic Importance
1. **Food Security:** Provides essential nutrients for the population.
2. **Income Generation:** Source of livelihood for farmers and traders.
3. **Foreign Exchange:** Income from exporting crops like Cocoa, Rubber, and Oil Palm.
4. **Raw Materials:** Supplies industries (e.g., cotton for textiles, timber for furniture).
5. **Employment:** Employs a large percentage of the working population.

### Problems of Agricultural Development
- Land tenure systems (fragmentation of land).
- Lack of basic amenities in rural areas.
- Poor transportation and storage facilities.
- Inadequate finance and credit.
- Use of crude tools and traditional methods.`,

    // Commerce
    "transport-and-communication": `## Transport and Communication in Commerce
Transport and communication are vital "Aids to Trade" that bridge the gap between producers and consumers.

### 1. Transport
Transport involves the physical movement of goods and people.
- **Land:** Road (flexible, door-to-door) and Rail (suitable for heavy/bulky goods over long distances).
- **Water:** Inland (rivers/lakes) and Sea (Ocean liners for scheduled routes, Tramps for unscheduled).
- **Air:** Fastest but most expensive; used for perishables and high-value items.
- **Pipeline:** For liquids (oil/water) and gases.

### 2. Communication
Communication is the exchange of information between buyers and sellers.
- **Postal Services:** Letters, parcels, and express mail.
- **Telecommunication:** Telephone (GSM), Internet, and Email.
- **Importance:** Facilitates quick decision-making, reduces travel costs, and expands market reach.`,

    "banking": `## Banking and Finance
Banks are financial institutions that accept deposits and provide credit to individuals and businesses.

### 1. Commercial Banks
- **Functions:** Accepting deposits (current, savings, fixed), lending money, providing safe custody for valuables, and facilitating payments.
- **Credit Creation:** Commercial banks expand the money supply through lending.

### 2. Central Bank
The apex financial institution in a country (e.g., Central Bank of Nigeria - CBN).
- **Functions:** Issuing currency, banker to the government, banker to commercial banks, and controlling monetary policy to ensure price stability.

### 3. Specialized Banks
- **Development Banks:** Provide long-term loans for agriculture or industry.
- **Microfinance Banks:** Provide small loans and financial services to low-income earners.`,

    // Computer Studies
    "computer-basics": `## Introduction to Computers
A computer is an electronic device that accepts data as input, processes it, and gives out information as output.

### Components of a Computer
1. **Hardware:** Physical parts (CPU, monitor, keyboard, mouse).
   - **Input Devices:** Mouse, Keyboard, Scanner.
   - **Output Devices:** Monitor, Printer, Speaker.
   - **Storage:** Hard Disk, SSD, Flash Drive.
2. **Software:** Programs that tell the hardware what to do.
   - **System Software:** Operating Systems (Windows, macOS, Linux).
   - **Application Software:** Word processors, Browsers, Games.

### Computer Generations
- **1st:** Vacuum Tubes (Huge, hot).
- **2nd:** Transistors (Smaller, faster).
- **3rd:** Integrated Circuits (ICs).
- **4th:** Microprocessors (VLSIC).
- **5th:** Artificial Intelligence (AI) and Robotics.`,

    "information-processing": `## Information Processing and Security
Information processing is the transformation of data into a usable form.

### The Data Processing Cycle
1. **Input:** Collecting raw data.
2. **Processing:** Manipulating data (calculating, sorting).
3. **Storage:** Keeping data for future use.
4. **Output:** Displaying the results.

### Data Security
Protecting data from unauthorized access, alteration, or destruction.
- **Threats:** Viruses, Hacking, Cracking, and Hardware failure.
- **Prevention:** Antivirus software, Firewalls, Encryption (scrambling data), and regular Backups.
- **Ethics:** Avoiding plagiarism, respecting privacy, and obeying cyber laws.`,

    // Geography
    "climate-and-vegetation": `## Climate and Vegetation
Climate is the average atmospheric condition of a place over a long period (usually 35 years).

### Elements of Weather and Climate
- **Temperature:** Measured with a thermometer.
- **Rainfall:** Measured with a rain gauge.
- **Pressure:** Measured with a barometer.
- **Wind Speed:** Measured with an anemometer.
- **Humidity:** Measured with a hygrometer.

### Major Climate Types
1. **Equatorial:** Hot and wet all year (e.g., Amazon Basin).
2. **Tropical Continental (Savanna):** Distinct wet and dry seasons.
3. **Desert:** Very hot days, cold nights, very low rainfall.
4. **Mediterranean:** Hot, dry summers and mild, wet winters.

### Vegetation Zones
- **Rainforest:** Tall trees, evergreen, multiple layers.
- **Savanna:** Grasslands with scattered trees.
- **Desert Vegetation:** Succulent plants (cacti) and thorny shrubs.`
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

updateGuide(agriGuide);
updateGuide(commGuide);
updateGuide(csGuide);
updateGuide(geogGuide);

fs.writeFileSync(dbPath, JSON.stringify(guides, null, 2));
console.log("Batch 1 (Agric, Commerce, CS, Geog) populated successfully.");
