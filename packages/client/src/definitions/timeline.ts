import { z } from 'zod';

import { defineMFUIComponent } from '../component.js';

export const timelineSchema = z.object({
  title: z.string(),
  items: z.array(
    z.object({
      time: z.string(),
      title: z.string(),
      description: z.string().optional(),
    }),
  ).min(1),
});

export type TimelineSpec = z.infer<typeof timelineSchema>;

export const timelineDefinition = defineMFUIComponent<TimelineSpec>({
  name: 'mfui.timeline',
  schema: timelineSchema,
  model: {
    description: 'Show ordered events, plans, milestones, and schedules.',
    whenToUse:
      'Use this when the answer contains chronological steps or dated milestones.',
    examples: [
      {
        user: 'Create a launch plan timeline.',
        spec: {
          title: 'Launch plan',
          items: [
            {
              time: 'Week 1',
              title: 'Canary',
              description: 'Open to internal users.',
            },
            {
              time: 'Week 2',
              title: 'General availability',
            },
          ],
        },
      },
    ],
  },
  projection: {
    text: `### {{ title }}

{% for item in items %}
- {{ item.time }}: {{ item.title }}{% if item.description %} - {{ item.description }}{% endif %}
{% endfor %}`,
  },
});
