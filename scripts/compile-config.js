import fs from 'fs';
import path from 'path';
import n3 from 'n3';

const { Parser } = n3;

async function compileTTL(filename) {
    const ttlPath = path.join(process.cwd(), 'config', filename);
    const jsonPath = path.join(process.cwd(), 'app', 'config', filename.replace('.ttl', '.json'));

    if (!fs.existsSync(path.join(process.cwd(), 'app', 'config'))) {
        fs.mkdirSync(path.join(process.cwd(), 'app', 'config'), { recursive: true });
    }

    const parser = new Parser();
    const triples = [];

    const ttlContent = fs.readFileSync(ttlPath, 'utf8');

    return new Promise((resolve) => {
        parser.parse(ttlContent, (error, quad, prefixes) => {
            if (quad) {
                triples.push(quad);
            } else {
                // Group by subject
                const grouped = {};
                for (const t of triples) {
                    const s = t.subject.value;
                    if (!grouped[s]) grouped[s] = { id: s };

                    const p = t.predicate.value;
                    // Use short names for properties if they match our expected URIs
                    let key = p;
                    if (p === 'http://www.w3.org/2000/01/rdf-schema#label') key = 'label';
                    if (p === 'http://rdfs.org/ns/void#sparqlEndpoint') key = 'endpoint';
                    if (p === 'http://schema.org/identifier') key = 'identifier';
                    if (p === 'http://schema.org/defaultValue') key = 'defaultValue';
                    if (p.startsWith('https://github.com/zazukoians/ldg/config#')) {
                        key = p.replace('https://github.com/zazukoians/ldg/config#', '');
                    }

                    let val = t.object.termType === 'Literal' ?
                        (t.object.value === 'true' ? true : (t.object.value === 'false' ? false : t.object.value)) :
                        t.object.value;

                    // Convert to number if applicable
                    if (typeof val === 'string' && !isNaN(val) && val.trim() !== '') {
                        val = Number(val);
                    }

                    grouped[s][key] = val;
                }

                const result = Object.values(grouped).filter(item => Object.keys(item).length > 1);
                fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
                console.log(`Compiled ${filename} -> ${jsonPath}`);
                resolve();
            }
        });
    });
}

async function main() {
    await compileTTL('endpoints.ttl');
    await compileTTL('filters.ttl');
    await compileTTL('themes.ttl');
    await compileTTL('settings.ttl');
}

main().catch(console.error);
