import { describe, expect, it } from 'vitest';
import {
  readSemanticStream,
  type MFUIManifest,
  type SemanticStreamEvent,
} from '@mfui/protocol';

import {
  assertValidMFUIManifest,
  buildLayoutCatalogText,
  buildComponentCatalogText,
  createMFUIBlockParser,
  createMFUIPrompt,
  createMFUIStreamWriter,
} from '../src/index.js';

const mfui: MFUIManifest = {
  components: [
    {
      name: 'mfui.timeline',
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                time: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
              },
              required: ['time', 'title'],
            },
          },
        },
        required: ['title', 'items'],
      },
      model: {
        description: 'Show ordered events, plans, milestones, and schedules.',
      },
      projection: {
        text: `### {{ title }}

{% for item in items %}
- {{ item.time }}: {{ item.title }}{% if item.description %} - {{ item.description }}{% endif %}
{% endfor %}`,
      },
    },
  ],
};

const timelineSpec = {
  title: 'Launch plan',
  items: [
    {
      time: '2026-06-03',
      title: 'Canary',
      description: 'Open to 10% of internal users',
    },
  ],
};

const columnsLayout = {
  name: 'mfui.columns',
  model: {
    description: 'Arrange two or three cells side by side.',
  },
};

const mfuiWithColumns: MFUIManifest = {
  ...mfui,
  layouts: [columnsLayout],
};

