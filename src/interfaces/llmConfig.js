import config from '#config';

export const LLM_CONFIG = {
  host: 'localhost',
  port: config.ENV.LLM_PORT,
  model: config.ENV.LLM_MODEL
};

export function getLLMEndpoint() {
  return `http://${LLM_CONFIG.host}:${LLM_CONFIG.port}`;
}
