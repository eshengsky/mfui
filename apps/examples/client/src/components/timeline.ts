import { defineMFUIComponent } from '@mfui/client';
import { z } from 'zod';

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
  name: 'app.timeline',
  schema: timelineSchema,
  model: {
    description: 'Show release plans, schedules, milestones, and timelines.',
    whenToUse:
      'Use this when the user asks for a launch plan, release plan, schedule, or milestone list.',
  },
  projection: {
    text: `### {{ title }}

{% for item in items %}
- {{ item.time }}: {{ item.title }}{% if item.description %} - {{ item.description }}{% endif %}
{% endfor %}`,
  },
});
