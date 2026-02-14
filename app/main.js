import { Storage, Requests, RequestConfig, SparqlClient } from './services/core-services.js';
import { Prefixes, Nodes, QueryFactory, Properties, GlobalPrefixes } from './services/model-services.js';
import { ClassExtractor } from './services/extractors/class-extractor.js';
import { RelationExtractor, DataTypeExtractor } from './services/extractors/extended-extractors.js';
import './components/vowl-graph.js';
import './components/sigma-vowl-graph.js';
import './components/ui-components.js';

// Initialize Core Services
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
  requestConfig.setEndpointURL('https://lindas.admin.ch/query');
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
});

function updateStats() {
  sidebar.stats = {
    pending: 0, // Mock for now
    successful: nodes.getNodes().size,
    failed: 0
  };
}

// Initial Extraction
async function init() {
  try {
    console.log(`Starting full VOWL extraction with ${rendererType} renderer...`);
    await classExtractor.requestClasses();
  } catch (err) {
    console.error('Initialization failed', err);
  }
}

init();
