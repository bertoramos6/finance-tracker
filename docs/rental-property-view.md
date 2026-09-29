# Rental property view (planned, not built)

Status: **idea / not started**. Build it once there is a rented property to track.

## Goal

A dedicated view for a rented property bought with a mortgage, answering:

- What is the property worth, how much do I still owe, and what is my equity?
- How much of the mortgage have I paid off, and how much of it went to interest?
- Does the property pay for itself each month? (rent vs. all property costs)
- How is it performing overall? (yield, return on the cash I put in)

## How it's tracked until this view exists

Using the features the app already has:

| What | Where | How |
|---|---|---|
| Equity | Investments tab | One position (e.g. "Rental flat"), monthly value = estimated market value − outstanding mortgage. A single net position because the Investments tab doesn't handle negative values. |
| Rent | Transactions (income) | "Other income" for now, or a custom "Rental income" category once income categories can be customised. |
| Mortgage payment | Transactions (expense) | Custom "Mortgage" category, full monthly payment. |
| Running costs | Transactions (expense) | Custom categories: IBI, community fees, insurance, repairs, agency fees, etc. |

The problem: property transactions are mixed in with personal ones, and nothing records the value vs. mortgage split or the loan terms. This view fixes that.

## What the view should show

**Headline numbers**
- Current value, outstanding mortgage, equity (and equity as % of value)
- Mortgage paid to date, split into principal and interest
- This month's net cash flow (rent − all property costs, mortgage included)

**Charts**
- Value vs. outstanding mortgage over time (the gap between the lines is equity)
- Monthly cash flow bars: rent vs. costs stacked by category, with a net line
- Principal vs. interest in each mortgage payment over time

**Metrics**
- Gross yield = annual rent ÷ current value
- Net yield = (annual rent − annual costs excluding mortgage) ÷ current value
- Cash-on-cash return = annual net cash flow ÷ cash invested (down payment + purchase costs)
- Months rented vs. vacant

## Proposed data model

1. **`properties`** table: name, purchase date, purchase price, purchase costs (taxes, notary, agency), down payment.
2. **Mortgage terms** on the property (or a `mortgages` table): original principal, interest rate, term, start date. The app computes the amortisation schedule (principal/interest split per payment) from these. Spanish mortgages are often variable (Euribor revisions), so it needs a way to record rate changes, or a manual outstanding-balance override from the bank statement.
3. **Monthly valuations**: estimated market value per month. Could reuse the `investment_entries` pattern (month + value).
4. **`property_id` column on `transactions`** (nullable): tags rent and costs to the property so they can be separated from personal spending without relying on category names.

Once the property has a value and mortgage data, the Investments "Rental flat" position could be **derived automatically** (value − outstanding balance) instead of entered by hand.

## Open questions

- A new top-level tab, or a sub-view inside Investments?
- Should property transactions still count in the Overview's income, expenses and savings rate? (Probably yes for the cash-flow view, possibly with a toggle to exclude them.)
- How to split mortgage payments: computed from loan terms, or entered from the bank's statement each month?
- Support more than one property from the start? (The data model above does at little extra cost.)

## Prerequisites

- Custom expense categories: done (`custom_types` table).
- Custom income categories (e.g. "Rental income"): not done yet.
