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
          background: linear-gradient(135deg, #fff 0%, #3b82f6 100%);
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
        <h1>LDG</h1>
        <div class="nav">
          <span class="active" id="nav-graph">Graph</span>
          <span id="nav-settings">Settings</span>
          <span id="nav-about">About</span>
        </div>
      </header>
      <div id="about-overlay" class="overlay">
        <div class="overlay-content">
          <div class="close-overlay" id="close-about">&times;</div>
          <div class="about-header">
             <img src="logo.png" alt="LDG Logo" class="about-logo">
             <h2>LDG</h2>
          </div>
          <p>LDG (Linked Data Grapher) is a premium visualization tool for Linked Data that provides a VOWL-compliant representation of arbitrary SPARQL endpoints.</p>
          <div class="about-section">
            <h4>History</h4>
            <p>Based on the original idea and implementation by Marc Weise, Steffen Lohmann, and Florian Haag.</p>
            <p>This modernized version was refactored by <strong>Adrian Gschwend</strong> using <strong>Antigravity</strong>. The entire stack was rebuilt for the modern web using Web Components, D3.js v7, and Sigma.js.</p>
          </div>
          <div class="links">
            <a href="https://github.com/VisualDataWeb/LD-VOWL" target="_blank">Project Home</a>
            <a href="https://opensource.org/licenses/MIT" target="_blank">MIT License</a>
          </div>
          <hr style="border-top: 1px solid rgba(255,255,255,0.1); margin: 1.5rem 0;">
          <p style="font-size: 0.75rem; opacity: 0.6; text-align: center;">
            Copyright (c) 2015-2016 Marc Weise, Steffen Lohmann, Florian Haag.<br>
            Modernized (c) 2026 Adrian Gschwend, Qlevia AI.
          </p>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .overlay {
        display: none;
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(2, 6, 23, 0.85);
        z-index: 2000;
        backdrop-filter: blur(12px);
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }
      .overlay.active { display: flex; }
      .overlay-content {
        background: #0f172a;
        padding: 2.5rem;
        border-radius: 16px;
        max-width: 520px;
        width: 100%;
        position: relative;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        color: #f8fafc;
      }
      .about-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 2rem;
        text-align: center;
      }
      .about-logo {
        width: 80px;
        height: 80px;
        border-radius: 16px;
        margin-bottom: 1rem;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .about-header h2 { margin: 0; font-size: 1.75rem; }
      .about-section { margin: 1.5rem 0; }
      .about-section h4 { 
        font-size: 0.75rem; 
        text-transform: uppercase; 
        color: #3b82f6; 
        margin-bottom: 0.5rem;
        letter-spacing: 0.1em;
      }
      .about-section p { font-size: 0.95rem; line-height: 1.6; opacity: 0.9; margin: 0.5rem 0; }
      .close-overlay {
        position: absolute;
        top: 16px; right: 20px;
        font-size: 1.5rem;
        cursor: pointer;
        opacity: 0.4;
        transition: opacity 0.2s;
      }
      .close-overlay:hover { opacity: 1; }
      .links { display: flex; gap: 1.5rem; justify-content: center; margin-top: 1.5rem; }
      .links a {
        color: #3b82f6;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9rem;
        transition: color 0.2s;
      }
      .links a:hover { color: #60a5fa; }
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
    this._configs = { endpoints: [], filters: [], themes: [] };
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

  async connectedCallback() {
    await this.loadConfigs();
    this.render();
    window.addEventListener('toggle-sidebar', (e) => {
      const targetOpen = e.detail && e.detail.open !== undefined ? e.detail.open : !this.open;
      this.open = targetOpen;
    });
  }

  async loadConfigs() {
    try {
      const [endpoints, filters, themes] = await Promise.all([
        fetch('config/endpoints.json').then(r => r.json()),
        fetch('config/filters.json').then(r => r.json()),
        fetch('config/themes.json').then(r => r.json())
      ]);
      this._configs = { endpoints, filters, themes };
    } catch (e) {
      console.error('Failed to load configs:', e);
    }
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
        <h3>Renderer & Theme</h3>
        <div class="stat-item">
          <span>Renderer</span>
          <select id="renderer-toggle" class="ldg-select">
            <option value="d3">D3 (VOWL Standard)</option>
            <option value="sigma">Sigma.js (WebGL)</option>
          </select>
        </div>
        <div class="stat-item">
          <span>Theme</span>
          <select id="theme-toggle" class="ldg-select">
            ${this._configs.themes.map(t => `<option value="${t.identifier}">${t.label}</option>`).join('')}
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
        
        .ldg-select {
          background: #1e293b; 
          color: white; 
          border: 1px solid rgba(255,255,255,0.1); 
          border-radius: 6px; 
          padding: 4px 8px;
          font-size: 0.8rem;
          outline: none;
          cursor: pointer;
        }
        .ldg-select:hover { border-color: #3b82f6; }
        
        .ldg-input {
          width: 100%; 
          background: #0f172a; 
          border: 1px solid #334155; 
          color: white; 
          padding: 6px 8px; 
          border-radius: 6px; 
          font-size: 0.75rem;
          margin-bottom: 0.5rem;
          outline: none;
        }
        .ldg-input:focus { border-color: #3b82f6; }

        .ldg-btn {
          width: 100%; 
          background: #3b82f6; 
          border: none; 
          color: white; 
          border-radius: 6px; 
          padding: 6px; 
          cursor: pointer;
          font-weight: 600;
          font-size: 0.8rem;
          transition: background 0.2s;
        }
        .ldg-btn:hover { background: #2563eb; }
      </style>
      <aside class="${this._open ? 'open' : ''}">
        <div class="close-btn" id="close-sidebar">&times;</div>
        ${selectionHtml}
        ${rendererHtml}
        ${statsHtml}
        
        <div class="group">
          <div class="accordion-item" data-id="filters"><span>Filters</span> <span class="icon">›</span></div>
          <div class="accordion-content" id="content-filters">
            ${this._configs.filters.map(f => `
              <div class="control-row">
                <span>${f.label}</span>
                <input type="checkbox" id="filter-${f.identifier}" ${f.defaultValue ? 'checked' : ''}>
              </div>
            `).join('')}
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
              <select id="endpoint-presets" class="ldg-select" style="width: 100%; margin-bottom: 0.5rem;">
                <option value="">-- Presets --</option>
                ${this._configs.endpoints.map(e => `<option value="${e.endpoint}">${e.label}</option>`).join('')}
              </select>
              <input type="text" id="endpoint-url" class="ldg-input" placeholder="Custom URL...">
              <button id="apply-endpoint" class="ldg-btn">Apply</button>
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
    const endpointPresets = this.shadowRoot.querySelector('#endpoint-presets');
    if (endpointInput && endpointPresets) {
      endpointInput.value = localStorage.getItem('endpoint') || '';
      endpointPresets.addEventListener('change', (e) => {
        if (e.target.value) endpointInput.value = e.target.value;
      });
      this.shadowRoot.querySelector('#apply-endpoint').addEventListener('click', () => {
        localStorage.setItem('endpoint', endpointInput.value);
        window.location.reload();
      });
    }

    // Wiring dynamic filters
    this._configs.filters.forEach(f => {
      const checkbox = this.shadowRoot.querySelector(`#filter-${f.identifier}`);
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          this.dispatchEvent(new CustomEvent('filter-changed', {
            detail: { type: f.identifier, active: e.target.checked },
            bubbles: true,
            composed: true
          }));
        });
      }
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

    const rendererSelect = this.shadowRoot.querySelector('#renderer-toggle');
    if (rendererSelect) {
      rendererSelect.value = localStorage.getItem('vowl-renderer') || 'd3';
      rendererSelect.addEventListener('change', (e) => {
        localStorage.setItem('vowl-renderer', e.target.value);
        window.location.reload();
      });
    }

    const themeSelect = this.shadowRoot.querySelector('#theme-toggle');
    if (themeSelect) {
      themeSelect.value = localStorage.getItem('ldg-theme') || 'modern';
      themeSelect.addEventListener('change', (e) => {
        const theme = this._configs.themes.find(t => t.identifier === e.target.value);
        localStorage.setItem('ldg-theme', e.target.value);
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: theme }));
      });
    }
  }
}

customElements.define('header-component', HeaderComponent);
customElements.define('sidebar-component', SidebarComponent);
