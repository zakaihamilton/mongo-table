# Mongo Table
A modern, lightweight MongoDB GUI built with Next.js.

![App Icon](/app_icon.png)

## Features

-   **Connection Management**: Easily add, remove, and switch between multiple MongoDB connections using standard URIs.
-   **Database Explorer**: Interactive sidebar tree view to navigate databases and collections.
-   **Data Viewer**:
    -   Sortable columns.
    -   Global search across document fields.
    -   Pagination control.
-   **JSON Inspector**:
    -   Read-only JSON modal for detailed document viewing.
    -   Syntax highlighting (Monokai for Dark Mode, Standard for Light Mode).
    -   Download record as JSON.
-   **Export**: Export collections to JSON or CSV (Zipped).
-   **Theming**: Fully supported Light and Dark modes.

## Tech Stack

-   **Framework**: Next.js 15 (App Router)
-   **UI**: React 19, CSS Modules (Zero runtime CSS-in-JS overhead)
-   **Database**: MongoDB Driver for Node.js
-   **Bundler**: Turbopack

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/zakaihamilton/mongo-table.git
    cd mongo-table
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

4.  **Open the app**:
    Navigate to [http://localhost:3000](http://localhost:3000).

## Configuration

The application uses `localStorage` to persist your connection strings and theme preferences. No external database or server-side configuration is required for the app itself—it connects directly to your MongoDB instances.

## Deployment

Deploy easily on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fzakaihamilton%2Fmongo-table)

_Note_: Ensure your MongoDB cluster allows access from the deployment IP (0.0.0.0/0 for serverless deployments typically).
