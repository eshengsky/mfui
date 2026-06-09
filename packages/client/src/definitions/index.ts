import type { MFUIComponentDefinition } from '../component.js';

import { alertDefinition } from './alert.js';
import { timelineDefinition } from './timeline.js';
import { formDefinition } from './form.js';
import { barChartDefinition } from './bar-chart.js';
import { lineChartDefinition } from './line-chart.js';
import { pieChartDefinition } from './pie-chart.js';

export { alertDefinition, alertSchema, type AlertSpec } from './alert.js';
export { timelineDefinition, timelineSchema, type TimelineSpec } from './timeline.js';
export {
  formDefinition,
  formFieldSchema,
  formSchema,
  type FormFieldSpec,
  type FormSpec,
} from './form.js';
export {
  barChartDefinition,
  barChartSchema,
  type BarChartSpec,
} from './bar-chart.js';
export {
  lineChartDefinition,
  lineChartSchema,
  type LineChartSpec,
} from './line-chart.js';
export {
  pieChartDefinition,
  pieChartSchema,
  type PieChartSpec,
} from './pie-chart.js';

export const builtinComponentDefinitions: MFUIComponentDefinition[] = [
  alertDefinition,
  timelineDefinition,
  formDefinition,
  barChartDefinition,
  lineChartDefinition,
  pieChartDefinition,
];
