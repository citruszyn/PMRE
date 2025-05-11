const TILE_SIZE = 512;
const TILE_URL = './tiles/';
const PROVINCES_JSON = './provinces.json';

const canvas = document.getElementById('map-canvas');
const ctx = canvas.getContext('2d');
const hoverBox = document.getElementById('hover-box');
const copyBtn = document.getElementById('copy-btn');

let provincesData = null;
let pidMap = null;
let bounds = null;
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let selectedProvinces = new Set();
let tiles = {};

function loadProvincesData() {
  return fetch(PROVINCES_JSON)
    .then(res => res.json())
    .then(data => {
      provincesData = data;
      pidMap = data.pid_map;
      bounds = data.bounds;
    });
}

function getTileCoordinates(x, y) {
  return {
    tileX: Math.floor(x / TILE_SIZE),
    tileY: Math.floor(y / TILE_SIZE),
  };
}

function drawMap() {
  if (!pidMap) return;
  const width = pidMap[0].length;
  const height = pidMap.length;

  canvas.width = width * scale;
  canvas.height = height * scale;

  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  ctx.clearRect(-offsetX / scale, -offsetY / scale, width, height);

  const cols = Math.ceil(width / TILE_SIZE);
  const rows = Math.ceil(height / TILE_SIZE);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const key = `${x}_${y}`;
      if (!tiles[key]) {
        const img = new Image();
        img.src = `${TILE_URL}${x}_${y}.png`;
        img.onload = () => {
          tiles[key] = img;
          drawMap(); // Re-draw when image is loaded
        };
        continue;
      }
      ctx.drawImage(tiles[key], x * TILE_SIZE, y * TILE_SIZE);
    }
  }

  drawProvinceBorders(ctx, pidMap, selectedProvinces, scale);
}

function drawProvinceBorders(ctx, pid_map, selected, scale) {
  ctx.save();
  ctx.lineWidth = 1 / scale;
  ctx.strokeStyle = 'red';

  const isSelected = new Set(selected);
  for (let y = 1; y < pid_map.length - 1; y++) {
    for (let x = 1; x < pid_map[0].length - 1; x++) {
      const pid = pid_map[y][x];
      if (!isSelected.has(pid)) continue;
      const neighbors = [
        pid_map[y][x + 1],
        pid_map[y][x - 1],
        pid_map[y + 1][x],
        pid_map[y - 1][x],
      ];
      const isEdge = neighbors.some(n => n !== pid);
      if (isEdge) {
        ctx.fillStyle = 'red';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  ctx.restore();
}

function screenToMapCoords(x, y) {
  return {
    x: (x - offsetX) / scale,
    y: (y - offsetY) / scale,
  };
}

function getProvinceIdAt(mapX, mapY) {
  const px = Math.floor(mapX);
  const py = Math.floor(mapY);
  if (
    py >= 0 && py < pidMap.length &&
    px >= 0 && px < pidMap[0].length
  ) {
    return pidMap[py][px];
  }
  return null;
}

function updateHoverBox(event) {
  const rect = canvas.getBoundingClientRect();
  const screenX = event.clientX - rect.left;
  const screenY = event.clientY - rect.top;
  const mapCoords = screenToMapCoords(screenX, screenY);
  const pid = getProvinceIdAt(mapCoords.x, mapCoords.y);

  hoverBox.style.left = `${event.clientX + 10}px`;
  hoverBox.style.top = `${event.clientY + 10}px`;
  hoverBox.textContent = pid !== null ? pid : '';
}

function handleMouseDown(event) {
  isDragging = true;
  dragStart.x = event.clientX - offsetX;
  dragStart.y = event.clientY - offsetY;
}

function handleMouseMove(event) {
  if (isDragging) {
    offsetX = event.clientX - dragStart.x;
    offsetY = event.clientY - dragStart.y;
    drawMap();
  }
  updateHoverBox(event);
}

function handleMouseUp() {
  isDragging = false;
}

function handleWheel(event) {
  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const mapCoordsBeforeZoom = screenToMapCoords(mouseX, mouseY);

  const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
  scale *= zoomFactor;

  const mapCoordsAfterZoom = screenToMapCoords(mouseX, mouseY);
  offsetX += (mapCoordsBeforeZoom.x - mapCoordsAfterZoom.x) * scale;
  offsetY += (mapCoordsBeforeZoom.y - mapCoordsAfterZoom.y) * scale;

  drawMap();
}

function handleClick(event) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const mapCoords = screenToMapCoords(mouseX, mouseY);
  const pid = getProvinceIdAt(mapCoords.x, mapCoords.y);
  if (pid !== null) {
    if (event.shiftKey) {
      selectedProvinces.add(pid);
    } else {
      selectedProvinces.clear();
      selectedProvinces.add(pid);
    }
    drawMap();
  }
}

function handleCopy() {
  const ids = Array.from(selectedProvinces).join(' ');
  navigator.clipboard.writeText(ids).then(() => {
    alert('Province IDs copied to clipboard.');
  });
}

function init() {
  loadProvincesData().then(() => {
    canvas.width = 1; canvas.height = 1;
    drawMap();

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('click', handleClick);
    copyBtn.addEventListener('click', handleCopy);
  });
}

init();
