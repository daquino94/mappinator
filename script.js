// script.js

// Variables and functions for CSV files
let fieldsA = [];
let fieldsB = [];
let typesA = [];
let typesB = [];
let dataA = [];
let dataB = [];
let mappings = [];

const fileInputA = document.getElementById('fileA');
const fileInputB = document.getElementById('fileB');
const delimiterInputA = document.getElementById('delimiterA');
const delimiterInputB = document.getElementById('delimiterB');
const customNameInputA = document.getElementById('customNameA');
const customNameInputB = document.getElementById('customNameB');
const fieldsContainerA = document.getElementById('fieldsA');
const fieldsContainerB = document.getElementById('fieldsB');
const downloadButton = document.getElementById('downloadMapping');
const resetButton = document.getElementById('resetButton');
const previewTableBody = document.getElementById('previewTable').querySelector('tbody');
const canvas = document.getElementById('connectionCanvas');
const ctx = canvas.getContext('2d');

fileInputA.addEventListener('change', handleFileA);
fileInputB.addEventListener('change', handleFileB);
downloadButton.addEventListener('click', downloadMapping);
resetButton.addEventListener('click', resetMappings);
window.addEventListener('resize', adjustCanvasSize);
customNameInputA.addEventListener('input', updateCustomNames);
customNameInputB.addEventListener('input', updateCustomNames);

canvas.addEventListener('click', handleCanvasClick);

let arrows = [];

function handleFileA(event) {
  const file = event.target.files[0];
  const delimiter = delimiterInputA.value || ',';
  if (file) {
    parseCSV(file, delimiter, (fields, data) => {
      fieldsA = fields;
      dataA = data;
      typesA = inferTypes(dataA);
      renderFields(fieldsA, typesA, dataA, fieldsContainerA, 'A');
      adjustCanvasSize();
      updateCustomNames(); // Update after loading the file
    });
  }
}

function handleFileB(event) {
  const file = event.target.files[0];
  const delimiter = delimiterInputB.value || ',';
  if (file) {
    parseCSV(file, delimiter, (fields, data) => {
      fieldsB = fields;
      dataB = data;
      typesB = inferTypes(dataB);
      renderFields(fieldsB, typesB, dataB, fieldsContainerB, 'B');
      adjustCanvasSize();
      updateCustomNames(); // Update after loading the file
    });
  }
}

function parseCSV(file, delimiter, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(delimiter);
    const data = lines.slice(1).map(line => line.split(delimiter));
    callback(headers, data);
  };
  reader.readAsText(file);
}

function inferTypes(data) {
  const types = [];
  if (data.length === 0) return types;

  const numFields = data[0].length;
  for (let i = 0; i < numFields; i++) {
    let type = 'String'; // Default
    for (let row of data) {
      const value = row[i];
      if (value !== undefined && value.trim() !== '') {
        if (!isNaN(value)) type = 'Number';
        else if (isValidDate(value)) type = 'Date';
        else if (['true', 'false'].includes(value.toLowerCase())) type = 'Boolean';
        break;
      }
    }
    types.push(type);
  }
  return types;
}

function isValidDate(value) {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

function renderFields(fields, types, data, container, prefix) {
  const customName = prefix === 'A' ? customNameInputA.value || 'System A' : customNameInputB.value || 'System B';
  container.innerHTML = '<h2>' + customName + ' Fields</h2>';
  fields.forEach((field, index) => {
    const div = document.createElement('div');
    div.className = 'field-item';
    div.draggable = true;
    div.id = prefix + '-' + index;

    const sampleValue = data[0] ? data[0][index] : 'N/A';
    const type = types[index] || 'String';

    div.innerHTML = `<strong>${field}</strong><br><small>Type: ${type}<br>Sample: ${sampleValue}</small>`;
    container.appendChild(div);
  });

  addDragAndDropHandlers();
  adjustCanvasSize(); // Ensure the canvas is updated after rendering
}

function addDragAndDropHandlers() {
  const items = document.querySelectorAll('.field-item');
  items.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragend', handleDragEnd);
  });
}

let dragSource = null;

