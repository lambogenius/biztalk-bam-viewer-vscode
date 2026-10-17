(() => {
  const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;
  const state = { model: null, mode: 'activities', query: '' };
  const $ = id => document.getElementById(id);
  const esc = value => { const span = document.createElement('span'); span.textContent = value ?? ''; return span.innerHTML; };
  const parseXml = source => {
    const xml = new DOMParser().parseFromString(source, 'application/xml');
    const parseError = xml.querySelector('parsererror');
    if (parseError) throw new Error(`Invalid BAM XML: ${parseError.textContent.split('\n')[0]}`);
    return xml;
  };
  const parse = (fileName, source) => self.BamParser.parse(fileName, source, parseXml);

  function row(item) {
    const detail = [item.type, item.reference && `→ ${item.reference}`, item.aggregation].filter(Boolean).join(' · ');
    return `<li><strong>${esc(item.name)}</strong><span class="tag">${esc(item.kind || '')}</span><small>${esc(detail)}</small></li>`;
  }
  function section(title, items, emptyText) {
    return `<section><h3>${esc(title)} <span>${items.length}</span></h3>${items.length ? `<ul>${items.map(row).join('')}</ul>` : `<p class="muted">${esc(emptyText)}</p>`}</section>`;
  }
  function renderActivity(activity) {
    const milestones = activity.items.filter(item => item.kind === 'Milestone');
    const data = activity.items.filter(item => item.kind !== 'Milestone');
    return `<article class="card"><div class="card-head"><span>ACTIVITY</span><h2>${esc(activity.name)}</h2></div>${section('Milestones', milestones, 'No milestones found')}${section('Data items', data, 'No data items found')}${section('Relationships', activity.relationships.map(item => ({ ...item, kind: 'Related activity' })), 'No relationships found')}</article>`;
  }
  function renderView(view) {
    const activityItems = view.activities.map(name => ({ name, kind: 'Activity reference' }));
    return `<article class="card"><div class="card-head"><span>VIEW</span><h2>${esc(view.name)}</h2></div>${section('Activities', activityItems, 'No activity references found')}${section('Aliases', view.aliases, 'No aliases found')}${section('Measures', view.measures, 'No measures found')}${section('Dimensions', view.dimensions, 'No dimensions found')}</article>`;
  }
  function render() {
    const model = state.model; if (!model) return;
    $('title').textContent = model.fileName;
    const milestoneCount = model.activities.reduce((sum, item) => sum + item.items.filter(value => value.kind === 'Milestone').length, 0);
    $('stats').innerHTML = `<span class="pill">${model.activities.length} activities</span><span class="pill">${milestoneCount} milestones</span><span class="pill">${model.views.length} views</span>`;
    $('activities').classList.toggle('active', state.mode === 'activities'); $('views').classList.toggle('active', state.mode === 'views');
    const records = model[state.mode].filter(item => JSON.stringify(item).toLowerCase().includes(state.query.toLowerCase()));
    $('content').innerHTML = records.length ? records.map(state.mode === 'activities' ? renderActivity : renderView).join('') : '<div class="empty">No items match this filter.</div>';
  }
  $('activities').addEventListener('click', () => { state.mode = 'activities'; render(); });
  $('views').addEventListener('click', () => { state.mode = 'views'; render(); });
  $('search').addEventListener('input', event => { state.query = event.target.value; render(); });
  window.addEventListener('message', event => { if (event.data?.type !== 'openBam') return; try { state.model = parse(event.data.fileName || 'bam.xml', event.data.source); $('error').hidden = true; render(); } catch (error) { $('error').textContent = error instanceof Error ? error.message : String(error); $('error').hidden = false; $('content').innerHTML = ''; } });
  vscode?.postMessage({ type: 'ready' });
})();
