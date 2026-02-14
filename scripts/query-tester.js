import ParsingClient from 'sparql-http-client/ParsingClient.js';
import SimpleClient from 'sparql-http-client/SimpleClient.js';

// Configuration
const DEFAULT_ENDPOINT = 'https://qlever-server-showcase.zazukoians.org';
const WIKIDATA_ENDPOINT = 'https://qlever.dev/api/wikidata'; // Extreme stress test

const QUERIES = {
    classDiscovery: (limit = 10) => `
        SELECT DISTINCT ?class (count(?sub) AS ?instanceCount)
        WHERE { ?sub a ?class. }
        GROUP BY ?class
        ORDER BY DESC(?instanceCount)
        LIMIT ${limit}
    `,
    classDiscoveryFast: (limit = 10) => `
        SELECT DISTINCT ?class WHERE { 
            [] a ?class .
        } LIMIT ${limit}
    `,
    labelRetrieval: (uri) => `
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?label
        WHERE { <${uri}> rdfs:label ?label. FILTER (langMatches(lang(?label), 'en')) }
        LIMIT 1
    `,
    classClassRelation: (origin, target) => `
        SELECT DISTINCT ?prop
        WHERE { 
            ?originInstance a <${origin}> . 
            ?targetInstance a <${target}> . 
            ?originInstance ?prop ?targetInstance . 
        }
        LIMIT 5
    `,
    classClassRelationSampled: (origin, target) => `
        SELECT DISTINCT ?prop
        WHERE { 
            { SELECT ?originInstance WHERE { ?originInstance a <${origin}> } LIMIT 100 }
            { SELECT ?targetInstance WHERE { ?targetInstance a <${target}> } LIMIT 100 }
            ?originInstance ?prop ?targetInstance . 
        }
        LIMIT 5
    `,
    datatypeDiscovery: (classUri) => `
        SELECT (COUNT(?val) AS ?valCount) ?valType
        WHERE { 
            { SELECT ?instance WHERE { ?instance a <${classUri}> } LIMIT 1000 }
            ?instance ?prop ?val . 
            BIND (datatype(?val) AS ?valType) . 
        }
        GROUP BY ?valType ORDER BY DESC(?valCount) LIMIT 5
    `,
    subclassDiscovery: (uri1, uri2) => `
        SELECT (count(?commonInstance) AS ?commonInstanceCount)
        WHERE { 
            ?commonInstance a <${uri1}>. 
            ?commonInstance a <${uri2}>. 
        }
    `
};

async function testQuery(client, name, query) {
    console.log(`\nTesting [${name}]...`);
    const start = Date.now();
    try {
        const result = await client.query.select(query);
        const duration = Date.now() - start;
        console.log(`✅ Success in ${duration}ms (Rows: ${result.length})`);
        return { name, duration, success: true, rows: result.length };
    } catch (err) {
        const duration = Date.now() - start;
        console.error(`❌ Failed after ${duration}ms: ${err.message}`);
        return { name, duration, success: false, error: err.message };
    }
}

async function main() {
    const endpoint = process.argv[2] || DEFAULT_ENDPOINT;
    console.log(`Starting Query Tester on: ${endpoint}`);

    const client = new ParsingClient({ endpointUrl: endpoint });

    const results = [];

    // Test 1: Standard Class Discovery
    results.push(await testQuery(client, 'Standard Class Discovery', QUERIES.classDiscovery()));

    // Test 2: Fast Class Discovery (No counts)
    results.push(await testQuery(client, 'Fast Class Discovery', QUERIES.classDiscoveryFast()));

    // Test 3: Labels
    const personUri = endpoint.includes('wikidata') ? 'http://www.wikidata.org/entity/Q5' : 'https://schema.ld.admin.ch/Municipality';
    results.push(await testQuery(client, 'Label Retrieval', QUERIES.labelRetrieval(personUri)));

    // Test 4: Relations (can be slow)
    // Using some common classes for LINDAS or Wikidata
    const c1 = endpoint.includes('wikidata') ? 'http://www.wikidata.org/entity/Q5' : 'https://schema.ld.admin.ch/Municipality';
    const c2 = endpoint.includes('wikidata') ? 'http://www.wikidata.org/entity/Q6256' : 'https://schema.ld.admin.ch/Canton';

    results.push(await testQuery(client, 'Standard Relations', QUERIES.classClassRelation(c1, c2)));
    results.push(await testQuery(client, 'Sampled Relations (Fast)', QUERIES.classClassRelationSampled(c1, c2)));

    // Test 5: Datatypes
    results.push(await testQuery(client, 'Datatype Discovery', QUERIES.datatypeDiscovery(c1)));

    // Test 6: Subclasses (Instance overlap)
    // Municipality vs Canton in LINDAS usually have 0 common instances, but check anyway
    results.push(await testQuery(client, 'Subclass Discovery (Overlap)', QUERIES.subclassDiscovery(c1, c2)));

    console.log('\n--- Summary ---');
    console.table(results);
}

main().catch(console.error);