function handleDragStart(e) {
  dragSource = this;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.id);
  this.classList.add('dragging');
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
  e.stopPropagation();

  const isDragSourceLeft = dragSource.closest('.left-fields');
  const isTargetRight = this.closest('.right-fields');

  if (dragSource !== this && isDragSourceLeft && isTargetRight) {
    // Avoid duplicates
    const mappingExists = mappings.some(mapping =>
      (mapping.source === dragSource.id && mapping.target === this.id) ||
      (mapping.source === this.id && mapping.target === dragSource.id)
    );
    if (!mappingExists) {
      mappings.push({ source: dragSource.id, target: this.id });
      drawConnections();
      updatePreviewTable();
      downloadButton.disabled = false;
    }
  }
  return false;
}

function handleDragEnd() {
  this.classList.remove('dragging');
}

function handleCanvasClick(e) {
  const canvasRect = canvas.getBoundingClientRect();
  const clickX = e.clientX - canvasRect.left;
  const clickY = e.clientY - canvasRect.top;

  for (let i = 0; i < arrows.length; i++) {
    const { startX, startY, endX, endY } = arrows[i].path;
    if (isPointNearLine(clickX, clickY, startX, startY, endX, endY)) {
      mappings.splice(i, 1);
      arrows.splice(i, 1);
      drawConnections();
      updatePreviewTable();
      break;
    }
  }
}

function isPointNearLine(px, py, x1, y1, x2, y2, tolerance = 10) {
  const lengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lengthSquared));
  const projectionX = x1 + t * (x2 - x1);
  const projectionY = y1 + t * (y2 - y1);

  return Math.hypot(px - projectionX, py - projectionY) <= tolerance;
}

function drawConnections() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  arrows = [];

  mappings.forEach((mapping, index) => {
    const sourceElem = document.getElementById(mapping.source);
    const targetElem = document.getElementById(mapping.target);

    if (sourceElem && targetElem) {
      const sourceRect = sourceElem.getBoundingClientRect();
      const targetRect = targetElem.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();

      // Calculate positions relative to the canvas
      const startX = sourceRect.right - canvasRect.left;
      const startY = sourceRect.top + sourceRect.height / 2 - canvasRect.top;

      const endX = targetRect.left - canvasRect.left;
      const endY = targetRect.top + targetRect.height / 2 - canvasRect.top;

      // Save arrow information
      arrows.push({
        mapping: mapping,
        path: { startX, startY, endX, endY }
      });

      // Draw the line
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw the arrowhead
      const headlen = 10; // Length of the arrowhead
      const angle = Math.atan2(endY - startY, endX - startX);
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6),
                 endY - headlen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6),
                 endY - headlen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
  });
}

function adjustCanvasSize() {
  const container = document.querySelector('.fields-section');

  // Set canvas dimensions to match the container
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;

  // Position the canvas over the container
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';

  drawConnections(); // Redraw connections when size changes
}

