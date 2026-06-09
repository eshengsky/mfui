import { z } from 'zod';

import { defineMFUIComponent } from '../component.js';

const barChartDataPointSchema = z.object({
  label: z.string(),
  value: z.number(),
  series: z.string().optional(),
});

export const barChartSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  unit: z.string().optional(),
  data: z.array(barChartDataPointSchema).min(1).max(100),
});

export type BarChartSpec = z.infer<typeof barChartSchema>;

export const barChartDefinition = defineMFUIComponent<BarChartSpec>({
  name: 'mfui.bar_chart',
  schema: barChartSchema,
  model: {
    description:
      'Show numeric values as bars for category comparison or grouped comparison.',
    whenToUse:
      'Use this when the answer compares numeric values across categories. Use the optional series field for grouped bars. Keep data concise and do not exceed 100 points.',
    examples: [
      {
        user: 'Compare signups by channel this week.',
        spec: {
          title: 'Weekly signups by channel',
          xLabel: 'Channel',
          yLabel: 'Signups',
          unit: 'users',
          data: [
            { label: 'Organic', value: 1240 },
            { label: 'Paid', value: 860 },
            { label: 'Referral', value: 420 },
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

{% if xLabel %}X: {{ xLabel }}
{% endif %}{% if yLabel %}Y: {{ yLabel }}
{% endif %}{% if unit %}Unit: {{ unit }}
{% endif %}
{% for point in data %}
- {{ point.label }}{% if point.series %} / {{ point.series }}{% endif %}: {{ point.value }}
{% endfor %}`,
  },
});
