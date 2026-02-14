import * as d3 from 'd3';

/**
 * <vowl-graph> Web Component
 * Full VOWL support using D3 v7.
 */
export class VowlGraph extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._nodes = [];
        this._links = [];
        this._selectedId = null;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this._filters = { datatypes: true, disconnected: false };
        this._settings = { gravity: 50, distance: 120 };
    }

    connectedCallback() {
        this.render();
        window.addEventListener('resize', this.onResize.bind(this));
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this.onResize.bind(this));
    }

    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        if (this.svg) {
            this.svg.attr('width', this.width).attr('height', this.height);
            if (this.simulation) {
                this.simulation.force('center', d3.forceCenter(this.width / 2, this.height / 2));
                this.simulation.alpha(0.3).restart();
            }
        }
    }

    setData(nodesMap, properties) {
        this._nodes = Array.from(nodesMap.values());
        this._links = [];

        // Build links based on properties
        properties.forEach(prop => {
            // Source to Intermediate
            this._links.push({
                source: prop.source,
                target: prop.intermediate,
                type: prop.type
            });
            // Intermediate to Target
            this._links.push({
                source: prop.intermediate,
                target: prop.target,
                type: prop.type,
                isDouble: true // To indicate arrow destination
            });
        });

        this._allNodes = this._nodes;
        this._allLinks = this._links;

        this.applyFilters(); // Apply filters after setting data
        this.updateGraph();
    }

    setSettings(newSettings) {
        this._settings = { ...this._settings, ...newSettings };
        this.updateGraph(); // Re-render graph with new settings
    }

    applyFilters(newFilters) {
        if (newFilters) {
            this._filters = { ...this._filters, ...newFilters };
        }

        let filteredNodes = [...this._allNodes];
        let filteredLinks = [...this._allLinks];

        // Filter datatypes
        if (!this._filters.datatypes) {
            filteredNodes = filteredNodes.filter(node => node.type !== 'datatypeProperty');
            filteredLinks = filteredLinks.filter(link =>
                link.source.type !== 'datatypeProperty' && link.target.type !== 'datatypeProperty'
            );
        }

        // Filter disconnected nodes (if implemented, this would require more complex graph traversal)
        // For now, we'll just assign the filtered nodes/links
        this._visibleNodes = filteredNodes;
        this._visibleLinks = filteredLinks;

        this.updateGraph();
    }

    selectNode(id) {
        this._selectedId = id;
        this.mainGroup.selectAll('.node')
            .classed('selected', d => d.id === id);

        const node = this._nodes.find(n => n.id === id);
        if (node) {
            this.dispatchEvent(new CustomEvent('node-selected', {
                detail: node,
                bubbles: true,
                composed: true
            }));
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: transparent;
        }
        #container {
          width: 100%;
          height: 100%;
        }
        svg {
          width: 100%;
          height: 100%;
          cursor: crosshair;
        }
        
        /* Node Styles */
        .node circle {
          fill: #475569;
          stroke: rgba(255, 255, 255, 0.2);
          stroke-width: 2px;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
        }
        .node.selected circle {
          stroke: #3b82f6;
          stroke-width: 4px;
        }
        
        .node.type rect {
          fill: #f59e0b;
          stroke: rgba(255, 255, 255, 0.2);
          stroke-width: 1px;
        }
        
        .node.property rect, .node.datatypeProperty rect {
          fill: #acf;
          stroke: #3b82f6;
          stroke-width: 1px;
          rx: 2;
          ry: 2;
        }

        .node text {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          text-anchor: middle;
          pointer-events: none;
          fill: #000;
          font-weight: 600;
        }
        .node.class text {
          fill: #fff;
        }

        /* Link Styles */
        .link {
          stroke: rgba(255, 255, 255, 0.15);
          stroke-width: 1.5px;
          fill: none;
        }
        
        marker#arrow {
          fill: rgba(255, 255, 255, 0.5);
        }
        .arrowHead {
          fill: rgba(255, 255, 255, 0.5);
          stroke: none;
        }
      </style>
      <div id="container"></div>
    `;

        const container = this.shadowRoot.querySelector('#container');
        this.svg = d3.select(container)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height);

        // Define Arrowheads
        this.svg.append('defs').append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('class', 'arrowHead');

        this.mainGroup = this.svg.append('g');

        const zoom = d3.zoom()
            .scaleExtent([0.1, 8])
            .on('zoom', (event) => {
                this.mainGroup.attr('transform', event.transform);
            });

        this.svg.call(zoom);
        this.updateGraph();
    }

    updateGraph() {
        if (!this.mainGroup || !this._visibleNodes) return;

        this.mainGroup.selectAll('*').remove();

        // Simulation
        this.simulation = d3.forceSimulation(this._visibleNodes)
            .force('link', d3.forceLink(this._visibleLinks).id(d => d.id).distance(d => d.isDouble ? this._settings.distance : this._settings.distance))
            .force('charge', d3.forceManyBody().strength((this._settings.gravity - 50) * -20 - 2000))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(d => {
                const base = d.type === 'class' ? 60 : 30;
                return base + 30;
            }));
        this.simulation.force('x', d3.forceX(this.width / 2).strength(0.1));
        this.simulation.force('y', d3.forceY(this.height / 2).strength(0.1));

        const linkContainer = this.mainGroup.append('g').attr('class', 'links');
        const nodeContainer = this.mainGroup.append('g').attr('class', 'nodes');

        const linkElements = linkContainer.selectAll('.link')
            .data(this._visibleLinks)
            .enter().append('path')
            .attr('class', 'link')
            .attr('marker-end', d => d.isDouble ? 'url(#arrow)' : '');

        const nodeElements = nodeContainer.selectAll('.node')
            .data(this._visibleNodes)
            .enter().append('g')
            .attr('class', d => `node ${d.type}`)
            .on('click', (event, d) => this.selectNode(d.id))
            .call(d3.drag()
                .on('start', (event, d) => {
                    if (!event.active) this.simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on('drag', (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on('end', (event, d) => {
                    if (!event.active) this.simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }));

        // Render shapes based on type
        nodeElements.each(function (d) {
            const el = d3.select(this);
            if (d.type === 'class') {
                const radius = 20 + Math.log10(d.value || 10) * 10;
                el.append('circle').attr('r', radius);
                el.append('text').attr('dy', '.35em').text(d.name || d.uri.split(/[#\/]/).pop());
            } else if (d.type === 'type') {
                el.append('rect')
                    .attr('width', 80)
                    .attr('height', 30)
                    .attr('x', -40)
                    .attr('y', -15);
                el.append('text').attr('dy', '.35em').text(d.name || d.uri.split(/[#\/]/).pop());
            } else if (d.type === 'property' || d.type === 'datatypeProperty') {
                const label = d.name || d.uri.split(/[#\/]/).pop() || '...';
                const textWidth = label.length * 6 + 20;
                el.append('rect')
                    .attr('width', textWidth)
                    .attr('height', 20)
                    .attr('x', -textWidth / 2)
                    .attr('y', -10);
                el.append('text').attr('dy', '.35em').style('font-size', '10px').text(label);
            }
        });

        this.simulation.on('tick', () => {
            linkElements.attr('d', d => {
                const sx = d.source.x, sy = d.source.y;
                const tx = d.target.x, ty = d.target.y;
                return `M${sx},${sy} L${tx},${ty}`;
            });

            nodeElements.attr('transform', d => `translate(${d.x},${d.y})`);
        });
    }
}

customElements.define('vowl-graph', VowlGraph);
