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

        // 1. Add Nodes
        nodesMap.forEach(node => {
            const size = node.type === 'class' ? 15 + Math.log10(node.value || 10) * 5 : 10;
            const color = node.type === 'class' ? '#475569' : (node.type === 'type' ? '#f59e0b' : '#3b82f6');

            this._graph.addNode(node.id, {
                label: node.name || node.uri.split(/[#\/]/).pop(),
                x: Math.random(),
                y: Math.random(),
                size: size,
                color: color,
                type: node.type,
                uri: node.uri
            });
        });

        // 2. Add Edges (VOWL Properties)
        this._properties = properties;
        this._updateVisibleGraph();
    }

    setSettings(newSettings) {
        this._settings = { ...this._settings, ...newSettings };
        this._updateVisibleGraph();
    }

    applyFilters(newFilters) {
        this._filters = { ...this._filters, ...newFilters };
        this._updateVisibleGraph();
    }

    _updateVisibleGraph() {
        if (!this._properties) return;
        this._graph.clear();

        // Re-add nodes based on filters
        this._allNodesMap.forEach(node => {
            if (!this._filters.datatypes && node.type === 'datatypeProperty') return;

            const size = node.type === 'class' ? 15 + Math.log10(node.value || 10) * 5 : 10;
            const color = node.type === 'class' ? '#475569' : (node.type === 'type' ? '#f59e0b' : '#3b82f6');

            this._graph.addNode(node.id, {
                label: node.name || node.uri.split(/[#\/]/).pop(),
                x: Math.random(),
                y: Math.random(),
                size: size,
                color: color,
                type: node.type,
                uri: node.uri
            });
        });

        // Add edges
        this._properties.forEach(prop => {
            if (this._graph.hasNode(prop.source) && this._graph.hasNode(prop.target)) {
                this._graph.addEdge(prop.source, prop.target, {
                    label: prop.name || '...',
                    size: 2,
                    color: 'rgba(255, 255, 255, 0.2)'
                });
            }
        });

        if (this._graph.order > 0) {
            forceAtlas2.assign(this._graph, { iterations: 50, settings: { gravity: this._settings.gravity / 50 } });
        }
        if (this._sigma) this._sigma.refresh();
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

        const container = this.shadowRoot.querySelector('#sigma-container');

        this._sigma = new Sigma(this._graph, container, {
            renderLabels: true,
            labelFont: 'Inter, sans-serif',
            labelSize: 12,
            labelWeight: '500',
            labelColor: { color: '#f8fafc' },
            stagePadding: 50
        });

        this._sigma.on('clickNode', ({ node }) => {
            this._selectedId = node;
            const nodeData = this._graph.getNodeAttributes(node);
            this.dispatchEvent(new CustomEvent('node-selected', {
                detail: { id: node, ...nodeData },
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define('sigma-vowl-graph', SigmaVowlGraph);
