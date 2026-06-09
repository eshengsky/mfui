import type { LayoutManifest } from '@mfui/protocol';

export type MFUILayoutDefinition = {
  name: string;
  manifest: LayoutManifest;
  toManifest(): LayoutManifest;
};

const columnsLayoutManifest: LayoutManifest = {
  name: 'mfui.columns',
  model: {
    description:
      'Arrange two or three cells side by side. Each cell contains either portable text or one semantic component.',
    whenToUse:
      'Use this when two or three related pieces of content are clearer side by side. Do not use it to express comparison semantics; use a semantic comparison component for that.',
    examples: [
      {
        user: 'Show the recommendation and next steps side by side.',
        spec: {
          layout: 'mfui.columns',
          columns: [
            {
              text: '### Recommendation\nShip behind a feature flag.',
            },
            {
              component: 'mfui.timeline',
              spec: {
                title: 'Next steps',
                items: [
                  {
                    time: 'Today',
                    title: 'Prepare rollout checklist',
                  },
                  {
                    time: 'Tomorrow',
                    title: 'Enable feature flag for beta users',
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  },
};

export const columnsLayout: MFUILayoutDefinition = {
  name: columnsLayoutManifest.name,
  manifest: columnsLayoutManifest,
  toManifest() {
    return columnsLayoutManifest;
  },
};
