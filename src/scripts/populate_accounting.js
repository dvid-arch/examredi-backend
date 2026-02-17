
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db', 'guides.json');
const guides = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const accountingGuide = guides.find(g => g.id === 'accounting');

if (!accountingGuide) {
    console.error("Accounting guide not found!");
    process.exit(1);
}

const contentData = {
    "nature-of-accounting": `## Introduction to Accounting
Accounting is the process of identifying, measuring, and communicating economic information to permit informed judgments and decisions by users of the information. It is often referred to as the "language of business."

### History of Accounting
Accounting has evolved over centuries. Notable milestones include:
- **Ancient Civilizations:** Record-keeping in Mesopotamia, Egypt, and Babylon.
- **Double-Entry System:** Formally documented by **Luca Pacioli** (the "Father of Accounting") in 1494.
- **Industrial Revolution:** Led to the need for more complex financial reporting and the rise of the auditing profession.

### Users of Accounting Information
1. **Internal Users:**
   - Management (to plan and control business operations).
   - Employees (to assess job security and profitability).
2. **External Users:**
   - Investors (to decide whether to buy or sell shares).
   - Lenders/Creditors (to assess creditworthiness).
   - Government and Regulatory bodies (for taxation and compliance).
   - Customers and the Public.

### Accounting Concepts and Conventions
To ensure consistency, accountants follow certain rules:
- **Going Concern:** Assuming the business will continue to operate for the foreseeable future.
- **Accrual Concept:** Recording transactions when they occur, not just when cash changes hands.
- **Consistency:** Using the same methods from one period to the next.
- **Prudence (Conservatism):** Not overstating assets or income, and not understating liabilities or expenses.
- **Materiality:** Focusing on information significant enough to influence decisions.`,

    "bookkeeping": `## The Art of Bookkeeping
Bookkeeping is the systematic recording of financial transactions in the books of account. It is the foundation upon which accounting is built.

### The Double-Entry Principle
The core of modern bookkeeping is the double-entry system, which states that for every debit entry, there must be a corresponding credit entry.
- **Debit (Dr):** Left side of an account. Represents increases in assets/expenses or decreases in liabilities/income.
- **Credit (Cr):** Right side of an account. Represents increases in liabilities/income or decreases in assets/expenses.

### Subsidiary Books (Books of Original Entry)
Transactions are first recorded in these books before being posted to the ledger:
1. **Sales Journal:** For credit sales of goods.
2. **Purchases Journal:** For credit purchases of goods.
3. **Return Inwards Journal:** For goods returned by customers.
4. **Return Outwards Journal:** For goods returned to suppliers.
5. **Cash Book:** For all cash and bank transactions (Single, Double, or Three-column).
6. **General Journal:** For unusual transactions like opening entries or purchase of fixed assets.

### The Ledger
The ledger is the principal book of accounts where individual accounts are maintained.
- **Personal Accounts:** Accounts for people or businesses (e.g., Debtors, Creditors).
- **Impersonal Accounts:** 
  - **Real Accounts:** Tangible assets (e.g., Land, Machinery, Cash).
  - **Nominal Accounts:** Income, expenses, gains, and losses (e.g., Rent, Salaries, Sales).`,

    "trial-balance": `## The Trial Balance
A Trial Balance is a list of all general ledger accounts (both revenue and capital) contained in the ledger of a business. This list will contain the name of each nominal ledger account and the value of that nominal ledger balance. 

### Purpose of a Trial Balance
1. To check the arithmetical accuracy of the double-entry bookkeeping.
2. To provide a starting point for preparing financial statements.
3. To summarize all the balances in one place.

### Errors in the Trial Balance
While a balanced Trial Balance suggests accurate double-entry, certain errors may still exist:
1. **Error of Omission:** A transaction is completely left out.
2. **Error of Commission:** Posting to the wrong person's account (e.g., Debtors A instead of Debtors B).
3. **Error of Principle:** Posting to the wrong class of account (e.g., Motor vehicle repairs posted to Motor vehicle asset account).
4. **Error of Original Entry:** The initial amount was recorded incorrectly (e.g., 500 instead of 50).
5. **Compensating Errors:** Two or more errors cancel each other out.
6. **Complete Reversal of Entry:** Debit and credit were swapped.

### The Suspense Account
If the Trial Balance doesn't balance, the difference is temporarily placed in a **Suspense Account** until the errors are found and corrected using Journal Entries.`,

    "adjustments": `## Accounting Adjustments
At the end of an accounting period, adjustments are necessary to ensure the financial statements accurately reflect the business's position. This follows the **Accrual** and **Matching** concepts.

### 1. Accruals and Prepayments
- **Accrued Expenses:** Expenses incurred but not yet paid (Liability).
- **Prepaid Expenses:** Expenses paid in advance but not yet consumed (Asset).
- **Accrued Income:** Income earned but not yet received (Asset).
- **Prepaid Income:** Income received in advance but not yet earned (Liability).

### 2. Depreciation
Depreciation is the systematic allocation of the cost of a tangible asset over its useful life.
- **Methods:**
  - **Straight Line:** (Cost - Residual Value) / Useful Life.
  - **Reducing Balance:** A fixed percentage applied to the book value each year.
- **Accounting Entry:** 
  - Dr. Profit and Loss Account
  - Cr. Provision for Depreciation Account

### 3. Bad Debts and Provisions
- **Bad Debts:** Debts that are definitely uncollectible and are written off.
- **Provision for Doubtful Debts:** An estimate of potential future bad debts, reducing the value of Trade Debtors in the Balance Sheet.`,

    "partnership": `## Partnership Accounts
A partnership is an association between two or more persons (usually up to 20) carrying on a business with a view to profit.

### The Partnership Deed
A formal agreement (oral or written) that outlines:
- Profit-sharing ratios.
- Interest on capital.
- Interest on drawings.
- Partners' salaries.
- Procedure for admitting or retiring partners.

### Financial Statements in Partnership
1. **Trading, Profit and Loss Account:** Same as a sole trader.
2. **Appropriation Account:** Shows how the net profit is shared among partners after salaries, interest on capital, and interest on drawings.
3. **Partners' Capital and Current Accounts:** 
   - **Fixed Capital Method:** Capital remains fixed; all adjustments go into a Current Account.
   - **Fluctuating Capital Method:** All adjustments go directly into the Capital Account.

### Admissions and Dissolution
When a new partner joins or the partnership ends, assets may need to be **Revalued**. The difference is recorded in a **Revaluation Account**. **Goodwill** (the reputation/brand value) might also be recognized.`,

    "bank-reconciliation": `## Bank Reconciliation
A Bank Reconciliation Statement is prepared to explain the difference between the balance in the company's Cash Book (bank column) and the balance shown on the Bank Statement.

### Reasons for Differences
1. **Timing Differences:**
   - **Unpresented Cheques:** Issued by the business but not yet presented at the bank by the recipient.
   - **Uncredited Lodgments:** Deposited at the bank but not yet reflected on the statement.
2. **Items on Bank Statement but not in Cash Book:**
   - Bank charges and interest.
   - Direct credits (e.g., dividends).
   - Standing orders or Direct debits.
   - Dishonoured cheques.
3. **Errors:** Made by either the business or the bank.

### Steps to Reconcile
1. Update the Cash Book with known items (Bank charges, direct credits).
2. Start the Reconciliation Statement with the **Adjusted Cash Book Balance** or the **Balance as per Bank Statement**.
3. Add Unpresented Cheques.
4. Deduct Uncredited Lodgments.
5. Ensure the final balance matches the other record.`
};

// Update Accounting Subtopics
accountingGuide.topics.forEach(topic => {
    topic.subTopics.forEach(subTopic => {
        if (contentData[subTopic.id]) {
            subTopic.content = contentData[subTopic.id];
            console.log(`Updated content for: ${subTopic.id}`);
        }
    });
});

fs.writeFileSync(dbPath, JSON.stringify(guides, null, 2));
console.log("Accounting content populated successfully.");
