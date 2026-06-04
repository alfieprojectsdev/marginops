I am building a Next.js (App Router) + Tailwind CSS dashboard prototype called 'MarginOps'. It is a sales enablement tool designed to show a 'Calm Web' executive summary of marketing profitability. Please generate a sleek, minimalist, single-page layout. I need three main metric cards at the top: Blended CAC, LTV, and Blended ROAS. Below that, create a mock PostgreSQL schema (using Prisma) that simulates data coming from Meta Ads, Google Ads, TikTok Ads, and Shopify, and write the logic that merges them to calculate those top three metrics.

---

## more details:

### I. Architecture Decision Records (ADRs)

**ADR 1: Frontend Framework & UI Styling**

* **Context:** The prototype needs to be lightweight, modern, and visually impressive for a sales demo. It must adhere to a "Calm Web" design philosophy to avoid overwhelming clients with cluttered interfaces.
* **Decision:** We will use **Next.js** for the React framework and **Tailwind CSS** for styling.
* **Rationale:** Next.js allows for rapid prototyping with server-side rendering capabilities if needed later. Tailwind provides utility classes to easily implement a clean, minimalist UI that highlights critical metrics without the bloat of standard template libraries.
* **Status:** Accepted.

**ADR 2: Data Handling & Storage (Prototype Phase)**

* **Context:** As a sales enablement prototype, the dashboard does not initially require live data pipelines from client accounts, which would require extensive engineering and API approvals.
* **Decision:** We will use **PostgreSQL** to store mock data that accurately reflects typical outputs from Google Ads, Meta Ads, Shopify, and TikTok.
* **Rationale:** Using a real relational database for the prototype allows the sales team to demonstrate dynamic filtering and realistic loading states. It also sets up a smooth transition to live data pipelines (billable consulting hours) once the accounts team lands a client.
* **Status:** Accepted.

**ADR 3: Conflict of Interest Mitigation (SAVD Boundaries)**

* **Context:** To protect your current contractual agreements (SAVD), the architecture and features must not cross established "red lines."
* 
**Decision:** The dashboard will explicitly avoid implementing agentic workflows, direct Google Ads AI automation tools, or using LangGraph. We will also use distinct data visualization patterns that do not replicate proprietary SAVD designs.


* 
**Rationale:** This ensures complete legal compliance and respects your existing client boundaries while still delivering a high-value analytics visualization tool for the Philippine market.


* **Status:** Accepted.

---

### II. Dashboard Prototype Specifications

**Objective:** Build a tangible, minimalist asset for the sales team to show clients during pitches, demonstrating how integrated data provides actionable insights.

**Data Integrations (Simulated):**

* Google Ads
* Meta Ads
* TikTok Ads
* Shopify (Direct-to-Consumer)

**Key Metrics Displayed (The "Matter" Metrics):**

* **CAC (Customer Acquisition Cost):** Blended across ad platforms.
* **LTV (Customer Lifetime Value):** Pulled from Shopify mock data.
* **ROAS (Return on Ad Spend):** Highlighting the true return across the integrated platforms.

**UI/UX Requirements:**

* **Calm Web Philosophy:** No flashing red numbers or overwhelming dials.
* **Executive View:** High-clarity, top-level summaries that a marketing executive or business owner can understand in 5 seconds.
* **Interactive Filters:** Basic date-range and platform toggles to demonstrate the dashboard's responsiveness during a pitch.

---

I am building a Next.js (App Router) + Tailwind CSS dashboard prototype called 'MarginOps'. It is a sales enablement tool designed to show a 'Calm Web' executive summary of marketing profitability. Please generate a sleek, minimalist, single-page layout. I need three main metric cards at the top: Blended CAC, LTV, and Blended ROAS. Below that, create a mock PostgreSQL schema (using Prisma) that simulates data coming from Meta Ads, Google Ads, TikTok Ads, and Shopify, and write the logic that merges them to calculate those top three metrics.

git@github.com:alfieprojectsdev/marginops.git


