export const getInternalApiUrl = (): string => {
  return process.env.INTERNAL_API_URL || 'http://localhost:3000/api/v1';
};

export const getInternalApiKey = (): string => {
  return process.env.INTERNAL_API_KEY || 'change-this-core-api-key';
};

export const getSalesAppOrigin = (): string => {
  return process.env.SALES_APP_ORIGIN || 'http://localhost:3001';
};

export const getN8nFormWebhookUrl = (): string => {
  if (process.env.N8N_FORM_WEBHOOK_URL) return process.env.N8N_FORM_WEBHOOK_URL;
  // If running in docker environment (INTERNAL_API_URL has 'api:')
  if (process.env.INTERNAL_API_URL?.includes('api:')) {
    return 'http://n8n:5678/webhook/wf07/form';
  }
  return 'http://localhost:5678/webhook/wf07/form';
};
