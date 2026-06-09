import { describe, expect, it } from 'vitest';

import {
  createMessageAccumulator,
  createColumnsLayoutPart,
  createMFUIManifest,
  encodeSse,
  messageToEvents,
  projectMessage,
  readMFUIMessage,
  readSemanticStream,
  renderProjection,
  streamMFUIMessage,
} from '../src/index.js';
import {
  alertDefinition,
  timelineDefinition,
  formDefinition,
  barChartDefinition,
  lineChartDefinition,
  pieChartDefinition,
  builtinComponentDefinitions,
} from '../src/definitions/index.js';
import {
  builtinLayouts,
  columnsLayout,
} from '../src/layouts/index.js';

const alert = alertDefinition;
const timeline = timelineDefinition;
const form = formDefinition;
const barChart = barChartDefinition;
const lineChart = lineChartDefinition;
const pieChart = pieChartDefinition;

const timelineSpec = {
  title: 'Launch plan',
  items: [
    {
      time: '2026-06-03',
      title: 'Canary',
      description: 'Open to 10% of internal users',
    },
    {
      time: '2026-06-10',
      title: 'General availability',
    },
  ],
};

const alertSpec = {
  type: 'warning',
  title: 'Deployment risk',
  description: 'Database migrations need a rollback plan.',
};

const formSpec = {
  title: 'Travel plan details',
  description: 'Provide a few details so I can prepare the itinerary.',
  fields: [
    {
      type: 'input',
      name: 'destination',
      label: 'Destination',
      placeholder: 'Where do you want to go?',
      required: true,
    },
    {
      type: 'choice',
      name: 'pace',
      label: 'Travel pace',
      options: [
        { label: 'Relaxed', value: 'relaxed' },
        { label: 'Balanced', value: 'balanced' },
      ],
    },
    {
      type: 'switch',
      name: 'newsletter',
      label: 'Send updates',
    },
    {
      type: 'date',
      name: 'startDate',
      label: 'Start date',
    },
  ],
  submitText: 'Create plan',
};

const barChartSpec = {
  title: 'Weekly signups by channel',
  xLabel: 'Channel',
  yLabel: 'Signups',
  unit: 'users',
  data: [
    { label: 'Organic', value: 1240 },
    { label: 'Paid', value: 860 },
    { label: 'Referral', value: 420 },
  ],
};

const lineChartSpec = {
  title: 'Monthly revenue',
  xLabel: 'Month',
  yLabel: 'Revenue',
  unit: 'USD',
  data: [
    { label: 'April', value: 92000, series: 'Actual' },
    { label: 'May', value: 104000, series: 'Actual' },
    { label: 'June', value: 118000, series: 'Forecast' },
  ],
};

const pieChartSpec = {
  title: 'Traffic source share',
  unit: '%',
  data: [
    { label: 'Search', value: 48 },
    { label: 'Direct', value: 32 },
    { label: 'Referral', value: 20 },
  ],
};

