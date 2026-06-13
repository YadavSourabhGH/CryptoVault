# CryptoVault Pricing & Financial Analysis

This document outlines the business model, operational expenses, AWS hosting costs (in INR), and financial projections for **CryptoVault**.

---

## 1. Business Model Canvas (BMC)

### Value Proposition
* **Risk-Free Simulated Trading**: High-fidelity paper trading engine mimicking real crypto exchange matching algorithms.
* **Advanced Order Book**: Supports real-time matching of Limit and Market orders.
* **Educational Value**: Safe, gamified environment with simulated funds (10,000 USDT) for beginner traders and groups.

### Customer Segments
* **Beginner Crypto Traders**: Individuals who want to learn exchange operations without risking capital.
* **Trading Academies & Communities**: Educators seeking a clean sandbox environment to teach trading strategies.
* **Fintech Developers**: Developers experimenting with exchange APIs and WebSocket streams.

### Revenue Streams
1. **Premium Subscription Plan**: ₹499/month per user for advanced features (custom API access, historical candles export, advanced indicator integrations).
2. **B2B White-Label Licensing**: ₹1,50,000 one-time setup fee + ₹25,000/month for custom-branded instances hosted for trading institutes.
3. **Ad Placements & Sponsorships**: ₹20,000/month for verified exchange recommendations and token promotions.

---

## 2. AWS Infrastructure Cost Breakdown (ap-south-1 Mumbai)

This projection represents a **Production-Ready tier** designed to support up to 10,000 concurrent active users.

*Exchange rate used: 1 USD = ₹83.50 INR*

| AWS Service | Configuration | Monthly Cost (USD) | Monthly Cost (INR) |
| :--- | :--- | :--- | :--- |
| **Application Server** | 2 × `t3.medium` EC2 Instances (Auto-Scaling) | $41.76 | ₹3,487 |
| **Database Instance** | Amazon DocumentDB `db.t3.medium` (with Replica) | $57.60 | ₹4,810 |
| **Load Balancing** | Application Load Balancer (ALB) | $22.26 | ₹1,859 |
| **Storage & Transfer** | 100 GB EBS GP3 + 150 GB Data Transfer Out | $24.00 | ₹2,004 |
| **Security & Backups** | AWS Backup, CloudWatch, GuardDuty | $10.00 | ₹835 |
| **Total Monthly Hosting**| | **$155.62** | **₹12,995** |
| **Total Annual Hosting** | | **$1,867.44** | **₹1,55,940** |

---

## 3. Financial Projections (Year 1)

These projections model target metrics assuming a user base of 1,000 registered accounts by Month 6, with a 5% premium conversion rate.

### Monthly Operating Expenses (OPEX)
* **AWS Hosting Costs**: ₹12,995
* **Software Maintenance**: ₹35,000 *(Retainer for part-time developer support)*
* **Marketing & User Acquisition**: ₹15,000 *(Google/Meta ads targeting crypto educational groups)*
* **Administrative Overhead**: ₹3,000 *(Domain renewals, emails, auxiliary tools)*
* **Total Monthly Expenses**: **₹65,995**
* **Total Annual Expenses**: **₹7,91,940**

### Projected Monthly Revenue (Targets)
* **Premium Subscriptions**: 50 subscribers × ₹499/month = **₹24,950**
* **B2B Licensing Fees**: 2 active clients × ₹25,000/month = **₹50,000**
* **Sponsorships & Ads**: **₹15,000**
* **Total Monthly Revenue Target**: **₹89,950**

### Net Annual Summary (Year 1)
* **Gross Yearly Revenue**: ₹10,79,400 *(Includes upfront ₹1.5L setup fees for 2 B2B accounts)*
* **Total Yearly Expenses**: ₹7,91,940
* **Net Annual Profit**: **₹2,87,460**
* **Profit Margin**: **26.6%**