describe('@mfui/server', () => {
  it('builds an MFUI prompt for text with component blocks', () => {
    assertValidMFUIManifest(mfui);
    const componentCatalogText = buildComponentCatalogText(mfui);
    const mfuiPrompt = createMFUIPrompt(mfui);

    expect(mfui.components[0]?.name).toBe('mfui.timeline');
    expect(componentCatalogText).toContain('mfui.timeline');
    expect(mfuiPrompt).toContain('mfui.timeline');
    expect(mfuiPrompt).toContain('<mfui>');
    expect(mfuiPrompt).toContain('{"component":"component.name","spec":{}}');
  });

  it('treats missing or empty MFUI manifests as disabled', async () => {
    expect(
      buildComponentCatalogText(undefined as unknown as MFUIManifest),
    ).toBe('');
    expect(createMFUIPrompt(undefined as unknown as MFUIManifest)).toBe('');
    expect(createMFUIPrompt(null as unknown as MFUIManifest)).toBe('');
    expect(createMFUIPrompt({ components: [] })).toBe('');

    const writer = createMFUIStreamWriter(
      undefined as unknown as MFUIManifest,
      { id: 'msg_disabled' },
    );
    const parser = createMFUIBlockParser(
      undefined as unknown as MFUIManifest,
      writer,
    );
    const response = writer.response();

    parser.write('Plain answer.');
    parser.close();

    const events = await collectEvents(response);

    expect(events.map((event) => event.type)).toEqual([
      'message.start',
      'text.delta',
      'message.end',
    ]);
    expect(events.at(-1)).toEqual(
      expect.objectContaining({
        type: 'message.end',
        portableText: 'Plain answer.',
      }),
    );
  });

  it('rejects malformed MFUI manifests when MFUI is present', () => {
    expect(() =>
      createMFUIPrompt({} as unknown as MFUIManifest),
    ).toThrow(/mfui\.components must be an array/);
    expect(() =>
      createMFUIStreamWriter({} as unknown as MFUIManifest),
    ).toThrow(/mfui\.components must be an array/);
  });

  it('writes text deltas and component snapshots into an MFUI SSE stream', async () => {
    const writer = createMFUIStreamWriter(mfui, { id: 'msg_stream' });
    const parser = createMFUIBlockParser(mfui, writer);
    const response = writer.response();

    parser.write('Here is the plan:\n\n');
    parser.write('<mfui>');
    parser.write(JSON.stringify({
      component: 'mfui.timeline',
      spec: timelineSpec,
    }));
    parser.write('</mfui>');
    parser.close();

    const events = await collectEvents(response);

    expect(events.map((event) => event.type)).toEqual([
      'message.start',
      'text.delta',
      'component.snapshot',
      'message.end',
    ]);
    expect(events[2]).toEqual(
      expect.objectContaining({
        type: 'component.snapshot',
        component: 'mfui.timeline',
        projection: expect.objectContaining({
          text: expect.stringContaining('### Launch plan'),
        }),
      }),
    );
    expect(events.at(-1)).toEqual(
      expect.objectContaining({
        type: 'message.end',
        portableText: expect.stringContaining('### Launch plan'),
      }),
    );
  });

  it('rejects invalid component specs before projection', () => {
    const writer = createMFUIStreamWriter(mfui);

    expect(() =>
      writer.component({
        component: 'mfui.timeline',
        spec: {
          title: 'Launch plan',
          items: [
            {
              time: '2026-06-03',
            },
          ],
        },
      }),
    ).toThrow(/Invalid spec for mfui.timeline/);
  });

  it('builds a component catalog from manifests', () => {
    const catalog = buildComponentCatalogText(mfui);
    const prompt = createMFUIPrompt(mfui);

    expect(catalog).toContain('Component: mfui.timeline');
    expect(catalog).toContain('JSON Schema:');
    expect(prompt).toContain('<mfui>');
    expect(prompt).toContain('mfui.timeline');
  });

  it('builds an MFUI prompt for enabled layouts', () => {
    const layoutCatalogText = buildLayoutCatalogText(mfuiWithColumns);
    const prompt = createMFUIPrompt(mfuiWithColumns);

    expect(layoutCatalogText).toContain('Layout: mfui.columns');
    expect(layoutCatalogText).toContain('2 or 3 cells');
    expect(prompt).toContain('{"layout":"layout.name","columns":[]}');
  });

  it('writes columns layout snapshots into an MFUI SSE stream', async () => {
    const writer = createMFUIStreamWriter(mfuiWithColumns, { id: 'msg_layout' });
    const parser = createMFUIBlockParser(mfuiWithColumns, writer);
    const response = writer.response();

    parser.write('Here is the rollout view:\n\n');
    parser.write('<mfui>');
    parser.write(JSON.stringify({
      layout: 'mfui.columns',
      columns: [
        {
          text: '### Recommendation\nShip behind a feature flag.',
        },
        {
          component: 'mfui.timeline',
          spec: timelineSpec,
        },
      ],
    }));
    parser.write('</mfui>');
    parser.close();

    const events = await collectEvents(response);

    expect(events.map((event) => event.type)).toEqual([
      'message.start',
      'text.delta',
      'layout.snapshot',
      'message.end',
    ]);
    expect(events[2]).toEqual(
      expect.objectContaining({
        type: 'layout.snapshot',
        layout: 'mfui.columns',
        projection: expect.objectContaining({
          text: expect.stringContaining('### Recommendation'),
        }),
      }),
    );
    expect(events.at(-1)).toEqual(
      expect.objectContaining({
        type: 'message.end',
        portableText: expect.stringContaining('### Launch plan'),
      }),
    );
  });

  it('rejects columns layouts that are not enabled', () => {
    const writer = createMFUIStreamWriter(mfui);

    expect(() =>
      writer.layout({
        layout: 'mfui.columns',
        columns: [
          { text: 'Left' },
          { text: 'Right' },
        ],
      }),
    ).toThrow(/No layout manifest was provided for mfui\.columns/);
  });

  it('rejects invalid columns layout specs', () => {
    const writer = createMFUIStreamWriter(mfuiWithColumns);

    expect(() =>
      writer.layout({
        layout: 'mfui.columns',
        columns: [
          { text: 'Only one column' },
        ],
      }),
    ).toThrow(/2 or 3 columns/);
  });

  it('rejects ambiguous MFUI layout cells', () => {
    expect(() =>
      createMFUIBlockParser(mfuiWithColumns, createMFUIStreamWriter(mfuiWithColumns))
        .write(
          '<mfui>{"layout":"mfui.columns","columns":[{"text":"Left","component":"mfui.timeline","spec":{}},{"text":"Right"}]}</mfui>',
        ),
    ).toThrow(/exactly one of text or component/);
  });
});

function collectEvents(response: Response): Promise<SemanticStreamEvent[]> {
  const events: SemanticStreamEvent[] = [];

  return readAllEvents(response.body, events).then(() => events);
}

function readAllEvents(
  body: ReadableStream<Uint8Array> | null,
  events: SemanticStreamEvent[],
): Promise<void> {
  const iterator = readSemanticStream(body)[Symbol.asyncIterator]();

  function readNext(): Promise<void> {
    return iterator.next().then((result) => {
      if (result.done) {
        return;
      }

      events.push(result.value);
      return readNext();
    });
  }

  return readNext();
}
