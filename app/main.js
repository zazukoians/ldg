import { Storage, Requests, RequestConfig, SparqlClient } from './services/core-services.js';
import { Prefixes, Nodes, QueryFactory, Properties, GlobalPrefixes } from './services/model-services.js';
import { ClassExtractor } from './services/extractors/class-extractor.js';
import { RelationExtractor, DataTypeExtractor } from './services/extractors/extended-extractors.js';
import './components/vowl-graph.js';
import './components/sigma-vowl-graph.js';
import './components/ui-components.js';


const storage = new Storage(true);
const requests = new Requests();
const requestConfig = new RequestConfig(storage);
const sparqlClient = new SparqlClient(requestConfig, requests);

// Initialize Model Services
const prefixes = new Prefixes();
const globalPrefixes = new GlobalPrefixes();
const nodes = new Nodes(prefixes, storage, requestConfig, globalPrefixes);
const queryFactory = new QueryFactory();
const properties = new Properties();

// Initialize Extractors
const relationExtractor = new RelationExtractor(sparqlClient, queryFactory, nodes, properties);
const dataTypeExtractor = new DataTypeExtractor(sparqlClient, queryFactory, nodes, properties, relationExtractor);
const classExtractor = new ClassExtractor(sparqlClient, queryFactory, nodes, requestConfig, relationExtractor, dataTypeExtractor);

// Components
const sidebar = document.querySelector('sidebar-component');
const statusComp = document.querySelector('status-component');
const appContainer = document.querySelector('.content-grid');

// Manage Renderer
const rendererType = localStorage.getItem('vowl-renderer') || 'd3';
let graph;

if (rendererType === 'sigma') {
  // Replace <vowl-graph> with <sigma-vowl-graph> if selected
  const oldGraph = document.querySelector('vowl-graph');
  graph = document.createElement('sigma-vowl-graph');
  if (oldGraph) {
    oldGraph.replaceWith(graph);
  } else {
    appContainer.prepend(graph);
  }
} else {
  graph = document.querySelector('vowl-graph');
}

// Set initial endpoint
const savedEndpoint = localStorage.getItem('endpoint');
if (savedEndpoint) {
  requestConfig.setEndpointURL(savedEndpoint);
} else {
  // Use showcase server as default as requested (better performance)
  requestConfig.setEndpointURL('https://qlever-server-showcase.zazukoians.org');
}

// Initial Theme Application
const applyTheme = (theme) => {
  if (!theme) return;
  document.documentElement.style.setProperty('--ldg-primary', theme.primaryColor);
  document.documentElement.style.setProperty('--ldg-secondary', theme.secondaryColor);
  document.documentElement.style.setProperty('--ldg-node', theme.nodeColor);
  document.documentElement.style.setProperty('--ldg-text', theme.textColor);
};

// Listen for theme changes
window.addEventListener('theme-changed', (e) => {
  applyTheme(e.detail);
});

// Load and apply initial theme from config if available
async function loadInitialTheme() {
  const themes = await fetch('config/themes.json').then(r => r.json());
  const savedThemeId = localStorage.getItem('ldg-theme') || 'modern';
  const theme = themes.find(t => t.identifier === savedThemeId);
  applyTheme(theme);
}
loadInitialTheme();

// Event Listeners
nodes.on('nodes-changed', (nodeMap) => {
  graph.setData(nodeMap, properties.getProperties());
  updateStats();
});

properties.on('properties-changed', (props) => {
  graph.setData(nodes.getNodes(), props);
  updateStats();
});

graph.addEventListener('node-selected', (e) => {
  sidebar.selected = e.detail;
});

sidebar.addEventListener('filter-changed', (e) => {
  if (graph.applyFilters) {
    graph.applyFilters({ [e.detail.type]: e.detail.active });
  }
});

sidebar.addEventListener('setting-changed', (e) => {
  if (graph.setSettings) {
    graph.setSettings({ [e.detail.type]: e.detail.value });
  }
  if (e.detail.type === 'delay') {
    requestConfig.queryDelay = parseInt(e.detail.value);
  }
  if (e.detail.type === 'limit') {
    requestConfig.limit = parseInt(e.detail.value);
  }
});

// Sync requests to UI
requests.onChange((stats) => {
  statusComp.stats = stats;
  sidebar.stats = stats;
});

function updateStats() {
  // Stats are now handled by requests.onChange listener
  // but we still update endpoint name if needed
  updateEndpointDisplay();
}

async function updateEndpointDisplay() {
  const currentUrl = requestConfig.getEndpointURL();
  const endpoints = await fetch('config/endpoints.json').then(r => r.json());
  const match = endpoints.find(e => e.endpoint === currentUrl);

  if (match) {
    statusComp.endpointName = match.label;
  } else {
    // Direct SPARQL override or unknown preset
    statusComp.endpointName = currentUrl;
  }
}
updateEndpointDisplay();

// Extraction Control
window.addEventListener('start-extraction', () => {
  statusComp.log = 'Extraction started...';
  init();
});

window.addEventListener('stop-extraction', () => {
  statusComp.log = 'Stopped.';
  // In a full implementation, we would abort current requests
});

nodes.on('extraction-log', (msg) => {
  statusComp.log = msg;
});

nodes.on('extraction-complete', (endpoint) => {
  statusComp.log = `Done on ${endpoint}`;
  window.dispatchEvent(new CustomEvent('extraction-finished'));
});

// Initial Extraction
async function init() {
  try {
    const limit = localStorage.getItem('class-limit') || 10;
    requestConfig.limit = parseInt(limit);

    statusComp.log = `Requesting ${requestConfig.limit} classes...`;
    await classExtractor.requestClasses();

    const endpoint = requestConfig.getEndpointURL();
    window.dispatchEvent(new CustomEvent('extraction-complete', { detail: endpoint }));
  } catch (err) {
    console.error('Initialization failed', err);
    statusComp.log = 'Error during extraction.';
  }
}

// Check for auto-start in settings (default false)
async function checkAutoStart() {
  try {
    const settings = await fetch('config/settings.json').then(r => r.json());
    if (settings[0]) {
      if (settings[0].concurrency) {
        requestConfig.concurrency = settings[0].concurrency;
      }
      if (settings[0].autoStart) {
        init();
        window.dispatchEvent(new CustomEvent('extraction-status', { detail: 'running' }));
      } else {
        statusComp.log = 'Ready. Click "Start" to begin extraction.';
      }
    } else {
      statusComp.log = 'Ready. Click "Start" to begin extraction.';
    }
  } catch (err) {
    console.error('[Main] Failed to load settings', err);
    statusComp.log = 'Ready. Click "Start" to begin extraction.';
  }
}
checkAutoStart();
