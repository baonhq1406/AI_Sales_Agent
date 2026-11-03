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

// WF-10 | Địa chỉ webhook OCR của n8n + secret. Secret chỉ nằm phía server (route /api/sales/ocr), không bao giờ gửi xuống trình duyệt.
export const getN8nOcrWebhookUrl = (): string => {
  if (process.env.N8N_OCR_WEBHOOK_URL) return process.env.N8N_OCR_WEBHOOK_URL;
  if (process.env.INTERNAL_API_URL?.includes('api:')) {
    return 'http://n8n:5678/webhook/wf10/extract';
  }
  return 'http://localhost:5678/webhook/wf10/extract';
};

export const getWf10WebhookSecret = (): string => {
  return process.env.WF10_WEBHOOK_SECRET || '';
};

// WF-09 | Keep the webhook secret server-side; never expose it to browser code.
export const getN8nKnowledgeIngestUrl = (): string => {
  if (process.env.N8N_KNOWLEDGE_INGEST_URL) {
    return process.env.N8N_KNOWLEDGE_INGEST_URL;
  }
  if (process.env.INTERNAL_API_URL?.includes('api:')) {
    return 'http://n8n:5678/webhook/wf09/ingest';
  }
  return 'http://localhost:5678/webhook/wf09/ingest';
};

export const getWf09WebhookSecret = (): string => {
  return process.env.WF09_WEBHOOK_SECRET || '';
};

// WF-11 | Keep the webhook secret server-side; never expose it to browser code.
export const getN8nCompetitorAnalysisWebhookUrl = (): string => {
  if (process.env.N8N_WF11_WEBHOOK_URL) return process.env.N8N_WF11_WEBHOOK_URL;
  if (process.env.INTERNAL_API_URL?.includes('api:')) {
    return 'http://n8n:5678/webhook/wf11/run';
  }
  return 'http://localhost:5678/webhook/wf11/run';
};

export const getWf11WebhookSecret = (): string => {
  return process.env.WF11_WEBHOOK_SECRET || '';
};
