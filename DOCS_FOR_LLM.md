# LDG (Linked Data Grapher) - LLM Maintenance Guide

This document provides a map of the codebase for future AI agents tasked with maintaining or extending LDG.

## Core Architecture
LDG is a 100% client-side application built with **Vite**, **Web Components**, and modern RDF services.

### Directory Structure
- `/app`: Client-side code and assets.
  - `/components`: Vanilla Web Components (`ui-components.js`, `vowl-graph.js`, `sigma-vowl-graph.js`).
  - `/services`: Core logic (SPARQL extraction, model management, storage).
  - `/config`: Runtime JSON configurations (compiled from Turtle).
- `/config`: **Source of Truth** configuration (Turtle files).
- `/scripts`: Build-time utilities (`compile-config.js`).

## Extension Points

### Adding Endpoints, Filters, or Themes
1. Modify the corresponding Turtle file in `/config/*.ttl`.
2. Run `npm run compile-config` to generate the JSON assets for the webapp.
3. The UI will automatically pick up the new entries via the dynamic loading system in `SidebarComponent.loadConfigs()`.

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

## Build Pipeline
- **Compilation**: `node scripts/compile-config.js` (uses `n3` to parse Turtle).
- **Bundling**: `vite build`.
- **Development**: `npm run dev` (compiles config then starts Vite).

## Key Concepts
- **VOWL Standard**: Handled primarily in `vowl-graph.js` (SVG-based).
- **Performance**: Managed in `sigma-vowl-graph.js` (WebGL-based) for large graphs.
- **Abstraction**: `core-services.js` and `model-services.js` provide the RDF and SPARQL plumbing to keep the UI components clean.
