import { z } from 'zod';

import { defineMFUIComponent } from '../component.js';

const pieChartDataPointSchema = z.object({
  label: z.string(),
  value: z.number().nonnegative(),
});

export const pieChartSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  unit: z.string().optional(),
  data: z.array(pieChartDataPointSchema).min(1).max(100),
});

export type PieChartSpec = z.infer<typeof pieChartSchema>;

export const pieChartDefinition = defineMFUIComponent<PieChartSpec>({
  name: 'mfui.pie_chart',
  schema: pieChartSchema,
  model: {
    description:
      'Show non-negative numeric values as parts of a whole.',
    whenToUse:
      'Use this when the answer describes share, composition, allocation, or distribution across categories. Keep data concise and do not exceed 100 points.',
    examples: [
      {
        user: 'Show traffic source share.',
        spec: {
          title: 'Traffic source share',
          unit: '%',
          data: [
            { label: 'Search', value: 48 },
            { label: 'Direct', value: 32 },
            { label: 'Referral', value: 20 },
          ],
        },
      },
    ],
  },
  projection: {
    text: `### {{ title }}
{% if description %}
{{ description }}
{% endif %}

{% if unit %}Unit: {{ unit }}
{% endif %}
{% for item in data %}
- {{ item.label }}: {{ item.value }}
{% endfor %}`,
  },
});
