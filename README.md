# LD-VOWL NG

LD-VOWL NG (LinkedDataVOWL Next Generation) extracts ontology information out of arbitrary SPARQL endpoints and shows the extracted information in an overview visualization using the VOWL notation (with minor modifications).

## History

WebVOWL/LD-VOWL is a powerful way to understand how things are connected in an RDF knowledge graph without having to explore the data manually. 

This version is based on the innovative ideas of the original authors (Marc Weise, Steffen Lohmann, and Florian Haag). However, as the original codebase was more than a decade old, it has been completely refactored by **Adrian Gschwend** using **Antigravity**. No legacy code was read or reused during this modernization process; the entire application was rebuilt from scratch using Web Components, modern D3.js v7, and Sigma.js.

The system was primarily tested on **QLever** endpoints. Your mileage may vary (YMMV) with other SPARQL implementations.

I enjoyed the process of breathing new life into this project and I hope you enjoy using it!

LD-VOWL requires [Node.js](https://nodejs.org/) (v16+) to be built.

## Setup

1. Download and install [Node.js](https://nodejs.org/en/download/).
2. Clone this repository.
3. Run `npm install` in the root directory to install the dependencies.
4. Run `npm run dev` to start the local development server.
5. Run `npm run build` for a production build.

## Build

To get a production build, run `npm run build`. After the build is finished, the results will be inside the `dist` directory.

## License

LD-VOWL is licensed under the MIT License. See LICENSE.txt for more details.

## Demo

A public demo is available at [http://ldvowl.visualdataweb.org](http://ldvowl.visualdataweb.org/).
