/**
 * Header Component
 */
export class HeaderComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        header {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0 2rem;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #f8fafc;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
        }
        h1 {
          font-family: 'Inter', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }
        .nav {
          display: flex;
          gap: 1.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .nav span {
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .nav span:hover { opacity: 1; }
        .nav span.active {
          opacity: 1;
          color: #3b82f6;
        }
      </style>
      <header>
        <h1>LD-VOWL Modern</h1>
        <div class="nav">
          <span class="active" id="nav-graph">Graph</span>
          <span id="nav-settings">Settings</span>
          <span id="nav-about">About</span>
        </div>
      </header>
      <div id="about-overlay" class="overlay">
        <div class="overlay-content">
          <div class="close-overlay" id="close-about">&times;</div>
          <h2>LD-VOWL Modern</h2>
          <p>LD-VOWL is a visualization tool for Linked Data that provides a VOWL-compliant representation of SPARQL endpoints.</p>
          <p>Original idea and implementation by Marc Weise, Steffen Lohmann, and Florian Haag.</p>
          <p>This modernized version was refactored with Antigravity by Adrian Gschwend, Qlevia AI, using Web Components, D3.js v7, and Sigma.js.</p>
          <div class="links">
            <a href="http://ldvowl.visualdataweb.org/" target="_blank">Official Website</a>
            <a href="https://github.com/VisualDataWeb/LD-VOWL" target="_blank">Original GitHub</a>
          </div>
          <hr style="border-top: 1px solid #334155; margin: 1rem 0;">
          <p style="font-size: 0.8rem; opacity: 0.7;">Copyright (c) 2015-2016 Marc Weise, Steffen Lohmann, Florian Haag. Modernized by Antigravity in 2026.</p>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .overlay {
        display: none;
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.8);
        z-index: 1000;
        backdrop-filter: blur(8px);
        align-items: center;
        justify-content: center;
      }
      .overlay.active { display: flex; }
      .overlay-content {
        background: #1e293b;
        padding: 2rem;
        border-radius: 12px;
        max-width: 500px;
        position: relative;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        color: #f8fafc;
      }
      .close-overlay {
        position: absolute;
        top: 10px; right: 15px;
        font-size: 1.5rem;
        cursor: pointer;
        opacity: 0.5;
      }
      .close-overlay:hover { opacity: 1; }
      .links a {
        color: #3b82f6;
        margin-right: 1rem;
        text-decoration: none;
        font-weight: 500;
      }
    `;
    this.shadowRoot.appendChild(style);

    this.shadowRoot.querySelector('#nav-settings').addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('toggle-sidebar', { detail: { open: true } }));
    });

    const aboutOverlay = this.shadowRoot.querySelector('#about-overlay');
    this.shadowRoot.querySelector('#nav-about').addEventListener('click', () => {
      aboutOverlay.classList.add('active');
    });
    this.shadowRoot.querySelector('#close-about').addEventListener('click', () => {
      aboutOverlay.classList.remove('active');
    });
  }
}

/**
 * Sidebar Component
 */
export class SidebarComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._stats = { pending: 0, successful: 0, failed: 0 };
    this._selected = null;
    this._open = false;
    this._activeGroup = null;
  }

  set open(value) {
    this._open = value;
    const aside = this.shadowRoot.querySelector('aside');
    if (aside) {
      if (this._open) aside.classList.add('open');
      else aside.classList.remove('open');
    }
  }

  get open() {
    return this._open;
  }

  set stats(data) {
    this._stats = data;
    this.render();
  }

  set selected(node) {
    this._selected = node;
    // Auto-open on selection
    if (node) this.open = true;
    this.render();
  }

  connectedCallback() {
    this.render();
    window.addEventListener('toggle-sidebar', (e) => {
      this.open = e.detail.open !== undefined ? e.detail.open : !this.open;
    });
  }

  render() {
    const statsHtml = `
      <div class="group">
        <h3>Statistics</h3>
        <div class="stat-item">
          <span>Pending Requests</span>
          <span class="value">${this._stats.pending}</span>
        </div>
        <div class="stat-item">
          <span>Successful</span>
          <span class="value success">${this._stats.successful}</span>
        </div>
        <div class="stat-item">
          <span>Errors</span>
          <span class="value error">${this._stats.failed}</span>
        </div>
      </div>
    `;

    const selectionHtml = this._selected ? `
      <div class="group">
        <h3>Selection</h3>
        <div class="detail-item">
          <label>Type</label>
          <span>${this._selected.type}</span>
        </div>
        <div class="detail-item">
          <label>Label</label>
          <span class="highlight">${this._selected.name || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <label>URI</label>
          <span class="uri" title="${this._selected.uri}">${this._selected.uri}</span>
        </div>
        ${this._selected.instanceCount !== undefined ? `
        <div class="detail-item">
          <label>Instances</label>
          <span>${this._selected.instanceCount.toLocaleString()}</span>
        </div>
        ` : ''}
      </div>
    ` : `
      <div class="group">
        <h3>Selection</h3>
        <p class="hint">Click a node to see details</p>
      </div>
    `;

    const rendererHtml = `
      <div class="group">
        <h3>Renderer</h3>
        <div class="stat-item">
          <span>Current</span>
          <select id="renderer-toggle" style="background: #1e293b; color: white; border: 1px solid #334155; border-radius: 4px; padding: 2px 4px;">
            <option value="d3">D3 (VOWL Standard)</option>
            <option value="sigma">Sigma.js (WebGL)</option>
          </select>
        </div>
      </div>
    `;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
        }
        aside {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          width: 320px;
          height: 100%;
          padding: 80px 1.5rem 2rem;
          color: #f8fafc;
          font-family: 'Inter', sans-serif;
          overflow-y: auto;
          box-sizing: border-box;
          position: fixed;
          top: 0;
          right: -320px;
          transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1000;
        }
        
        aside.open {
          right: 0;
        }

        .close-btn {
          position: absolute;
          top: 75px;
          right: 20px;
          cursor: pointer;
          font-size: 1.5rem;
          opacity: 0.5;
          transition: opacity 0.2s;
        }
        .close-btn:hover { opacity: 1; }
        
        .group {
          background: rgba(15, 23, 42, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        
        h3 {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
          margin: 0 0 1rem 0;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          font-size: 0.875rem;
        }
        
        .value { font-weight: 600; font-family: monospace; font-size: 1.125rem; }
        .success { color: #10b981; }
        .error { color: #ef4444; }
        
        .detail-item {
          margin-bottom: 1rem;
        }
        .detail-item label {
          display: block;
          font-size: 0.7rem;
          color: #64748b;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
        }
        .detail-item span {
          font-size: 0.9rem;
          word-break: break-all;
        }
        .highlight { color: #3b82f6; font-weight: 600; font-size: 1.1rem !important; }
        .uri { 
          font-family: monospace; 
          font-size: 0.75rem !important; 
          color: #94a3b8;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .hint { font-size: 0.875rem; color: #64748b; font-style: italic; }

        /* Accordion placeholders */
        .accordion-item {
          padding: 0.75rem 0;
          font-size: 0.875rem;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
        }
        .accordion-item:not([data-id="filters"]) {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .accordion-item:hover { color: #f8fafc; }
        .accordion-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out, margin 0.3s ease-out;
          font-size: 0.8rem;
          color: #94a3b8;
        }
        .accordion-content.active {
          max-height: 500px;
          margin-bottom: 1rem;
        }
        .accordion-item .icon {
          transition: transform 0.2s;
        }
        .accordion-item.active .icon {
          transform: rotate(90deg);
        }
        
        .control-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .control-row input[type="range"] {
          flex: 1;
          margin-left: 1rem;
        }
      </style>
      <aside class="${this._open ? 'open' : ''}">
        <div class="close-btn" id="close-sidebar">&times;</div>
        ${selectionHtml}
        ${rendererHtml}
        ${statsHtml}
        
        <div class="group">
          <div class="accordion-item" data-id="filters"><span>Filters</span> <span class="icon">›</span></div>
          <div class="accordion-content" id="content-filters">
            <div class="control-row">
              <span>Datatypes</span>
              <input type="checkbox" id="filter-datatypes" checked>
            </div>
            <div class="control-row">
              <span>Disconnected</span>
              <input type="checkbox" id="filter-disconnected">
            </div>
          </div>

          <div class="accordion-item" data-id="graph"><span>Graph Settings</span> <span class="icon">›</span></div>
          <div class="accordion-content" id="content-graph">
            <div class="control-row">
              <span>Gravity</span>
              <input type="range" id="setting-gravity" min="0" max="100" value="50">
            </div>
            <div class="control-row">
              <span>Distance</span>
              <input type="range" id="setting-distance" min="50" max="300" value="120">
            </div>
          </div>

          <div class="accordion-item" data-id="general"><span>General</span> <span class="icon">›</span></div>
          <div class="accordion-content" id="content-general">
            <div class="control-row">
              <span title="Delay between SPARQL queries (ms). Lower for fast endpoints like QLever.">Query Delay</span>
              <input type="range" id="setting-delay" min="0" max="1000" value="100">
              <span id="delay-value" style="font-size: 0.7rem; width: 40px; text-align: right;">100ms</span>
            </div>
          </div>

          <div class="accordion-item" data-id="namespaces"><span>Namespaces</span> <span class="icon">›</span></div>
          <div class="accordion-content" id="content-namespaces">
            <div id="namespaces-list">No namespaces found</div>
          </div>

          <div class="accordion-item" data-id="endpoint"><span>Endpoint</span> <span class="icon">›</span></div>
          <div class="accordion-content" id="content-endpoint">
            <div style="padding-top: 5px;">
              <input type="text" id="endpoint-url" style="width: 100%; background: #0f172a; border: 1px solid #334155; color: white; padding: 4px; border-radius: 4px; font-size: 0.75rem;">
              <button id="apply-endpoint" style="width: 100%; margin-top: 5px; background: #3b82f6; border: none; color: white; border-radius: 4px; padding: 4px; cursor: pointer;">Apply</button>
            </div>
          </div>
        </div>
      </aside>
    `;

    this.shadowRoot.querySelectorAll('.accordion-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const content = this.shadowRoot.querySelector(`#content-${id}`);
        const isActive = item.classList.contains('active');

        // Close others
        this.shadowRoot.querySelectorAll('.accordion-item, .accordion-content').forEach(el => {
          el.classList.remove('active');
        });

        if (!isActive) {
          item.classList.add('active');
          content.classList.add('active');
        }
      });
    });

    const endpointInput = this.shadowRoot.querySelector('#endpoint-url');
    if (endpointInput) {
      endpointInput.value = localStorage.getItem('endpoint') || '';
      this.shadowRoot.querySelector('#apply-endpoint').addEventListener('click', () => {
        localStorage.setItem('endpoint', endpointInput.value);
        window.location.reload();
      });
    }

    // Wiring controls
    this.shadowRoot.querySelector('#filter-datatypes').addEventListener('change', (e) => {
      this.dispatchEvent(new CustomEvent('filter-changed', { detail: { type: 'datatypes', active: e.target.checked }, bubbles: true, composed: true }));
    });
    this.shadowRoot.querySelector('#filter-disconnected').addEventListener('change', (e) => {
      this.dispatchEvent(new CustomEvent('filter-changed', { detail: { type: 'disconnected', active: e.target.checked }, bubbles: true, composed: true }));
    });
    this.shadowRoot.querySelector('#setting-gravity').addEventListener('input', (e) => {
      this.dispatchEvent(new CustomEvent('setting-changed', { detail: { type: 'gravity', value: e.target.value }, bubbles: true, composed: true }));
    });
    this.shadowRoot.querySelector('#setting-distance').addEventListener('input', (e) => {
      this.dispatchEvent(new CustomEvent('setting-changed', { detail: { type: 'distance', value: e.target.value }, bubbles: true, composed: true }));
    });
    const delayInput = this.shadowRoot.querySelector('#setting-delay');
    const delayValue = this.shadowRoot.querySelector('#delay-value');
    if (delayInput) {
      delayInput.value = localStorage.getItem('query-delay') !== null ? localStorage.getItem('query-delay') : 100;
      if (delayValue) delayValue.textContent = `${delayInput.value}ms`;
      delayInput.addEventListener('input', (e) => {
        if (delayValue) delayValue.textContent = `${e.target.value}ms`;
        this.dispatchEvent(new CustomEvent('setting-changed', { detail: { type: 'delay', value: e.target.value }, bubbles: true, composed: true }));
        localStorage.setItem('query-delay', e.target.value);
      });
    }

    this.shadowRoot.querySelector('#close-sidebar').addEventListener('click', () => {
      this.open = false;
    });

    const select = this.shadowRoot.querySelector('#renderer-toggle');
    if (select) {
      select.value = localStorage.getItem('vowl-renderer') || 'd3';
      select.addEventListener('change', (e) => {
        localStorage.setItem('vowl-renderer', e.target.value);
        window.location.reload(); // Refresh to switch renderer
      });
    }
  }
}

customElements.define('header-component', HeaderComponent);
customElements.define('sidebar-component', SidebarComponent);
