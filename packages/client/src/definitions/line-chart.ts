import { z } from 'zod';

import { defineMFUIComponent } from '../component.js';

const lineChartDataPointSchema = z.object({
  label: z.string(),
  value: z.number(),
  series: z.string().optional(),
});

export const lineChartSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  unit: z.string().optional(),
  data: z.array(lineChartDataPointSchema).min(1).max(100),
});

export type LineChartSpec = z.infer<typeof lineChartSchema>;

export const lineChartDefinition = defineMFUIComponent<LineChartSpec>({
  name: 'mfui.line_chart',
  schema: lineChartSchema,
  model: {
    description:
      'Show numeric values as one or more ordered lines over time or another ordered axis.',
    whenToUse:
      'Use this when the answer describes a trend, sequence, or ordered comparison. Use the optional series field for multiple lines. Keep data concise and do not exceed 100 points.',
    examples: [
      {
        user: 'Show monthly revenue trend for the last quarter.',
        spec: {
          title: 'Monthly revenue',
          xLabel: 'Month',
          yLabel: 'Revenue',
          unit: 'USD',
          data: [
            { label: 'April', value: 92000 },
            { label: 'May', value: 104000 },
            { label: 'June', value: 118000 },
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
