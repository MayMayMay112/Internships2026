// Render internships from data/internships.json with client-side filters.
const els = {
  q: document.querySelector('#q'),
  loc: document.querySelector('#locationFilter'),
  paid: document.querySelector('#paidFilter'),
  month: document.querySelector('#deadlineFilter'),
  sort: document.querySelector('#sort'),
  results: document.querySelector('#results'),
  cardTpl: document.querySelector('#card-tpl'),
  emptyTpl: document.querySelector('#empty-state')
};

const state = { all: [], filtered: [] };

init();

async function init() {
  try {
    const res = await fetch('data/internships.json', { cache: 'no-store' });
    state.all = await res.json();
    hydrateMonths(state.all);
    applyFilters();
    bindEvents();
  } catch (err) {
    console.error('Failed to load internships.json', err);
    showEmpty('Could not load internships data.');
  }
}

function bindEvents() {
  els.q.addEventListener('input', applyFilters);
  els.loc.addEventListener('change', applyFilters);
  els.paid.addEventListener('change', applyFilters);
  els.month.addEventListener('change', applyFilters);
  els.sort.addEventListener('change', applyFilters);
}

function applyFilters() {
  const q = (els.q.value || '').trim().toLowerCase();
  const loc = els.loc.value;
  const paid = els.paid.value;
  const month = els.month.value;
  const sort = els.sort.value;

  let rows = state.all.slice();

  if (q) {
    rows = rows.filter(r => [r.title, r.organization, r.location, r.type, r.remote, r.pay, r.notes]
      .filter(Boolean).some(s => String(s).toLowerCase().includes(q)));
  }

  if (loc) {
    rows = rows.filter(r => {
      const locStr = (r.location || '').toLowerCase();
      const remoteStr = (r.remote || '').toLowerCase();
      const target = loc.toLowerCase();
      return locStr.includes(target) || remoteStr.includes(target);
    });
  }

  if (paid) {
    rows = rows.filter(r => {
      const p = String(r.pay || '').toLowerCase();
      const paidish = /(paid|stipend|\$|hour|week|month)/.test(p) && !/unpaid/.test(p);
      return paid === 'paid' ? paidish : !paidish;
    });
  }

  if (month) {
    rows = rows.filter(r => (r.deadline || '').slice(0,7) === month);
  }

  if (sort === 'az') {
    rows.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
  } else {
    rows.sort((a, b) => {
      const da = Date.parse(a.deadline) || Infinity;
      const db = Date.parse(b.deadline) || Infinity;
      return da - db;
    });
  }

  state.filtered = rows;
  render(rows);
}

function render(rows) {
  els.results.innerHTML = '';
  if (!rows.length) return showEmpty();
  const frag = document.createDocumentFragment();
  for (const r of rows) {
    const card = els.cardTpl.content.cloneNode(true);
    card.querySelector('.title').textContent = r.title || 'Untitled role';
    card.querySelector('.org').textContent = r.organization || '';
    card.querySelector('.loc').textContent = r.location ? `📍 ${r.location}` : '';
    card.querySelector('.remote').textContent = r.remote ? `🖥 ${r.remote}` : '';
    card.querySelector('.eligibility').textContent = r.eligibility ? `🎯 ${r.eligibility}` : '';
    card.querySelector('.pay').textContent = r.pay ? `💵 ${r.pay}` : '';
    card.querySelector('.deadline').textContent = r.deadline ? `⏰ Deadline: ${r.deadline}` : '';
    card.querySelector('.notes').textContent = r.notes || '';
    const link = card.querySelector('.apply-btn');
    if (r.link) { link.href = r.link; } else { link.remove(); }
    frag.appendChild(card);
  }
  els.results.appendChild(frag);
}

function hydrateMonths(rows) {
  const months = new Set();
  for (const r of rows) {
    if (r.deadline && r.deadline.length >= 7) months.add(r.deadline.slice(0,7));
  }
  const arr = Array.from(months).sort();
  for (const m of arr) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    els.month.appendChild(opt);
  }
}

function showEmpty(msg = 'No matches found') {
  els.results.innerHTML = '';
  const tpl = els.emptyTpl.content.cloneNode(true);
  tpl.querySelector('h3').textContent = msg;
  els.results.appendChild(tpl);
}
