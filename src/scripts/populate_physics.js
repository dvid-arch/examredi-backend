
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db', 'guides.json');
const guides = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const physicsGuide = guides.find(g => g.id === 'physics');

if (!physicsGuide) {
    console.error("Physics guide not found!");
    process.exit(1);
}

const contentData = {
    "measurements-and-units": `## Measurements and Units
Physics is a science of measurement. Everything we study is expressed in terms of physical quantities.

### Fundamental and Derived Quantities
1. **Fundamental Quantities:** These are basic quantities that do not depend on other quantities.
   - Length (Metre, m)
   - Mass (Kilogram, kg)
   - Time (Second, s)
   - Temperature (Kelvin, K)
   - Electric Current (Ampere, A)
2. **Derived Quantities:** These are obtained by combining fundamental ones.
   - Area ($m^2$)
   - Volume ($m^3$)
   - Speed ($m/s^1$)
   - Force (Newton, $kg\\cdot m/s^2$)

### Dimensions
Dimensions show the relationship between a physical quantity and the fundamental quantities ($L, M, T$).
- Velocity: $[LT^{-1}]$
- Acceleration: $[LT^{-2}]$
- Force: $[MLT^{-2}]$`,

    "motion": `## Linear and Projectile Motion
Motion is a change in position with time.

### Equations of Linear Motion
For constant acceleration ($a$):
1. $v = u + at$
2. $s = ut + \\frac{1}{2}at^2$
3. $v^2 = u^2 + 2as$

### Types of Motion
- **Random:** Irregular path (e.g., smoke particles).
- **Translational:** Moving from one point to another.
- **Rotational:** Moving around an axis.
- **Oscillatory:** To-and-fro movement (e.g., pendulum).

### Projectile Motion
Motion of an object thrown into the air, subject only to gravity.
- **Range ($R$):** The horizontal distance covered.
- **Maximum Height ($H$):** The vertical distance at the peak.
- **Time of Flight ($T$):** Total time in the air.`,

    "energy-work-power": `## Work, Energy, and Power
These concepts describe how forces interact with matter to cause change.

### Definitions
- **Work:** Done when a force moves an object through a distance ($W = F \\cdot d$). Unit: **Joule (J)**.
- **Energy:** The capacity to do work.
  - **Kinetic Energy:** Energy of motion ($KE = \\frac{1}{2}mv^2$).
  - **Potential Energy:** Stored energy due to position ($PE = mgh$).
- **Power:** The rate of doing work ($P = \\frac{W}{t}$). Unit: **Watt (W)**.

### Conservation of Energy
Energy cannot be created or destroyed; it can only be transformed from one form to another. In a closed system, the total energy remains constant.`,

    "heat-expansion": `## Heat and Temperature
Heat is a form of energy that flows from hot to cold bodies.

### Temperature Scales
- **Celsius ($^\\circ C$):** Based on the freezing and boiling points of water.
- **Kelvin ($K$):** The absolute scale ($K = ^\\circ C + 273$).

### Thermal Expansion
Most materials expand when heated.
- **Linear Expansivity ($\\alpha$):** Change in length per unit length per degree change in temperature.
- **Area Expansivity ($\\beta = 2\\alpha$)**
- **Volume Expansivity ($\\gamma = 3\\alpha$)**

### Gas Laws
- **Boyle's Law:** $P_1V_1 = P_2V_2$ (Constant Temperature).
- **Charles' Law:** $\\frac{V_1}{T_1} = \\frac{V_2}{T_2}$ (Constant Pressure).
- **General Gas Equation:** $\\frac{P_1V_1}{T_1} = \\frac{P_2V_2}{T_2}$.`,

    "waves-sound-light": `## Wave Motion and Optics
Waves transfer energy without transferring matter.

### Wave Properties
1. **Reflection:** Bouncing back from a surface.
2. **Refraction:** Bending as a wave enters a new medium.
3. **Diffraction:** Bending around obstacles.
4. **Interference:** Overlapping of waves.

### Sound
A longitudinal mechanical wave. Its speed depends on the medium (fastest in solids, slowest in gases).

### Light and Optics
Light behaves as both a wave and a particle.
- **Reflection:** Plane and curved mirrors.
- **Refraction:** Lenses (Converging and Diverging).
- **Dispersion:** Splitting of white light into a spectrum by a prism.`,

    "current-electricity": `## Electricity and Magnetism
Current electricity is the flow of electric charge (electrons) through a conductor.

### Ohm's Law
The current ($I$) through a conductor is directly proportional to the potential difference ($V$) across it, provided physical conditions (like temperature) remain constant.
- **$V = IR$**

### Circuits
- **Series:** Current is the same everywhere ($R_{total} = R_1 + R_2 + \\dots$).
- **Parallel:** Voltage is the same across branches ($\\frac{1}{R_{total}} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\dots$).

### Electrical Power
- $P = IV = I^2R = \\frac{V^2}{R}$.`
};

// Update Physics Subtopics
physicsGuide.topics.forEach(topic => {
    topic.subTopics.forEach(subTopic => {
        if (contentData[subTopic.id]) {
            subTopic.content = contentData[subTopic.id];
            console.log(`Updated content for: ${subTopic.id}`);
        }
    });
});

fs.writeFileSync(dbPath, JSON.stringify(guides, null, 2));
console.log("Physics content populated successfully.");
