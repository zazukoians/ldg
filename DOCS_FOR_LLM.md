# LDG (Linked Data Grapher) - LLM Maintenance Guide

This document provides a map of the codebase for future AI agents tasked with maintaining or extending LDG.

## Core Architecture
LDG is a 100% client-side application built with **Vite**, **Web Components**, and modern RDF services.

### Directory Structure
- `/app`: Client-side code and assets.
  - `/components`: Vanilla Web Components (`ui-components.js`, `vowl-graph.js`, `sigma-vowl-graph.js`).
  - `/services`: Core logic (SPARQL extraction via `sparql-http-client`, model management, storage).
  - `/public/config`: Runtime JSON configurations (compiled from Turtle, served as static assets).
- `/config`: **Source of Truth** configuration (Turtle files).
- `/scripts`: Build-time utilities (`compile-config.js`).

## Extension Points

### Adding Endpoints, Filters, or Themes
1. Modify the corresponding Turtle file in `/config/*.ttl`.
2. Run `npm run compile-config` to generate JSON assets in `/app/public/config/`.
3. The UI picks up entries via `SidebarComponent.loadConfigs()`, which fetches from `config/*.json`.

### Theme Engine
- Themes are defined in `/config/themes.ttl`.
- Applied in `main.js` via `applyTheme()` which updates root CSS variables:
  - `--ldg-primary`: Brand color.
  - `--ldg-secondary`: Main background.
  - `--ldg-node`: Node fill color.
  - `--ldg-text`: Main text/label color.

### Custom Visualizations
- New renderers should be implemented as Web Components.
- Register them in `main.js` and add an entry in the "Renderer" dropdown in `SidebarComponent.render()`.
- Use `Graphology` for the graph model if implementing WebGL-based renderers.

## Build Pipeline
- **Compilation**: `node scripts/compile-config.js` (uses `n3`).
- **Bundling**: `vite build` (outputs to `dist/`).
- **Development**: `npm run dev` (compiles config then starts Vite).

## Key Concepts
- **VOWL Standard**: Handled primarily in `vowl-graph.js` (SVG-based).
- **Performance**: Managed in `sigma-vowl-graph.js` (WebGL-based) using **Sigma.js** and **Graphology**.
- **SPARQL Engine**: `sparql-services.js` uses Zazuko's `sparql-http-client` for robust RDF parsing and standard compliance.
- **Abstraction**: `core-services.js` and `model-services.js` provide the RDF and SPARQL plumbing to keep UI components decoupled from data specifics.