describe('@mfui/client', () => {
  it('defines a serializable component manifest', () => {
    const manifest = timeline.toManifest();

    expect(manifest.name).toBe('mfui.timeline');
    expect(manifest.schema).toEqual(expect.any(Object));
    expect(manifest.projection).toEqual(
      expect.objectContaining({
        text: expect.stringContaining('{{ title }}'),
      }),
    );
  });

  it('defines a serializable alert component manifest', () => {
    const manifest = alert.toManifest();

    expect(manifest.name).toBe('mfui.alert');
    expect(manifest.schema).toEqual(expect.any(Object));
    expect(manifest.projection).toEqual(
      expect.objectContaining({
        text: expect.stringContaining('{{ type }}'),
      }),
    );
  });

  it('defines a serializable form component manifest', () => {
    const manifest = form.toManifest();

    expect(manifest.name).toBe('mfui.form');
    expect(manifest.schema).toEqual(expect.any(Object));
    expect(manifest.projection).toEqual(
      expect.objectContaining({
        text: expect.stringContaining('{% for field in fields %}'),
      }),
    );
  });

  it('defines serializable chart component manifests', () => {
    expect(barChart.toManifest()).toEqual(
      expect.objectContaining({
        name: 'mfui.bar_chart',
        projection: expect.objectContaining({
          text: expect.stringContaining('{% for point in data %}'),
        }),
      }),
    );
    expect(lineChart.toManifest()).toEqual(
      expect.objectContaining({
        name: 'mfui.line_chart',
        projection: expect.objectContaining({
          text: expect.stringContaining('{% for point in data %}'),
        }),
      }),
    );
    expect(pieChart.toManifest()).toEqual(
      expect.objectContaining({
        name: 'mfui.pie_chart',
        projection: expect.objectContaining({
          text: expect.stringContaining('{% for item in data %}'),
        }),
      }),
    );
  });

  it('renders projection templates deterministically from spec', () => {
    const projection = renderProjection(timeline.manifest.projection, timelineSpec);

    expect(projection.text).toContain('### Launch plan');
    expect(projection.text).toContain(
      '- 2026-06-03: Canary - Open to 10% of internal users',
    );
  });

  it('renders alert projection templates deterministically from spec', () => {
    const projection = renderProjection(alert.manifest.projection, alertSpec);

    expect(projection.text).toContain('warning: Deployment risk');
    expect(projection.text).toContain(
      'Database migrations need a rollback plan.',
    );
  });

  it('renders form projection templates deterministically from spec', () => {
    const projection = renderProjection(form.manifest.projection, formSpec);

    expect(projection.text).toContain('### Travel plan details');
    expect(projection.text).toContain('- Destination (input, required)');
    expect(projection.text).toContain(
      '- Travel pace (choice): Relaxed, Balanced',
    );
    expect(projection.text).toContain('Submit: Create plan');
  });

  it('renders chart projection templates deterministically from specs', () => {
    const barProjection = renderProjection(
      barChart.manifest.projection,
      barChartSpec,
    );
    const lineProjection = renderProjection(
      lineChart.manifest.projection,
      lineChartSpec,
    );
    const pieProjection = renderProjection(
      pieChart.manifest.projection,
      pieChartSpec,
    );

    expect(barProjection.text).toContain('### Weekly signups by channel');
    expect(barProjection.text).toContain('X: Channel');
    expect(barProjection.text).toContain('Unit: users');
    expect(barProjection.text).toContain('- Organic: 1240');
    expect(lineProjection.text).toContain('### Monthly revenue');
    expect(lineProjection.text).toContain('- June / Forecast: 118000');
    expect(pieProjection.text).toContain('### Traffic source share');
    expect(pieProjection.text).toContain('Unit: %');
    expect(pieProjection.text).toContain('- Search: 48');
  });

  it('validates form specs locally', () => {
    expect(form.validate(formSpec)).toEqual({ ok: true });
    expect(
      form.validate({
        title: 'Invalid form',
        fields: [
          {
            type: 'choice',
            name: 'emptyChoice',
            label: 'Empty choice',
            options: [],
          },
        ],
      }),
    ).toEqual(
      expect.objectContaining({
        ok: false,
      }),
    );
  });

  it('validates chart specs locally', () => {
    expect(barChart.validate(barChartSpec)).toEqual({ ok: true });
    expect(lineChart.validate(lineChartSpec)).toEqual({ ok: true });
    expect(pieChart.validate(pieChartSpec)).toEqual({ ok: true });

    expect(
      barChart.validate({
        title: 'Too many bars',
        data: Array.from({ length: 101 }, (_, index) => ({
          label: `Item ${index + 1}`,
          value: index + 1,
        })),
      }),
    ).toEqual(
      expect.objectContaining({
        ok: false,
      }),
    );
    expect(
      pieChart.validate({
        title: 'Invalid pie',
        data: [{ label: 'Refunds', value: -1 }],
      }),
    ).toEqual(
      expect.objectContaining({
        ok: false,
      }),
    );
  });

  it('projects a message into portable text', () => {
    const message = projectMessage(
      {
        id: 'msg_1',
        parts: [
          {
            id: 'p1',
            type: 'text',
            content: 'Here is the plan:',
          },
          {
            id: 'p2',
            type: 'component',
            component: 'mfui.timeline',
            spec: timelineSpec,
          },
        ],
      },
      {
        components: [timeline],
      },
    );

    expect(message.portableText).toContain('Here is the plan:');
    expect(message.portableText).toContain('### Launch plan');
  });

  it('projects columns layout parts into portable text', () => {
    const message = projectMessage(
      {
        id: 'msg_columns',
        parts: [
          createColumnsLayoutPart([
            {
              id: 'txt_summary',
              type: 'text',
              content: '### Recommendation\nShip behind a feature flag.',
            },
            {
              id: 'cmp_plan',
              type: 'component',
              component: 'mfui.timeline',
              spec: timelineSpec,
            },
          ]),
        ],
      },
      {
        components: [timeline],
      },
    );

    expect(message.parts[0]?.type).toBe('layout');
    expect(message.portableText).toContain('### Recommendation');
    expect(message.portableText).toContain('### Launch plan');
  });

  it('encodes and reads semantic SSE stream events', async () => {
    const message = projectMessage(
      {
        id: 'msg_1',
        parts: [
          {
            id: 'p1',
            type: 'text',
            content: 'Here is the plan:',
          },
          {
            id: 'p2',
            type: 'component',
            component: 'mfui.timeline',
            spec: timelineSpec,
          },
        ],
      },
      {
        components: [timeline],
      },
    );
    const sse = encodeSse(messageToEvents(message));
    expect(sse).toContain('event: component.snapshot');
    expect(sse).toContain('data:');

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sse));
        controller.close();
      },
    });

    const events = [];
    for await (const event of readSemanticStream(stream)) {
      events.push(event);
    }

    expect(events.map((event) => event.type)).toEqual([
      'message.start',
      'text.delta',
      'component.snapshot',
      'message.end',
    ]);
  });

  it('encodes and reads columns layout snapshot events', async () => {
    const message = projectMessage(
      {
        id: 'msg_columns',
        parts: [
          createColumnsLayoutPart([
            {
              id: 'txt_summary',
              type: 'text',
              content: '### Recommendation\nShip behind a feature flag.',
            },
            {
              id: 'cmp_plan',
              type: 'component',
              component: 'mfui.timeline',
              spec: timelineSpec,
            },
          ]),
        ],
      },
      {
        components: [timeline],
      },
    );
    const sse = encodeSse(messageToEvents(message));
    expect(sse).toContain('event: layout.snapshot');

    const response = new Response(sse, {
      headers: {
        'Content-Type': 'text/event-stream',
      },
    });
    const projected = await readMFUIMessage(response);

    expect(projected?.parts[0]).toEqual(
      expect.objectContaining({
        type: 'layout',
        layout: 'mfui.columns',
      }),
    );
    expect(projected?.portableText).toContain('### Recommendation');
    expect(projected?.portableText).toContain('### Launch plan');
  });

  it('reads the last projected message from an MFUI response', async () => {
    const message = projectMessage(
      {
        id: 'msg_1',
        parts: [
          {
            id: 'p1',
            type: 'component',
            component: 'mfui.timeline',
            spec: timelineSpec,
          },
        ],
      },
      {
        components: [timeline],
      },
    );
    const response = new Response(encodeSse(messageToEvents(message)), {
      headers: {
        'Content-Type': 'text/event-stream',
      },
    });

    const projected = await readMFUIMessage(response);

    expect(projected?.id).toBe('msg_1');
    expect(projected?.portableText).toContain('### Launch plan');
  });

  it('streams projected message snapshots from an MFUI response', async () => {
    const message = projectMessage(
      {
        id: 'msg_1',
        parts: [
          {
            id: 'p1',
            type: 'text',
            content: 'Here is the plan:',
          },
          {
            id: 'p2',
            type: 'component',
            component: 'mfui.timeline',
            spec: timelineSpec,
          },
        ],
      },
      {
        components: [timeline],
      },
    );
    const response = new Response(encodeSse(messageToEvents(message)), {
      headers: {
        'Content-Type': 'text/event-stream',
      },
    });
    const snapshots = [];

    for await (const snapshot of streamMFUIMessage(response)) {
      snapshots.push(snapshot);
    }

    expect(snapshots.length).toBeGreaterThan(1);
    expect(snapshots.at(-1)?.portableText).toContain('### Launch plan');
  });

  it('throws response text for failed MFUI responses', async () => {
    const response = new Response('Unauthorized', { status: 401 });

    await expect(readMFUIMessage(response)).rejects.toThrow('Unauthorized');
  });

  it('reads SSE events split across chunks', async () => {
    const sse = [
      'event: message.start',
      'data: {"id":"msg_1"}',
      '',
      'event: text.delta',
      'data: {"partId":"p1","text":"Hello"}',
      '',
    ].join('\n');
    const chunks = [sse.slice(0, 17), sse.slice(17, 37), sse.slice(37)];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      },
    });

    const events = [];
    for await (const event of readSemanticStream(stream)) {
      events.push(event);
    }

    expect(events).toEqual([
      {
        type: 'message.start',
        id: 'msg_1',
      },
      {
        type: 'text.delta',
        partId: 'p1',
        text: 'Hello',
      },
    ]);
  });

  it('creates an MFUI request manifest from component definitions', () => {
    const manifest = createMFUIManifest({
      components: [timelineDefinition],
      layouts: [columnsLayout],
    });

    expect(manifest.components).toEqual([
      expect.objectContaining({
        name: 'mfui.timeline',
        projection: expect.objectContaining({
          text: expect.stringContaining('{{ title }}'),
        }),
      }),
    ]);
    expect(manifest.layouts).toEqual([
      expect.objectContaining({
        name: 'mfui.columns',
      }),
    ]);
  });

  it('exports all builtin component definitions', () => {
    expect(builtinComponentDefinitions).toEqual([
      alertDefinition,
      timelineDefinition,
      formDefinition,
      barChartDefinition,
      lineChartDefinition,
      pieChartDefinition,
    ]);
  });

  it('exports all builtin layouts', () => {
    expect(builtinLayouts).toEqual([columnsLayout]);
  });

  it('accumulates semantic stream events into messages', () => {
    const message = projectMessage(
      {
        id: 'msg_1',
        parts: [
          {
            id: 'p1',
            type: 'component',
            component: 'mfui.timeline',
            spec: timelineSpec,
          },
        ],
      },
      {
        components: [timeline],
      },
    );

    const accumulator = createMessageAccumulator();
    for (const event of messageToEvents(message)) {
      accumulator.apply(event);
    }

    expect(accumulator.getPortableText('msg_1')).toContain('### Launch plan');
  });
});
