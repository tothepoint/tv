# TV

A small experimental browser-based art project powered by plain JavaScript and Vite.

## Run locally

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Then open the local URL shown in the terminal, usually:

```text
http://localhost:5173
```

## Build locally

Create a production build:

```bash
npm run build
```

This generates the static output in the `dist/` folder.

## Preview the built app locally

Serve the built production output:

```bash
npm run preview -- --host
```

Then open the local URL shown in the terminal, usually:

```text
http://localhost:4173
```

## Deploy to GitHub Pages

This project includes a GitHub Actions workflow for deployment. In GitHub, go to:

- Settings
- Pages
- Source: GitHub Actions

Then push to `main` to publish the site.
