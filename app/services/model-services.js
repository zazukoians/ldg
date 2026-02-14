import prefixes from '@zazuko/prefixes';

/**
 * Simple Event Emitter to replace $rootScope broadcasting
 */
export class EventEmitter {
    constructor() {
        this._listeners = {};
    }
    on(event, listener) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(listener);
        return () => this.off(event, listener);
    }
    off(event, listener) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(l => l !== listener);
    }
    emit(event, data) {
        if (!this._listeners[event]) return;
        this._listeners[event].forEach(l => l(data));
    }
}

/**
 * Modern Prefixes Service
 */
export class Prefixes extends EventEmitter {
    constructor() {
        super();
        this.prefixes = [];
        this.colorNumber = 1;
        this.differentColors = true;
    }

    addPrefix(pre) {
        if (pre && pre.prefix) {
            if (pre.prefix.length < 8) return;
            let existing = this.prefixes.find(p => p.prefix === pre.prefix);
            if (existing) {
                existing.value++;
            } else {
                pre.color = this.colorNumber++;
                pre.value = 1;
                this.prefixes.push(pre);
            }
            this.prefixes.sort((a, b) => b.value - a.value);
            if (this.prefixes.length > 0) {
                this.prefixes.forEach((p, i) => p.classification = (i === 0 ? 'intern' : 'extern'));
            }
            this.emit('prefixes-changed', this.prefixes.length);
        }
    }

    clear() {
        this.prefixes = [];
        this.colorNumber = 1;
        this.emit('prefixes-changed', 0);
    }

    isInternal(uri) {
        return this.prefixes.some(p => p.classification === 'intern' && uri.includes(p.prefix));
    }

    getColor(uri) {
        if (!this.differentColors) return 1;
        let pre = this.prefixes.find(p => p.classification !== 'intern' && uri.includes(p.prefix));
        return pre ? pre.color : 1;
    }
}


/**
 * Service to fetch and provide global URI prefixes (e.g. from zazuko/rdf-vocabularies)
 */
export class GlobalPrefixes {
    constructor() {
        this.prefixes = {}; // { uri: prefix }
        // Use the imported prefixes directly
        for (const [prefix, uri] of Object.entries(prefixes)) {
            this.prefixes[uri] = prefix;
        }
        console.log(`[GlobalPrefixes] Initialized with ${Object.keys(this.prefixes).length} prefixes`);
    }

    shorten(uri) {
        if (!uri) return uri;
        // Try exact match or base match
        for (const [baseUri, prefix] of Object.entries(this.prefixes)) {
            if (uri.startsWith(baseUri)) {
                const local = uri.substring(baseUri.length);
                if (!local.includes('/') && !local.includes('#')) {
                    return `${prefix}:${local}`;
                }
            }
        }
        return null;
    }
}

/**
 * Modern Nodes Service (Simplified state manager)
 */
