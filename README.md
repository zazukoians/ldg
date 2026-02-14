# LDG (Linked Data Grapher)

LDG is like a map for your data. Point it at any database and it instantly draws a picture of how the different pieces of information are connected, helping you navigate complex datasets at a glance.

## Performance & Scalability

> [!IMPORTANT]
> Analyzing the structure of an arbitrary SPARQL endpoint is inherently computationally expensive. LDG performs multiple discovery queries to identify classes, relationships, and datatypes.

- **Endpoint Support**: The system is primarily optimized for [QLever](https://qlever.dev) endpoints. Other SPARQL implementations may experience timeouts or high memory usage on large datasets.
- **Default Limits**: By default, LDG limits discovery to the **top 10 classes** to ensure responsiveness.
- **Customization**: You can adjust the class limit, concurrency, and other parameters in the **Settings** dialog within the application.

## History

[WebVOWL/LD-VOWL](https://github.com/VisualDataWeb/ld-vowl) was a powerful way to understand how things are connected in an RDF knowledge graph without having to explore the data manually. 

This version is based on the innovative ideas of the original authors (Marc Weise, Steffen Lohmann, and Florian Haag). However, as the original codebase was more than a decade old, it has been refactored (probably more rewritten) using Antigravity. The entire application was rebuilt from scratch using Web Components, modern D3.js v7, and Sigma.js.

We enjoyed the process of breathing new life into this project and I hope you enjoy using it!

LDG requires [Node.js](https://nodejs.org/) (v16+) to be built.

## Setup

1. Download and install [Node.js](https://nodejs.org/en/download/).
2. Clone this repository.
3. Run `npm install` in the root directory to install the dependencies.
4. Run `npm run dev` to start the local development server.
5. Run `npm run build` for a production build.

## Build

To get a production build, run `npm run build`. After the build is finished, the results will be inside the `dist` directory.

## License

LDG is licensed under the MIT License. See LICENSE.txt for more details.

