
/**
 * Modern RelationExtractor
 */
export class RelationExtractor {
    constructor(sparqlClient, queryFactory, nodes, properties) {
        this.sparqlClient = sparqlClient;
        this.queryFactory = queryFactory;
        this.nodes = nodes;
        this.properties = properties;
    }

    async requestClassClassRelation(originId, targetId, limit = 10, offset = 0) {
        const originClassURI = this.nodes.getURIById(originId);
        const targetClassURI = this.nodes.getURIById(targetId);

        const query = this.queryFactory.getUnorderedClassClassRelationQuery(originClassURI, targetClassURI, limit, offset);

        try {
            const response = await this.sparqlClient.query(query);
            if (!response || !response.results || !response.results.bindings) return;
            const bindings = response.results.bindings;

            for (const binding of bindings) {
                const currentURI = binding.prop.value;
                let intermediateId = this.properties.getIntermediateId(originId, targetId);

                if (!intermediateId) {
                    intermediateId = this.nodes.addNode({
                        uri: currentURI,
                        type: 'property',
                        value: 1,
                        isLoopNode: originId === targetId
                    });
                } else {
                    // Update URI if it was a placeholder
                    const node = this.nodes.getById(intermediateId);
                    if (node && node.uri.includes('placeholder')) {
                        this.nodes.setURI(intermediateId, currentURI);
                    }
                }

                this.properties.addProperty(originId, intermediateId, targetId, currentURI);
                await this.requestPropertyLabel(currentURI);
            }

            if (bindings.length === limit) {
                return this.requestClassClassRelation(originId, targetId, limit * 2, offset + bindings.length);
            }
        } catch (err) {
            console.error(`[RelationExtractor] Error fetching relations:`, err);
        }
    }

    async requestPropertyLabel(uri) {
        const query = this.queryFactory.getLabelQuery(uri);
        try {
            const response = await this.sparqlClient.query(query);
            if (!response || !response.results || !response.results.bindings) return;
            const bindings = response.results.bindings;
            if (bindings.length > 0 && bindings[0].label) {
                this.properties.insertValue(uri, 'name', bindings[0].label.value);
            }
        } catch (err) {
            console.error(`[RelationExtractor] Error fetching label for ${uri}:`, err);
        }
    }

    async requestClassEquality(id1, id2) {
        const uri1 = this.nodes.getURIById(id1);
        const uri2 = this.nodes.getURIById(id2);
        if (!uri1 || !uri2 || id1 === id2) return;

        const query = this.queryFactory.getNumberOfCommonInstancesQuery(uri1, uri2);
        try {
            const response = await this.sparqlClient.query(query);
            if (!response || !response.results || !response.results.bindings || !response.results.bindings[0]) return;
            const commonCount = parseInt(response.results.bindings[0]?.commonInstanceCount?.value || 0);

            if (commonCount > 0) {
                const count1 = this.nodes.getInstanceCountById(id1);
                const count2 = this.nodes.getInstanceCountById(id2);

                if (commonCount === count1 && commonCount < count2) {
                    // id1 is subclass of id2
                    const intermediateId = this.nodes.addNode({
                        uri: 'http://www.w3.org/2000/01/rdf-schema#subClassOf',
                        type: 'property',
                        name: 'Subclass of',
                        value: 1
                    });
                    this.properties.addProperty(id1, intermediateId, id2, 'http://www.w3.org/2000/01/rdf-schema#subClassOf');
                } else if (commonCount === count2 && commonCount < count1) {
                    // id2 is subclass of id1
                    const intermediateId = this.nodes.addNode({
                        uri: 'http://www.w3.org/2000/01/rdf-schema#subClassOf',
                        type: 'property',
                        name: 'Subclass of',
                        value: 1
                    });
                    this.properties.addProperty(id2, intermediateId, id1, 'http://www.w3.org/2000/01/rdf-schema#subClassOf');
                }
            }
        } catch (err) {
            console.error(`[RelationExtractor] Error checking equality:`, err);
        }
    }

    async requestClassTypeRelation(originClassId, intermediateId, targetTypeId, limit = 10, offset = 0) {
        const classURI = this.nodes.getURIById(originClassId);
        const typeURI = this.nodes.getURIById(targetTypeId);

        const query = this.queryFactory.getUnorderedClassTypeRelationQuery(classURI, typeURI, limit, offset);

        try {
            const response = await this.sparqlClient.query(query);
            if (!response || !response.results || !response.results.bindings) return;
            const bindings = response.results.bindings;

            for (let i = 0; i < bindings.length; i++) {
                const currentURI = bindings[i].prop.value;
                if (offset === 0 && i === 0) {
                    this.nodes.setURI(intermediateId, currentURI);
                }
                this.properties.addProperty(originClassId, intermediateId, targetTypeId, currentURI);
                await this.requestPropertyLabel(currentURI);
            }

            if (bindings.length === limit) {
                return this.requestClassTypeRelation(originClassId, intermediateId, targetTypeId, limit * 2, offset + bindings.length);
            }
        } catch (err) {
            console.error(`[RelationExtractor] Error fetching type relations:`, err);
        }
    }
}

/**
 * Modern DataTypeExtractor
 */
export class DataTypeExtractor {
    constructor(sparqlClient, queryFactory, nodes, properties, relationExtractor) {
        this.sparqlClient = sparqlClient;
        this.queryFactory = queryFactory;
        this.nodes = nodes;
        this.properties = properties;
        this.relationExtractor = relationExtractor;
    }

    async requestReferringTypes(classId) {
        if (this.nodes.getTypesLoaded(classId)) return;

        const classURI = this.nodes.getURIById(classId);
        const query = this.queryFactory.getInstanceReferringTypesQuery(classURI, 5);

        try {
            const response = await this.sparqlClient.query(query);
            if (!response || !response.results || !response.results.bindings) return;
            const bindings = response.results.bindings;

            for (const binding of bindings) {
                if (binding.valType && binding.valType.value) {
                    const typeURI = binding.valType.value;
                    if (typeURI.startsWith('http')) {
                        const typeId = this.nodes.addDatatypeForClass({
                            uri: typeURI,
                            type: 'type',
                            value: 1
                        }, classId);

                        if (typeId) {
                            const intermediateId = this.nodes.addNode({
                                uri: this.properties.PLACEHOLDER_PROP_URI,
                                type: 'datatypeProperty',
                                value: 1
                            });

                            this.properties.addProperty(classId, intermediateId, typeId, this.properties.PLACEHOLDER_PROP_URI);
                            await this.relationExtractor.requestClassTypeRelation(classId, intermediateId, typeId);
                        }
                    }
                }
            }
            this.nodes.setTypesLoaded(classId);
        } catch (err) {
            console.error(`[DataTypeExtractor] Error fetching referring types for ${classId}:`, err);
        }
    }
}
