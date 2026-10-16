// Reads BizTalk BAM definition XML: the BAMDefinition format (Activity/Checkpoint, View/ActivityView/Alias, Cube with
// measures and dimensions, elements linked by ID) that bm.exe get-defxml and the BAM Excel add-in export, plus the
// simpler BusinessMilestone/BusinessData forms. Used by the webview (media/main.js) and the tests.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BamParser = api;
})(typeof self !== 'undefined' ? self : this, () => {
  const local = node => (node.localName || node.nodeName).toLowerCase();
  const all = node => Array.from(node.getElementsByTagName('*'));
  const childElements = node => Array.from(node.childNodes || []).filter(item => item.nodeType === 1);
  const descendants = (node, names) => all(node).filter(item => names.includes(local(item)));
  const attr = (node, ...names) => { for (const name of names) { const value = node.getAttribute(name); if (value) return value; } return ''; };
  const firstAttr = (node, names) => { for (const name of names) { const value = attr(node, name, name[0].toUpperCase() + name.slice(1)); if (value) return value; } return ''; };
  const text = node => (node?.textContent || '').trim();
  const childText = (node, names) => childElements(node).filter(item => names.includes(local(item))).map(text).filter(Boolean);
  const insideAny = (node, stop, ownerNames) => {
    for (let parent = node.parentNode; parent && parent !== stop && parent.nodeType === 1; parent = parent.parentNode) {
      if (ownerNames.includes(local(parent))) return true;
    }
    return false;
  };
  const own = (node, names, ownerNames) => descendants(node, names).filter(item => !insideAny(item, node, ownerNames));

  const ITEMS = ['checkpoint', 'activityitem', 'businessdata', 'businessmilestone', 'milestone'];
  const DIMENSIONS = ['dimension', 'progressdimension', 'timedimension', 'datadimension', 'numericrangedimension', 'numericrange'];

  function parse(fileName, source, parseXml) {
    const xml = parseXml(source);
    const rootNode = xml.documentElement;
    if (!local(rootNode).includes('bam') && !descendants(rootNode, ['activity', 'view']).length) {
      throw new Error('This does not appear to be an exported BizTalk BAM definition.');
    }

    // BAMDefinition links elements by ID (ActivityRef, CheckpointRef, ViewRef): show names instead of IDs.
    const byId = new Map(all(rootNode).filter(item => attr(item, 'ID', 'Id', 'id')).map(item => [attr(item, 'ID', 'Id', 'id'), item]));
    const nameOf = ref => { const target = byId.get(ref); return target ? firstAttr(target, ['name']) || ref : ref; };

    function item(node) {
      const kind = local(node);
      const dataType = firstAttr(node, ['dataType', 'datatype', 'type']);
      const length = firstAttr(node, ['dataLength', 'datalength']);
      // A BAM checkpoint is a milestone when it records a time (DATETIME), otherwise a business data item.
      const isMilestone = kind === 'checkpoint' ? dataType.toUpperCase() === 'DATETIME' : kind.includes('milestone');
      const refs = childText(node, ['checkpointref', 'aliasref', 'activityref', 'startref', 'endref', 'baseref']).map(nameOf);
      const ref = firstAttr(node, ['activityItemRef', 'activityRef', 'milestoneRef', 'dataItemRef', 'checkpointRef', 'ref']);
      return {
        name: firstAttr(node, ['name']) || node.localName,
        kind: isMilestone ? 'Milestone' : kind === 'checkpoint' || kind.includes('data') || kind === 'activityitem' ? 'Data item' : node.localName,
        type: dataType && length ? `${dataType}(${length})` : dataType,
        reference: [ref && nameOf(ref), ...refs].filter(Boolean).join(', '),
      };
    }

    const measure = node => ({
      ...item(node),
      kind: 'Measure',
      aggregation: firstAttr(node, ['aggregationFunction', 'aggregation', 'function']) || childText(node, ['aggregationfunction'])[0] || '',
    });
    const dimension = node => ({ ...item(node), kind: node.localName });

    const activities = descendants(rootNode, ['activity'])
      .filter(node => !insideAny(node, rootNode, ['activityview', 'view', 'cube']))
      .map((node, index) => ({
        name: firstAttr(node, ['name']) || `Activity ${index + 1}`,
        items: own(node, ITEMS, ['activity', 'view']).map(item),
        relationships: own(node, ['relatedactivity', 'activityrelationship', 'relationship'], ['activity', 'view']).map(rel => ({
          name: firstAttr(rel, ['name']) || rel.localName,
          reference: nameOf(firstAttr(rel, ['activityRef', 'ref', 'relatedActivity'])),
        })),
      }));

    const viewNodes = descendants(rootNode, ['view']);
    // Cubes hold a view's measures and dimensions; they sit inside the view or name it with ViewRef.
    const cubes = descendants(rootNode, ['cube']).filter(cube => !insideAny(cube, rootNode, ['view']));
    const views = viewNodes.map((node, index) => {
      const id = attr(node, 'ID', 'Id', 'id');
      const linkedCubes = cubes.filter(cube => {
        const ref = firstAttr(cube, ['viewRef']) || childText(cube, ['viewref'])[0];
        return ref ? ref === id : viewNodes.length === 1;
      });
      const scopes = [node, ...linkedCubes];
      const from = names => scopes.flatMap(scope => descendants(scope, names));
      return {
        name: firstAttr(node, ['name']) || `View ${index + 1}`,
        activities: descendants(node, ['activityview']).map(av => {
          const ref = firstAttr(av, ['activityRef']) || childText(av, ['activityref'])[0];
          return ref ? nameOf(ref) : firstAttr(av, ['name']);
        }).filter(Boolean),
        aliases: descendants(node, ['alias', 'viewitem', 'duration']).map(alias => ({ ...item(alias), kind: local(alias) === 'duration' ? 'Duration' : 'Alias' })),
        measures: from(['measure']).map(measure),
        dimensions: from(DIMENSIONS).map(dimension),
      };
    });

    if (!activities.length && !views.length) throw new Error('No BAM Activity or View elements were found.');
    return { fileName, activities, views };
  }

  return { parse };
});
