# LD-VOWL

LD-VOWL (LinkedDataVOWL) extracts ontology information out of arbitrary SPARQL endpoints and shows the extracted information in an overview visualization using the VOWL notation (with minor modifications).

## Requirements

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
