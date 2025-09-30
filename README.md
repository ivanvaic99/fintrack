# FinTrack – Budget & Expense Tracker

FinTrack helps you monitor your finances by logging incomes and expenses, grouping them into categories and visualising spending patterns. All data is stored locally via **IndexedDB** so the application works entirely offline.

## Live Demo

When deployed to GitHub Pages the app will be available at:

```
https://ivanvaic99.github.io/fintrack/
```

![FinTrack desktop](./screenshots/fintrack/fintrack_home_desktop_1440x900.png)

## Features

* **Add transactions** – Record income or expense amounts along with category, date and optional notes.
* **Monthly overview** – Switch between months to see totals and transactions for any period.
* **Charts** – Pie chart summarises expenses by category; table lists individual transactions.
* **Search** – Filter transactions by category or note.
* **CSV import/export** – Backup your data or import an existing CSV file.
* **Offline storage** – Data persists in your browser using Dexie.

## Tech Stack

| Category      | Libraries / Tools              |
|-------------:|---------------------------------|
| Framework     | React 18                        |
| Styling       | TailwindCSS                     |
| Charts        | Recharts                        |
| Date helpers  | date‑fns                        |
| Persistence   | Dexie (IndexedDB)              |
| Build         | Vite                            |
| Deployment    | GitHub Pages + Actions        |

## Getting Started

Install dependencies and run the development server:

```sh
npm install
npm run dev
```

To build for production:

```sh
npm run build
```

## CSV Format

The CSV format used by FinTrack includes the header row: `id,amount,category,type,date,note`. The `id` column is ignored during import. Amounts should be numeric and the `type` field should be either `income` or `expense`.

## License

This project is released under the MIT License. Fork it and make it your own!