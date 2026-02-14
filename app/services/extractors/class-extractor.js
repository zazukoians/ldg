/**
 * Modern Class Extractor
 */
export class ClassExtractor {
    constructor(sparqlClient, queryFactory, nodes, requestConfig, relationExtractor, dataTypeExtractor) {
        this.sparqlClient = sparqlClient;
        this.queryFactory = queryFactory;
        this.nodes = nodes;
        this.requestConfig = requestConfig;
        this.relationExtractor = relationExtractor;
        this.dataTypeExtractor = dataTypeExtractor;
        this.blacklist = new Set();
    }

    async requestClasses() {
        if (this.nodes.nodeMap.size > 0) return Array.from(this.nodes.nodeMap.keys());

        const limit = this.requestConfig.limit || 10;
        const query = this.queryFactory.getClassQuery(limit, 0);

        try {
            const bindings = await this.sparqlClient.query(query);
            if (!bindings || bindings.length === 0) {
                this.nodes.emit('extraction-log', 'No classes found.');
                return [];
            }

            this.nodes.emit('extraction-log', `Found ${bindings.length} classes. Requesting details...`);

            const classIds = [];

            for (const binding of bindings) {
                const uri = binding.class.value;
                if (uri.startsWith('http')) {
                    const node = {
                        uri: uri,
                        name: (binding.label !== undefined) ? binding.label.value : '',
                        instanceCount: parseInt(binding.instanceCount.value),
                        value: parseInt(binding.instanceCount.value), // for scaling
                        type: 'class'
                    };
                    const id = this.nodes.addNode(node);
                    classIds.push(id);

                    // Fetch details asynchronously
                    this.requestClassLabel(id, uri);

                    // Trigger extended discovery
                    if (this.dataTypeExtractor) {
                        this.dataTypeExtractor.requestReferringTypes(id);
                    }
                }
            }

            // After discovery of classes, look for relations between them
            this.nodes.emit('extraction-log', 'Discovering relationships between classes...');
            await this.discoverRelations(classIds);
            this.nodes.emit('extraction-log', 'Discovery complete.');

            return classIds;
        } catch (err) {
            console.error('[ClassExtractor] Failed to fetch classes', err);
            throw err;
        }
    }

    async discoverRelations(classIds) {
        if (!this.relationExtractor) return;
        const promises = [];
        for (let i = 0; i < classIds.length; i++) {
            for (let j = 0; j < classIds.length; j++) {
                if (i === j) continue;
                // Discover relations between class pairs
                promises.push(this.relationExtractor.requestClassClassRelation(classIds[i], classIds[j]));
                // Check for equality/subclass set relations
                promises.push(this.relationExtractor.requestClassEquality(classIds[i], classIds[j]));
            }
        }
        await Promise.all(promises);
    }

    async requestClassLabel(id, uri) {
        const lang = this.requestConfig.labelLanguage || 'en';
        const query = this.queryFactory.getLabelQuery(uri, lang);

        try {
            const bindings = await this.sparqlClient.query(query);
            if (bindings && bindings[0]?.label) {
                const label = bindings[0].label.value;
                this.nodes.insertLabel(id, label);
            } else {
                // Try SKOS if RDFS fails
                this.requestClassSkosLabel(id, uri);
            }
        } catch (err) {
            console.warn(`[ClassExtractor] Could not fetch label for ${uri}`, err);
        }
    }

    async requestClassSkosLabel(id, uri) {
        const lang = this.requestConfig.labelLanguage || 'en';
        const query = this.queryFactory.getPreferredLabelQuery(uri, lang);
        try {
            const bindings = await this.sparqlClient.query(query);
            if (bindings && bindings[0]?.label) {
                this.nodes.insertLabel(id, bindings[0].label.value);
            }
        } catch (e) { /* ignore */ }
    }
}
