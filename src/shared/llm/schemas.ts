export const TRANSLATION_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    translations: { type: 'array', items: { type: 'string' } },
  },
  required: ['translations'],
  additionalProperties: false,
};
