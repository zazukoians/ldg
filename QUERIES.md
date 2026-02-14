# SPARQL Queries in LDG

This document describes the SPARQL queries used by the LDG extraction engine to discover ontology structures from arbitrary endpoints.

## 1. Class Discovery
Used to find the most prominent classes in the dataset.

```sparql
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
SELECT DISTINCT ?class (count(?sub) AS ?instanceCount)
WHERE { ?sub a ?class. }
GROUP BY ?class
ORDER BY DESC(?instanceCount)
LIMIT 10 OFFSET 0
```
**Why**: We start by identifying the classes that have the most instances, as these are typically the core entities of the knowledge graph.

## 2. Label Retrieval
Fetches human-readable names for classes and properties.

```sparql
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?label 
WHERE { <{URI}> rdfs:label ?label. FILTER (langMatches(lang(?label), 'en')) }
LIMIT 1
```
**Why**: URIs are for machines; labels are for humans. We use `LIMIT 1` instead of `SAMPLE` to ensure compatibility with all endpoints (avoiding `null` rows for unbound variables).

## 3. Class-Class Relationships
Discovers how instances of two classes are linked.

```sparql
SELECT DISTINCT ?prop
WHERE { 
  ?originInstance a <{Class1}> . 
  ?targetInstance a <{Class2}> . 
  ?originInstance ?prop ?targetInstance . 
}
LIMIT 10 OFFSET 0
```
**Why**: This builds the "Object Properties" in the VOWL visualization, showing how classes relate to each other.

## 4. Datatype Discovery
Identifies what kind of literal data is associated with a class using a sampled approach for efficiency.

```sparql
SELECT (COUNT(?val) AS ?valCount) ?valType
WHERE { 
  { SELECT ?instance WHERE { ?instance a <{ClassURI}> } LIMIT 1000 }
  ?instance ?prop ?val . 
  BIND (datatype(?val) AS ?valType) . 
}
GROUP BY ?valType ORDER BY DESC(?valCount) LIMIT 10
```
**Why**: This allows us to visualize "Data Properties" without scanning millions of redundant instances, which prevents timeouts and memory issues on large datasets.

## 5. Subclass Discovery
Heuristically discovers subclass relationships by checking instance overlaps.

```sparql
SELECT (count(?commonInstance) AS ?commonInstanceCount)
WHERE { 
  ?commonInstance a <{Class1}>. 
  ?commonInstance a <{Class2}>. 
}
```
**Why**: Many SPARQL endpoints don't explicitly store `rdfs:subClassOf` triples. By checking if all instances of Class A are also instances of Class B, we can infer a subclass relationship.

## 6. Metadata Retrieval
Retrieves comments or descriptions for the sidebar.

```sparql
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?comment WHERE { <{URI}> rdfs:comment ?comment . } LIMIT 1
```
**Why**: Provides additional context for the selected node in the visualization.

---

## Scalability for Large Datasets (e.g., Wikidata, OSM)

When working with massive datasets, some standard queries might be slow or time out. Here are optimized alternatives:

### A. Sampled Relation Discovery
Instead of joining all instances of two classes (which can be millions), we sample the classes first.

```sparql
SELECT DISTINCT ?prop
WHERE { 
    { SELECT ?originInstance WHERE { ?originInstance a <{Class1}> } LIMIT 1000 }
    { SELECT ?targetInstance WHERE { ?targetInstance a <{Class2}> } LIMIT 1000 }
    ?originInstance ?prop ?targetInstance . 
}
LIMIT 10
```
**Benefits**: Significantly reduces join complexity on heavy endpoints.

### B. Fast Class Discovery
If counts are not required or are causing timeouts, use a simple distinct scan.

```sparql
SELECT DISTINCT ?class WHERE { [] a ?class } LIMIT 20
```
**Benefits**: Avoids the expensive aggregation of all instances. (Note: On QLever, the standard count-based discovery is actually very fast due to index optimizations).

### C. Lightweight Subclass Checking
Instead of a full intersection count, use `ASK` if only existence is needed, or limit the scan.

```sparql
ASK { 
  ?s a <{Class1}> . 
  FILTER NOT EXISTS { ?s a <{Class2}> }
}
```
**Benefits**: Quickly determines if Class1 is a subset of Class2 without counting millions of rows.
