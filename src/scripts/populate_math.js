
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db', 'guides.json');
const guides = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

let mathGuide = guides.find(g => g.id === 'mathematics' || g.subject === 'Mathematics');

if (!mathGuide) {
    console.log("Mathematics guide not found. Creating placeholder...");
    mathGuide = {
        "id": "mathematics",
        "subject": "Mathematics",
        "lastUpdated": new Date().toISOString().split('T')[0],
        "topics": [
            {
                "id": "number-and-numeration",
                "title": "Number and Numeration",
                "subTopics": [
                    { "id": "number-bases", "title": "Number Bases", "keywords": ["binary", "decimal", "hexadecimal"] },
                    { "id": "fractions-decimals-approximations", "title": "Fractions, Decimals, Approximations", "keywords": ["rounding", "significant figures"] },
                    { "id": "indices-logarithms-surds", "title": "Indices, Logarithms, Surds", "keywords": ["logs", "indices", "roots"] }
                ]
            },
            {
                "id": "algebra",
                "title": "Algebra",
                "subTopics": [
                    { "id": "polynomials", "title": "Polynomials", "keywords": ["equations", "factors"] },
                    { "id": "variation", "title": "Variation", "keywords": ["direct", "inverse"] }
                ]
            },
            {
                "id": "calculus",
                "title": "Calculus",
                "subTopics": [
                    { "id": "differentiation", "title": "Differentiation", "keywords": ["derivative", "rate of change"] },
                    { "id": "integration", "title": "Integration", "keywords": ["integral", "area under curve"] }
                ]
            }
        ]
    };
    guides.push(mathGuide);
}

const contentData = {
    "number-bases": `## Number Bases
Number bases (radix) determine the number of unique digits used to represent numbers.

### Common Bases
- **Base 10 (Decimal):** Uses digits 0-9. Our standard counting system.
- **Base 2 (Binary):** Uses digits 0 and 1. Used in computing.
- **Base 8 (Octal):** Uses digits 0-7.
- **Base 16 (Hexadecimal):** Uses 0-9 and A-F.

### Conversions
1. **From Any Base to Base 10:** Multiply each digit by the base raised to its position power (e.g., $101_2 = 1\\times 2^2 + 0\\times 2^1 + 1\\times 2^0 = 5_{10}$).
2. **From Base 10 to Any Base:** Use successive division by the target base and record the remainders in reverse order.

### Operations
Addition, subtraction, and multiplication in other bases follow the same logic as decimal, but you "carry" or "borrow" based on the base value (e.g., in base 2, $1+1 = 10_2$, carry the 1).`,

    "fractions-decimals-approximations": `## Basic Arithmetic Operations
This section covers foundational concepts for numerical accuracy and business mathematics.

### Approximations and Errors
- **Significant Figures:** The number of important digits in a value (starting from the first non-zero digit).
- **Decimal Places:** The number of digits after the decimal point.
- **Percentage Error:** $\\frac{|Approximate - Exact|}{Exact} \\times 100\\%$.

### Business Mathematics
- **Simple Interest:** $I = \\frac{P \\times R \\times T}{100}$.
- **Profit and Loss:** 
  - Profit % = $\\frac{SP - CP}{CP} \\times 100\\%$.
  - Loss % = $\\frac{CP - SP}{CP} \\times 100\\%$.
- **Ratio and Proportion:** Comparing two or more quantities.
- **VAT (Value Added Tax):** A consumption tax added to the price of goods.`,

    "indices-logarithms-surds": `## Indices, Logarithms, and Surds
These are essential tools for simplifying complex algebraic expressions.

### Laws of Indices
1. $a^m \\times a^n = a^{m+n}$
2. $a^m / a^n = a^{m-n}$
3. $(a^m)^n = a^{mn}$
4. $a^0 = 1$
5. $a^{-n} = \\frac{1}{a^n}$

### Logarithms
Logarithms are the inverse of indices. If $y = a^x$, then $\\log_a y = x$.
- **Product Law:** $\\log a + \\log b = \\log(ab)$
- **Division Law:** $\\log a - \\log b = \\log(a/b)$
- **Power Law:** $\\log a^n = n\\log a$

### Surds
Surds are irrational numbers expressed with a square root symbol ($\\sqrt{n}$).
- **Simplification:** $\\sqrt{72} = \\sqrt{36 \\times 2} = 6\\sqrt{2}$.
- **Rationalization:** Removing the surd from the denominator (e.g., multiply top and bottom by $\\sqrt{n}$).`,

    "polynomials": `## Polynomials
A polynomial is an expression consisting of variables and coefficients.

### Remainder and Factor Theorems
- **Remainder Theorem:** If a polynomial $f(x)$ is divided by $(x - a)$, the remainder is $f(a)$.
- **Factor Theorem:** If $f(a) = 0$, then $(x - a)$ is a factor of $f(x)$.

### Quadratic Functions
General form: $ax^2 + bx + c = 0$.
- **Solving:** Factorization, completing the square, or the quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.
- **Discriminant ($D = b^2 - 4ac$):**
  - $D > 0$: Two real, distinct roots.
  - $D = 0$: Two real, equal roots.
  - $D < 0$: No real roots (complex).`,

    "variation": `## Theory of Variation
Variation describes how one quantity changes in relation to another.

### Types of Variation
1. **Direct Variation:** $y \\propto x$ (or $y = kx$). As $x$ increases, $y$ increases.
2. **Inverse Variation:** $y \\propto \\frac{1}{x}$ (or $y = \\frac{k}{x}$). As $x$ increases, $y$ decreases.
3. **Joint Variation:** $y$ varies directly with two or more variables (e.g., $y = kxz$).
4. **Partial Variation:** $y$ is a sum of two parts (e.g., $y = a + kx$).`,

    "differentiation": `## Calculus: Differentiation
Differentiation measures the "rate of change" of a function.

### Basic Rules
- **Power Rule:** If $y = x^n$, then $\\frac{dy}{dx} = nx^{n-1}$.
- **Constant Rule:** If $y = c$, then $\\frac{dy}{dx} = 0$.
- **Sum Rule:** $\\frac{d}{dx}(u + v) = \\frac{du}{dx} + \\frac{dv}{dx}$.

### Applications
- **Gradient:** The derivative $\\frac{dy}{dx}$ gives the slope (gradient) of the tangent to the curve at a point.
- **Turning Points:** At maximum or minimum points, $\\frac{dy}{dx} = 0$.
- **Velocity and Acceleration:** If $s$ is displacement, $v = \\frac{ds}{dt}$ and $a = \\frac{dv}{dt}$.`,

    "integration": `## Calculus: Integration
Integration is the reverse process of differentiation (anti-derivative).

### Basic Rules
- **Power Rule:** $\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$ (where $n \\neq -1$).
- **Sum Rule:** $\\int (u + v) dx = \\int u dx + \\int v dx$.

### Definite Integration
A definite integral has limits: $\\int_{a}^{b} f(x) dx = [F(x)]_{a}^{b} = F(b) - F(a)$.
- **Application:** Used to find the **area under a curve** between two points on the x-axis.`
};

// Update Math Subtopics
mathGuide.topics.forEach(topic => {
    topic.subTopics.forEach(subTopic => {
        if (contentData[subTopic.id]) {
            subTopic.content = contentData[subTopic.id];
            console.log(`Updated content for: ${subTopic.id}`);
        }
    });
});

fs.writeFileSync(dbPath, JSON.stringify(guides, null, 2));
console.log("Mathematics content populated successfully.");
