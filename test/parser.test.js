const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DOMParser } = require('@xmldom/xmldom');

const { parse } = require('../media/parser.js');

const parseXml = source => new DOMParser().parseFromString(source, 'application/xml');
const fixture = name => fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');

test('BAMDefinition: DATETIME checkpoints are milestones, other checkpoints are data items', () => {
  const model = parse('purchasing.bam.xml', fixture('purchasing.bam.xml'), parseXml);
  const order = model.activities.find(activity => activity.name === 'PurchaseOrder');
  assert.deepEqual(order.items.filter(item => item.kind === 'Milestone').map(item => item.name), ['Received', 'Approved']);
  const data = order.items.filter(item => item.kind === 'Data item');
  assert.deepEqual(data.map(item => item.name), ['OrderNumber', 'Amount']);
  assert.equal(data[0].type, 'NVARCHAR(50)');
  assert.equal(model.activities.length, 2);
});

test('BAMDefinition: views resolve ActivityRef and CheckpointRef IDs to names', () => {
  const model = parse('purchasing.bam.xml', fixture('purchasing.bam.xml'), parseXml);
  const view = model.views[0];
  assert.equal(view.name, 'OrderTracking');
  assert.deepEqual(view.activities, ['PurchaseOrder', 'Shipment']);
  const alias = view.aliases.find(item => item.name === 'OrderReceived');
  assert.equal(alias.kind, 'Alias');
  assert.equal(alias.reference, 'Received');
  const duration = view.aliases.find(item => item.name === 'ApprovalTime');
  assert.equal(duration.kind, 'Duration');
  assert.equal(duration.reference, 'OrderReceived, Approved');
});

test('BAMDefinition: a cube linked by ViewRef gives the view its measures and dimensions', () => {
  const model = parse('purchasing.bam.xml', fixture('purchasing.bam.xml'), parseXml);
  const view = model.views[0];
  assert.deepEqual(view.measures.map(item => [item.name, item.aggregation]), [['OrderCount', 'Count'], ['TotalAmount', 'Sum']]);
  assert.equal(view.measures[1].reference, 'OrderAmount');
  assert.deepEqual(view.dimensions.map(item => [item.name, item.kind]), [['ReceivedTime', 'TimeDimension'], ['OrderProgress', 'ProgressDimension']]);
});

test('simple form: BusinessMilestone and BusinessData still work', () => {
  const source = `<Bam><Activity name="Invoice"><BusinessMilestone name="Paid" dataType="datetime"/><BusinessData name="Total" dataType="decimal"/></Activity></Bam>`;
  const model = parse('simple.xml', source, parseXml);
  assert.deepEqual(model.activities[0].items.map(item => [item.name, item.kind]), [['Paid', 'Milestone'], ['Total', 'Data item']]);
});

test('files that are not BAM definitions are refused', () => {
  assert.throws(() => parse('other.xml', '<root><item/></root>', parseXml), /does not appear to be/);
});