export class Nodes extends EventEmitter {
    constructor(prefixes, storage, requestConfig, globalPrefixes) {
        super();
        this.prefixes = prefixes;
        this.globalPrefixes = globalPrefixes;
        this.storage = storage;
        this.requestConfig = requestConfig;
        this.nodeMap = new Map();
        this.classUriIdMap = new Map();
        this.suffixRegEx = /(#?[^\/#]*)\/?$/;
        this.altSuffixRegEx = /(:[^:]*)$/;
        this.typesLoaded = new Set();
        this.datatypeMap = {
            'http://www.w3.org/2001/XMLSchema#string': 'string',
            'http://www.w3.org/2001/XMLSchema#integer': 'integer',
            'http://www.w3.org/2001/XMLSchema#int': 'int',
            'http://www.w3.org/2001/XMLSchema#float': 'float',
            'http://www.w3.org/2001/XMLSchema#double': 'double',
            'http://www.w3.org/2001/XMLSchema#boolean': 'boolean',
            'http://www.w3.org/2001/XMLSchema#dateTime': 'dateTime',
            'http://www.w3.org/2001/XMLSchema#date': 'date',
            'http://www.w3.org/2001/XMLSchema#anyURI': 'anyURI',
            'http://www.w3.org/2000/01/rdf-schema#Literal': 'Literal',
            'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString': 'langString'
        };
    }

    getFriendlyName(uri) {
        if (this.datatypeMap[uri]) return this.datatypeMap[uri];
        if (this.globalPrefixes) {
            const shortened = this.globalPrefixes.shorten(uri);
            if (shortened) return shortened;
        }
        return uri.split(/[#\/]/).pop() || uri;
    }

    setGlobalPrefixes(gp) {
        this.globalPrefixes = gp;
    }

    setTypesLoaded(id) { this.typesLoaded.add(id); }
    getTypesLoaded(id) { return this.typesLoaded.has(id); }

    addDatatypeForClass(datatypeNode, classId) {
        // VOWL: A datatype should only occur once per class
        const existingNode = Array.from(this.nodeMap.values()).find(n => n.type === 'type' && n.uri === datatypeNode.uri);
        if (existingNode) return '';

        const id = this.addNode(datatypeNode);
        return id;
    }

    addNode(node) {
        if (node.type === 'class') {
            if (this.classUriIdMap.has(node.uri)) return this.classUriIdMap.get(node.uri);
            node.id = `class${this.nodeMap.size}`;
            this.classUriIdMap.set(node.uri, node.id);
        } else {
            node.id = `${node.type}${this.nodeMap.size}`;
        }

        if (!node.name && node.uri) {
            node.name = this.getFriendlyName(node.uri);
        }

        this.nodeMap.set(node.id, node);

        if (node.uri) {
            let pre = node.uri.replace(this.suffixRegEx, '') || node.uri.replace(this.altSuffixRegEx, '');
            if (pre) this.prefixes.addPrefix({ prefix: pre });
        }
        this.emit('nodes-changed', this.nodeMap);
        return node.id;
    }

    getNodes() { return this.nodeMap; }
    getById(id) { return this.nodeMap.get(id); }

    insertLabel(id, label) {
        const node = this.nodeMap.get(id);
        if (node) {
            node.name = label;
            this.emit('nodes-changed', this.nodeMap);
        }
    }

    clearAll() {
        this.nodeMap.clear();
        this.classUriIdMap.clear();
        this.prefixes.clear();
        this.emit('nodes-changed', this.nodeMap);
    }

    getURIById(id) {
        const node = this.nodeMap.get(id);
        return node ? node.uri : null;
    }

    setURI(id, uri) {
        const node = this.nodeMap.get(id);
        if (node) {
            node.uri = uri;
            node.name = this.getFriendlyName(uri);
            this.emit('nodes-changed', this.nodeMap);
        }
    }

    getInstanceCountById(id) {
        const node = this.nodeMap.get(id);
        return node ? node.instanceCount || 0 : 0;
    }
}

/**
 * Modern Properties Service
 */
export class Properties extends EventEmitter {
    constructor() {
        super();
        this.SUBCLASS_URI = 'http://my-own-sub-class';
        this.DISJOINT_PROP_URI = 'http://my-own-disjoint-prop';
        this.PLACEHOLDER_PROP_URI = 'http://my-placeholder-prop/unknown';

        this.properties = [];
        this.intermediateIdMap = new Map();
        this.sourceTargetPropertyMap = new Map();
    }

    addProperty(sourceId, intermediateId, targetId, uri, value = 1) {
        const key = `${sourceId} - ${targetId}`;
        let property = this.sourceTargetPropertyMap.get(key);

        if (!property) {
            property = {
                source: sourceId,
                intermediate: intermediateId,
                target: targetId,
                uri: uri,
                type: 'property',
                props: [{ uri, value }]
            };
            this.properties.push(property);
            this.sourceTargetPropertyMap.set(key, property);
            this.intermediateIdMap.set(intermediateId, property);
        } else {
            if (property.uri === this.PLACEHOLDER_PROP_URI) {
                property.uri = uri;
                property.props = [{ uri, value }];
            } else if (!property.props.some(p => p.uri === uri)) {
                property.props.push({ uri, value });
            }
        }
        this.emit('properties-changed', this.properties);
    }

    getProperties() { return this.properties; }

    existsBetween(sourceId, targetId) {
        const property = this.sourceTargetPropertyMap.get(`${sourceId} - ${targetId}`);
        return property ? property.uri : false;
    }

    getIntermediateId(sourceId, targetId) {
        const property = this.sourceTargetPropertyMap.get(`${sourceId} - ${targetId}`);
        return property ? property.intermediate : '';
    }

    insertValue(uri, key, value) {
        const prop = this.properties.find(p => p.uri === uri);
        if (prop) {
            prop[key] = value;
            this.emit('properties-changed', this.properties);
        }
    }
}

/**
 * Modern Query Factory
 */
export class QueryFactory {
    constructor() {
        this.namespaces = [
            'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>',
            'PREFIX skos: <http://www.w3.org/2004/02/skos/core#>'
        ];
    }

    getPrefixes() { return this.namespaces.join(' ') + ' '; }

    getClassQuery(limit = 10, offset = 0) {
        return this.getPrefixes() +
            `SELECT DISTINCT ?class (count(?sub) AS ?instanceCount) ` +
            `WHERE { ?sub a ?class. } ` +
            `GROUP BY ?class ` +
            `ORDER BY DESC(?instanceCount) ` +
            `LIMIT ${limit} OFFSET ${offset}`;
    }

    getLabelQuery(uri, lang = 'en') {
        return this.getPrefixes() +
            `SELECT (SAMPLE (?lbl) AS ?label) ` +
            `WHERE { <${uri}> rdfs:label ?lbl. FILTER (langMatches(lang(?lbl), '${lang}')) }`;
    }

    getPreferredLabelQuery(uri, lang = 'en') {
        return this.getPrefixes() +
            `SELECT ?label WHERE { <${uri}> skos:prefLabel ?label . FILTER (langMatches(lang(?label), '${lang}')) }`;
    }

    getInstanceReferringTypesQuery(classURI, limit = 10) {
        return this.getPrefixes() +
            `SELECT (COUNT(?val) AS ?valCount) ?valType ` +
            `WHERE { ?instance a <${classURI}> . ?instance ?prop ?val . BIND (datatype(?val) AS ?valType) . } ` +
            `GROUP BY ?valType ORDER BY DESC(?valCount) LIMIT ${limit}`;
    }

    getOrderedClassClassRelationQuery(originClass, targetClass, limit = 10, offset = 0) {
        return this.getPrefixes() +
            `SELECT (count(?originInstance) as ?count) ?prop ` +
            `WHERE { ?originInstance a <${originClass}> . ?targetInstance a <${targetClass}> . ?originInstance ?prop ?targetInstance . } ` +
            `GROUP BY ?prop ORDER BY DESC(?count) LIMIT ${limit} OFFSET ${offset}`;
    }

    getUnorderedClassClassRelationQuery(originClass, targetClass, limit = 10, offset = 0) {
        return this.getPrefixes() +
            `SELECT DISTINCT ?prop ` +
            `WHERE { ?originInstance a <${originClass}> . ?targetInstance a <${targetClass}> . ?originInstance ?prop ?targetInstance . } ` +
            `LIMIT ${limit} OFFSET ${offset} `;
    }

    getOrderedClassTypeRelationQuery(classURI, typeURI, limit = 5, offset = 0) {
        return this.getPrefixes() +
            `SELECT (count(?instance) AS ?count) ?prop ` +
            `WHERE { ?instance a <${classURI}> . ?instance ?prop ?val . FILTER (datatype(?val) = <${typeURI}>) } ` +
            `GROUP BY ?prop ORDER BY DESC(?count) LIMIT ${limit} OFFSET ${offset}`;
    }

    getUnorderedClassTypeRelationQuery(classURI, typeURI, limit = 5, offset = 0) {
        return this.getPrefixes() +
            `SELECT DISTINCT ?prop ` +
            `WHERE { ?instance a <${classURI}> . ?instance ?prop ?val . FILTER (datatype(?val) = <${typeURI}>) } ` +
            `LIMIT ${limit} OFFSET ${offset}`;
    }

    getNumberOfCommonInstancesQuery(classURI1, classURI2) {
        return this.getPrefixes() +
            `SELECT (count(?commonInstance) AS ?commonInstanceCount) ` +
            `WHERE { ?commonInstance a <${classURI1}>. ?commonInstance a <${classURI2}>. }`;
    }

    getCommentQuery(uri) {
        return this.getPrefixes() +
            `SELECT ?comment WHERE { <${uri}> rdfs:comment ?comment . } LIMIT 1`;
    }
}
