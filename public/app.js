const searchInput = document.getElementById('searchInput');
const limitSelect = document.getElementById('limitSelect');
const searchButton = document.getElementById('searchButton');
const statusSummary = document.getElementById('statusSummary');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const tableHead = document.querySelector('#resultsTable thead');
const tableBody = document.querySelector('#resultsTable tbody');

const state = {
  columns: [],
  query: '',
  limit: Number(limitSelect.value),
  offset: 0,
  lastCount: 0,
};

function setStatus(message) {
  statusSummary.textContent = message;
}

function buildHeaders() {
  tableHead.innerHTML = '';
  if (!state.columns.length) return;

  const row = document.createElement('tr');
  row.className = 'divide-x divide-ink/10';

  const mapTh = document.createElement('th');
  mapTh.textContent = 'Map';
  mapTh.className = 'px-3 py-3 text-left font-semibold text-ink/60';
  row.appendChild(mapTh);

  const landmarkTh = document.createElement('th');
  landmarkTh.textContent = 'Landmark';
  landmarkTh.className = 'px-3 py-3 text-left font-semibold text-ink/60';
  row.appendChild(landmarkTh);

  for (const col of state.columns) {
    const th = document.createElement('th');
    th.textContent = col.original;
    th.className = 'px-3 py-3 text-left font-semibold text-ink/60';
    row.appendChild(th);
  }

  tableHead.appendChild(row);
}

function buildMapLink(row) {
  const address = row.Address || row['Address - Name'] || '';
  if (!address) return '';
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return url;
}

function buildLandmarkLink(row) {
  const postcode = row.Postcode || '';
  if (!postcode) return '';
  const normalised = String(postcode).trim().replace(/\s+/g, ' ');
  return `https://find-energy-certificate.service.gov.uk/find-a-non-domestic-certificate/search-by-postcode?postcode=${encodeURIComponent(normalised)}`;
}

function renderRows(rows) {
  tableBody.innerHTML = '';
  rows.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.className = index % 2 === 0 ? 'bg-white/70' : 'bg-clay/20';

    const mapTd = document.createElement('td');
    mapTd.className = 'px-3 py-2 align-top';
    const mapUrl = buildMapLink(row);
    if (mapUrl) {
      const link = document.createElement('a');
      link.href = mapUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'text-moss underline decoration-moss/40 underline-offset-2';
      link.textContent = 'Open';
      mapTd.appendChild(link);
    } else {
      mapTd.textContent = '-';
    }
    tr.appendChild(mapTd);

    const landmarkTd = document.createElement('td');
    landmarkTd.className = 'px-3 py-2 align-top';
    const landmarkUrl = buildLandmarkLink(row);
    if (landmarkUrl) {
      const link = document.createElement('a');
      link.href = landmarkUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'text-moss underline decoration-moss/40 underline-offset-2';
      link.textContent = 'Open';
      landmarkTd.appendChild(link);
    } else {
      landmarkTd.textContent = '-';
    }
    tr.appendChild(landmarkTd);

    for (const col of state.columns) {
      const td = document.createElement('td');
      td.textContent = row[col.original] || '';
      td.className = 'px-3 py-2 align-top';
      tr.appendChild(td);
    }

    tableBody.appendChild(tr);
  });
}

function updatePaging() {
  prevButton.disabled = state.offset === 0;
  nextButton.disabled = state.lastCount < state.limit;
}

async function fetchColumns() {
  const res = await fetch('/api/columns');
  const data = await res.json();
  state.columns = data.columns || [];
  buildHeaders();
}

async function runSearch() {
  const params = new URLSearchParams({
    q: state.query,
    limit: String(state.limit),
    offset: String(state.offset),
  });

  setStatus('Searching Address - Name...');
  const res = await fetch(`/api/search?${params.toString()}`);
  const data = await res.json();
  state.lastCount = data.count || 0;

  renderRows(data.rows || []);
  updatePaging();
  const rangeStart = data.offset + 1;
  const rangeEnd = data.offset + state.lastCount;
  const label = state.lastCount
    ? `Showing ${rangeStart}-${rangeEnd} (${state.lastCount} results) for Address - Name contains "${state.query}".`
    : 'No results found for Address - Name.';
  setStatus(label);
}

let debounceTimer;
function scheduleSearch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    state.query = searchInput.value.trim();
    state.limit = Number(limitSelect.value);
    state.offset = 0;
    runSearch();
  }, 350);
}

searchInput.addEventListener('input', scheduleSearch);
limitSelect.addEventListener('change', scheduleSearch);

searchButton.addEventListener('click', () => {
  state.query = searchInput.value.trim();
  state.limit = Number(limitSelect.value);
  state.offset = 0;
  runSearch();
});

prevButton.addEventListener('click', () => {
  state.offset = Math.max(state.offset - state.limit, 0);
  runSearch();
});

nextButton.addEventListener('click', () => {
  state.offset += state.limit;
  runSearch();
});

(async () => {
  try {
    await fetchColumns();
    await runSearch();
  } catch (error) {
    console.error(error);
    setStatus('Unable to reach the local search API.');
  }
})();