function downloadMapping() {
  const sourceName = customNameInputA.value || 'System A';
  const targetName = customNameInputB.value || 'System B';
  const csvContent = `${sourceName} Field,${sourceName} Type,${sourceName} Sample,${targetName} Field,${targetName} Type,${targetName} Sample\n` + mappings.map(mapping => {
    const sourceIndex = parseInt(mapping.source.split('-')[1]);
    const targetIndex = parseInt(mapping.target.split('-')[1]);
    const sourceField = fieldsA[sourceIndex];
    const targetField = fieldsB[targetIndex];
    const sourceType = typesA[sourceIndex];
    const targetType = typesB[targetIndex];
    const sourceSample = dataA[0] ? dataA[0][sourceIndex] : 'N/A';
    const targetSample = dataB[0] ? dataB[0][targetIndex] : 'N/A';
    return `${sourceField},${sourceType},${sourceSample},${targetField},${targetType},${targetSample}`;
  }).join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mapping.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function resetMappings() {
  mappings = [];
  arrows = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePreviewTable();
  downloadButton.disabled = true;
}

function updatePreviewTable() {
  previewTableBody.innerHTML = '';
  const sourceName = customNameInputA.value || 'System A';
  const targetName = customNameInputB.value || 'System B';

  // Update table headers
  document.getElementById('previewSourceField').innerText = `${sourceName} Field`;
  document.getElementById('previewTargetField').innerText = `${targetName} Field`;

  mappings.forEach(mapping => {
    const sourceIndex = parseInt(mapping.source.split('-')[1]);
    const targetIndex = parseInt(mapping.target.split('-')[1]);

    const sourceField = fieldsA[sourceIndex];
    const targetField = fieldsB[targetIndex];
    const sourceType = typesA[sourceIndex];
    const targetType = typesB[targetIndex];

    const sourceSample = dataA[0] ? dataA[0][sourceIndex] : 'N/A';
    const targetSample = dataB[0] ? dataB[0][targetIndex] : 'N/A';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${sourceField}<br><small>Type: ${sourceType}</small></td>
      <td>${sourceSample}</td>
      <td>${targetField}<br><small>Type: ${targetType}</small></td>
      <td>${targetSample}</td>
    `;
    previewTableBody.appendChild(row);
  });
}

function updateCustomNames() {
  renderFields(fieldsA, typesA, dataA, fieldsContainerA, 'A');
  renderFields(fieldsB, typesB, dataB, fieldsContainerB, 'B');
  updatePreviewTable();
  drawConnections(); // Redraw connections with new names
}

// Variables and functions for JSON files
let fieldsJsonA = [];
let fieldsJsonB = [];
let dataJsonA = {};
let dataJsonB = {};
let mappingsJson = [];

const fileInputJsonA = document.getElementById('fileJsonA');
const fileInputJsonB = document.getElementById('fileJsonB');
const customNameInputJsonA = document.getElementById('customNameJsonA');
const customNameInputJsonB = document.getElementById('customNameJsonB');
const fieldsContainerJsonA = document.getElementById('fieldsJsonA');
const fieldsContainerJsonB = document.getElementById('fieldsJsonB');
const downloadButtonJson = document.getElementById('downloadMappingJson');
const resetButtonJson = document.getElementById('resetButtonJson');
const previewTableBodyJson = document.getElementById('previewTableJson').querySelector('tbody');
const canvasJson = document.getElementById('connectionCanvasJson');
const ctxJson = canvasJson.getContext('2d');

fileInputJsonA.addEventListener('change', handleFileJsonA);
fileInputJsonB.addEventListener('change', handleFileJsonB);
downloadButtonJson.addEventListener('click', downloadMappingJson);
resetButtonJson.addEventListener('click', resetMappingsJson);
window.addEventListener('resize', adjustCanvasSizeJson);
customNameInputJsonA.addEventListener('input', updateCustomNamesJson);
customNameInputJsonB.addEventListener('input', updateCustomNamesJson);

canvasJson.addEventListener('click', handleCanvasClickJson);

let arrowsJson = [];

function handleFileJsonA(event) {
  const file = event.target.files[0];
  if (file) {
    parseJSON(file, (fields, data) => {
      fieldsJsonA = fields;
      dataJsonA = data;
      renderFieldsJson(fieldsJsonA, dataJsonA, fieldsContainerJsonA, 'JsonA');
      adjustCanvasSizeJson();
      updateCustomNamesJson(); // Update after loading the file
    });
  }
}

function handleFileJsonB(event) {
  const file = event.target.files[0];
  if (file) {
    parseJSON(file, (fields, data) => {
      fieldsJsonB = fields;
      dataJsonB = data;
      renderFieldsJson(fieldsJsonB, dataJsonB, fieldsContainerJsonB, 'JsonB');
      adjustCanvasSizeJson();
      updateCustomNamesJson(); // Update after loading the file
    });
  }
}

function parseJSON(file, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      let jsonData = JSON.parse(e.target.result);
      if (Array.isArray(jsonData)) {
        jsonData = jsonData[0]; // Take the first element if it's an array
      }
      const fields = extractFields(jsonData);
      callback(fields, jsonData);
    } catch (error) {
      alert('Error parsing JSON file: ' + error.message);
    }
  };
  reader.readAsText(file);
}

function extractFields(jsonData, prefix = '') {
  let fields = [];
  for (let key in jsonData) {
    if (jsonData.hasOwnProperty(key)) {
      const value = jsonData[key];
      const fullPath = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        fields = fields.concat(extractFields(value, fullPath));
      } else {
        fields.push(fullPath);
      }
    }
  }
  return fields;
}

function renderFieldsJson(fields, data, container, prefix) {
  const customName = prefix === 'JsonA' ? customNameInputJsonA.value || 'System A' : customNameInputJsonB.value || 'System B';
  container.innerHTML = '<h2>' + customName + ' Fields</h2>';
  fields.forEach((field, index) => {
    const div = document.createElement('div');
    div.className = 'field-item';
    div.draggable = true;
    div.id = prefix + '-' + index;

    // Sample value
    const sampleValue = getValueFromPath(data, field);
    const type = typeof sampleValue;

    div.innerHTML = `<strong>${field}</strong><br><small>Type: ${type}<br>Sample: ${sampleValue !== null && sampleValue !== undefined ? sampleValue : 'N/A'}</small>`;
    container.appendChild(div);
  });

  addDragAndDropHandlersJson();
  adjustCanvasSizeJson();
}

function getValueFromPath(obj, path) {
  const parts = path.split('.');
  let value = obj;
  for (let part of parts) {
    if (value && value.hasOwnProperty(part)) {
      value = value[part];
    } else {
      return null;
    }
  }
  return value;
}

function addDragAndDropHandlersJson() {
  const items = document.querySelectorAll('#fieldsJsonA .field-item, #fieldsJsonB .field-item');
  items.forEach(item => {
    item.addEventListener('dragstart', handleDragStartJson);
    item.addEventListener('dragover', handleDragOverJson);
    item.addEventListener('drop', handleDropJson);
    item.addEventListener('dragend', handleDragEndJson);
  });
}

let dragSourceJson = null;

function handleDragStartJson(e) {
  dragSourceJson = this;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.id);
  this.classList.add('dragging');
}

function handleDragOverJson(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDropJson(e) {
  e.stopPropagation();

  const isDragSourceLeft = dragSourceJson.closest('.left-fields');
  const isTargetRight = this.closest('.right-fields');
    // Avoid duplicates
  if (dragSourceJson !== this && isDragSourceLeft && isTargetRight) {
    const mappingExists = mappingsJson.some(mapping =>
      (mapping.source === dragSourceJson.id && mapping.target === this.id) ||
      (mapping.source === this.id && mapping.target === dragSourceJson.id)
    );
    if (!mappingExists) {
      mappingsJson.push({ source: dragSourceJson.id, target: this.id });
      drawConnectionsJson();
      updatePreviewTableJson();
      downloadButtonJson.disabled = false;
    }
  }
  return false;
}

function handleDragEndJson() {
  this.classList.remove('dragging');
}

function handleCanvasClickJson(e) {
  const canvasRect = canvasJson.getBoundingClientRect();
  const clickX = e.clientX - canvasRect.left;
  const clickY = e.clientY - canvasRect.top;

  for (let i = 0; i < arrowsJson.length; i++) {
    const { startX, startY, endX, endY } = arrowsJson[i].path;
    if (isPointNearLine(clickX, clickY, startX, startY, endX, endY)) {
      mappingsJson.splice(i, 1);
      arrowsJson.splice(i, 1);
      drawConnectionsJson();
      updatePreviewTableJson();
      break;
    }
  }
}

function drawConnectionsJson() {
  ctxJson.clearRect(0, 0, canvasJson.width, canvasJson.height);
  arrowsJson = [];

  mappingsJson.forEach(mapping => {
    const sourceElem = document.getElementById(mapping.source);
    const targetElem = document.getElementById(mapping.target);

    if (sourceElem && targetElem) {
      const sourceRect = sourceElem.getBoundingClientRect();
      const targetRect = targetElem.getBoundingClientRect();
      const canvasRect = canvasJson.getBoundingClientRect();

      const startX = sourceRect.right - canvasRect.left;
      const startY = sourceRect.top + sourceRect.height / 2 - canvasRect.top;

      const endX = targetRect.left - canvasRect.left;
      const endY = targetRect.top + targetRect.height / 2 - canvasRect.top;

      arrowsJson.push({
        mapping: mapping,
        path: { startX, startY, endX, endY }
      });

      ctxJson.beginPath();
      ctxJson.moveTo(startX, startY);
      ctxJson.lineTo(endX, endY);
      ctxJson.strokeStyle = 'red';
      ctxJson.lineWidth = 2;
      ctxJson.stroke();

      const headlen = 10;
      const angle = Math.atan2(endY - startY, endX - startX);
      ctxJson.beginPath();
      ctxJson.moveTo(endX, endY);
      ctxJson.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6),
                     endY - headlen * Math.sin(angle - Math.PI / 6));
      ctxJson.moveTo(endX, endY);
      ctxJson.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6),
                     endY - headlen * Math.sin(angle + Math.PI / 6));
      ctxJson.stroke();
    }
  });
}

function adjustCanvasSizeJson() {
  const container = document.querySelector('.fields-section-json');

  canvasJson.width = container.clientWidth;
  canvasJson.height = container.clientHeight;

  canvasJson.style.position = 'absolute';
  canvasJson.style.top = '0';
  canvasJson.style.left = '0';

  drawConnectionsJson();
}

function downloadMappingJson() {
  const sourceName = customNameInputJsonA.value || 'System A';
  const targetName = customNameInputJsonB.value || 'System B';
  const csvContent = `${sourceName} Field,${sourceName} Type,${sourceName} Sample,${targetName} Field,${targetName} Type,${targetName} Sample\n` + mappingsJson.map(mapping => {
    const sourceIndex = parseInt(mapping.source.split('-')[1]);
    const targetIndex = parseInt(mapping.target.split('-')[1]);

    const sourceField = fieldsJsonA[sourceIndex];
    const targetField = fieldsJsonB[targetIndex];

    const sourceSample = getValueFromPath(dataJsonA, sourceField);
    const targetSample = getValueFromPath(dataJsonB, targetField);

    const sourceType = typeof sourceSample;
    const targetType = typeof targetSample;

    return `${sourceField},${sourceType},${sourceSample !== null && sourceSample !== undefined ? sourceSample : 'N/A'},${targetField},${targetType},${targetSample !== null && targetSample !== undefined ? targetSample : 'N/A'}`;
  }).join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mapping_json.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function resetMappingsJson() {
  mappingsJson = [];
  arrowsJson = [];
  ctxJson.clearRect(0, 0, canvasJson.width, canvasJson.height);
  updatePreviewTableJson();
  downloadButtonJson.disabled = true;
}

function updatePreviewTableJson() {
  previewTableBodyJson.innerHTML = '';
  const sourceName = customNameInputJsonA.value || 'System A';
  const targetName = customNameInputJsonB.value || 'System B';

  // Update table headers
  document.getElementById('previewSourceFieldJson').innerText = `${sourceName} Field`;
  document.getElementById('previewTargetFieldJson').innerText = `${targetName} Field`;

  mappingsJson.forEach(mapping => {
    const sourceIndex = parseInt(mapping.source.split('-')[1]);
    const targetIndex = parseInt(mapping.target.split('-')[1]);

    const sourceField = fieldsJsonA[sourceIndex];
    const targetField = fieldsJsonB[targetIndex];

    const sourceSample = getValueFromPath(dataJsonA, sourceField);
    const targetSample = getValueFromPath(dataJsonB, targetField);

    const sourceType = typeof sourceSample;
    const targetType = typeof targetSample;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${sourceField}<br><small>Type: ${sourceType}</small></td>
      <td>${sourceSample !== null && sourceSample !== undefined ? sourceSample : 'N/A'}</td>
      <td>${targetField}<br><small>Type: ${targetType}</small></td>
      <td>${targetSample !== null && targetSample !== undefined ? targetSample : 'N/A'}</td>
    `;
    previewTableBodyJson.appendChild(row);
  });
}

function updateCustomNamesJson() {
  renderFieldsJson(fieldsJsonA, dataJsonA, fieldsContainerJsonA, 'JsonA');
  renderFieldsJson(fieldsJsonB, dataJsonB, fieldsContainerJsonB, 'JsonB');
  updatePreviewTableJson();
  drawConnectionsJson();
}

function isPointNearLine(px, py, x1, y1, x2, y2, tolerance = 10) {
  const lengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lengthSquared));
  const projectionX = x1 + t * (x2 - x1);
  const projectionY = y1 + t * (y2 - y1);

  return Math.hypot(px - projectionX, py - projectionY) <= tolerance;
}
