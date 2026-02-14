import Sigma from 'sigma';
import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';

/**
 * <sigma-vowl-graph> Web Component
 * High-performance WebGL renderer for VOWL.
 */
export class SigmaVowlGraph extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._graph = new Graph();
        this._sigma = null;
        this._selectedId = null;
        this._filters = { datatypes: true, disconnected: false };
        this._settings = { gravity: 1, distance: 120 };
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {
        if (this._sigma) {
            this._sigma.kill();
        }
    }

    setData(nodesMap, properties) {
        this._allNodesMap = nodesMap;
        this._properties = properties;
        this._updateVisibleGraph();
    }

    setSettings(newSettings) {
        this._settings = { ...this._settings, ...newSettings };
        if (this._sigma) {
            // Adjust FA2 settings if needed
        }
    }

    applyFilters(newFilters) {
        this._filters = { ...this._filters, ...newFilters };
        this._updateVisibleGraph();
    }

    _updateVisibleGraph() {
        if (!this._allNodesMap || !this._properties) return;

        // Use a temporary set to track which nodes should be visible
        const visibleNodeIds = new Set();
        this._allNodesMap.forEach(node => {
            if (!this._filters.datatypes && node.type === 'datatypeProperty') return;
            visibleNodeIds.add(node.id);
        });

        // 1. Update Nodes in Graphology
        this._allNodesMap.forEach(node => {
            if (!visibleNodeIds.has(node.id)) {
                if (this._graph.hasNode(node.id)) this._graph.dropNode(node.id);
                return;
            }

            const size = node.type === 'class' ? 15 + Math.log10(node.value || 10) * 5 : 8;
            const color = node.type === 'class' ? '#3b82f6' : (node.type === 'type' ? '#f59e0b' : '#94a3b8');

            if (!this._graph.hasNode(node.id)) {
                this._graph.addNode(node.id, {
                    label: node.name || node.uri.split(/[#\/]/).pop(),
                    x: Math.random(),
                    y: Math.random(),
                    size: size,
                    color: color,
                    vowlType: node.type, // Map custom type to attribute to avoid missing program error
                    uri: node.uri
                });
            } else {
                this._graph.mergeNodeAttributes(node.id, { size, color, label: node.name || node.uri.split(/[#\/]/).pop(), vowlType: node.type });
            }
        });

        // 2. Update Edges
        this._graph.clearEdges();
        this._properties.forEach((prop, index) => {
            if (visibleNodeIds.has(prop.source) && visibleNodeIds.has(prop.target)) {
                const edgeId = `e-${prop.source}-${prop.target}-${index}`;
                if (!this._graph.hasEdge(edgeId)) {
                    this._graph.addEdgeWithKey(edgeId, prop.source, prop.target, {
                        label: prop.name || '',
                        size: 1,
                        color: 'rgba(148, 163, 184, 0.3)'
                    });
                }
            }
        });

        // 3. Trigger Layout and Refresh
        try {
            if (this._graph.order > 0 && forceAtlas2 && typeof forceAtlas2.assign === 'function') {
                forceAtlas2.assign(this._graph, { iterations: 50, settings: { gravity: 1 } });
            }
        } catch (e) {
            console.warn('[Sigma] Layout failed', e);
        }

        if (this._sigma) {
            this._sigma.refresh();
        } else {
            this._initSigma();
        }
    }

    _initSigma() {
        const container = this.shadowRoot.querySelector('#sigma-container');
        if (!container || this._sigma) return;

        this._sigma = new Sigma(this._graph, container, {
            renderLabels: true,
            labelFont: 'Inter, sans-serif',
            labelSize: 11,
            labelWeight: '600',
            labelColor: { color: '#f8fafc' },
            stagePadding: 50,
            defaultNodeType: 'circle',
            defaultEdgeType: 'line',
            labelRenderedSizeThreshold: 6
        });

        this._sigma.on('clickNode', ({ node }) => {
            this._selectedId = node;
            const nodeData = this._allNodesMap.get(node);
            this.dispatchEvent(new CustomEvent('node-selected', {
                detail: nodeData,
                bubbles: true,
                composed: true
            }));
        });
    }

    render() {
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          background: #0f172a;
        }
        #sigma-container {
          width: 100%;
          height: 100%;
        }
      </style>
      <div id="sigma-container"></div>
    `;
        this._initSigma();
    }
}

customElements.define('sigma-vowl-graph', SigmaVowlGraph);
