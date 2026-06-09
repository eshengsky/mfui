import { z } from 'zod';

import { defineMFUIComponent } from '../component.js';

export const alertSchema = z.object({
  type: z.enum(['info', 'success', 'warning', 'error']),
  title: z.string().optional(),
  description: z.string(),
});

export type AlertSpec = z.infer<typeof alertSchema>;

export const alertDefinition = defineMFUIComponent<AlertSpec>({
  name: 'mfui.alert',
  schema: alertSchema,
  model: {
    description:
      'Show an important contextual message such as information, success, warning, or error.',
    whenToUse:
      'Use this when the answer contains a short notice that should stand out from normal prose.',
    examples: [
      {
        user: 'Warn me about deployment risk.',
        spec: {
          type: 'warning',
          title: 'Deployment risk',
          description: 'Database migrations need a rollback plan.',
        },
      },
    ],
  },
  projection: {
    text: `{% if title %}{{ type }}: {{ title }}

{{ description }}{% else %}{{ type }}: {{ description }}{% endif %}`,
  },
});
