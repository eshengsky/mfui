import { z } from 'zod';

import { defineMFUIComponent } from '../component.js';

const baseFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  description: z.string().optional(),
  required: z.boolean().optional(),
});

const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
  description: z.string().optional(),
});

const inputFieldSchema = baseFieldSchema.extend({
  type: z.literal('input'),
  inputType: z.enum(['text', 'email', 'password', 'url', 'tel', 'number']).optional(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
});

const textareaFieldSchema = baseFieldSchema.extend({
  type: z.literal('textarea'),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
});

const choiceFieldSchema = baseFieldSchema.extend({
  type: z.literal('choice'),
  options: z.array(optionSchema).min(1),
  multiple: z.boolean().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.union([z.string(), z.array(z.string())]).optional(),
});

const switchFieldSchema = baseFieldSchema.extend({
  type: z.literal('switch'),
  defaultValue: z.boolean().optional(),
});

const dateFieldSchema = baseFieldSchema.extend({
  type: z.literal('date'),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
});

const timeFieldSchema = baseFieldSchema.extend({
  type: z.literal('time'),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
});

const dateTimeFieldSchema = baseFieldSchema.extend({
  type: z.literal('datetime'),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
});

export const formFieldSchema = z.discriminatedUnion('type', [
  inputFieldSchema,
  textareaFieldSchema,
  choiceFieldSchema,
  switchFieldSchema,
  dateFieldSchema,
  timeFieldSchema,
  dateTimeFieldSchema,
]);

export const formSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(formFieldSchema).min(1),
  submitText: z.string().optional(),
});

export type FormFieldSpec = z.infer<typeof formFieldSchema>;
export type FormSpec = z.infer<typeof formSchema>;

export const formDefinition = defineMFUIComponent<FormSpec>({
  name: 'mfui.form',
  schema: formSchema,
  model: {
    description:
      'Show a short form that asks the user to provide structured information.',
    whenToUse:
      'Use this when the assistant needs user-provided values before continuing. The app decides what happens when the user submits the form.',
    examples: [
      {
        user: 'Ask me for the information needed to create a travel plan.',
        spec: {
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
                { label: 'Packed', value: 'packed' },
              ],
            },
            {
              type: 'date',
              name: 'startDate',
              label: 'Start date',
            },
          ],
          submitText: 'Create plan',
        },
      },
    ],
  },
  projection: {
    text: `### {{ title }}
{% if description %}
{{ description }}
{% endif %}

{% for field in fields %}
- {{ field.label }} ({{ field.type }}{% if field.required %}, required{% endif %}){% if field.options %}: {% for option in field.options %}{{ option.label }}{% unless forloop.last %}, {% endunless %}{% endfor %}{% endif %}
{% endfor %}
{% if submitText %}

Submit: {{ submitText }}
{% endif %}`,
  },
});
