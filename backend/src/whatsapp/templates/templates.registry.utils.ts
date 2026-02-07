import { Logger } from '@nestjs/common';
import { ZodError } from 'zod';
import {
  templatesRegistry,
  type TemplateKey,
  type TemplatePayload,
} from './templates.registry';

const logger = new Logger('TemplatesRegistry');

/**
 * Validates and returns a strongly typed payload for a given template key.
 */
export function validateTemplatePayload<K extends TemplateKey>(
  key: K,
  payload: unknown,
): TemplatePayload<K> {
  const parsed = templatesRegistry[key].schema.safeParse(payload);

  if (!parsed.success) {
    logValidationError(key, parsed.error);
    throw parsed.error;
  }

  return parsed.data as TemplatePayload<K>;
}

/**
 * Returns Twilio content SID configured for a template key, or null if missing.
 */
export function getTemplateSid<K extends TemplateKey>(key: K): string | null {
  const envKey = templatesRegistry[key].contentSidEnv;
  const sid = process.env[envKey]?.trim();

  return sid && sid.length > 0 ? sid : null;
}

/**
 * Builds Twilio contentVariables JSON using the registry's variable index mapping.
 */
export function buildContentVariables<K extends TemplateKey>(
  key: K,
  payload: TemplatePayload<K>,
): string {
  const variableMapping = templatesRegistry[key].variables;
  const payloadRecord = payload as Record<string, unknown>;

  const twilioVariables: Record<string, string> = {};

  for (const [fieldName, index] of Object.entries(variableMapping)) {
    const value = payloadRecord[fieldName];
    twilioVariables[String(index)] = stringifyTemplateValue(value);
  }

  return JSON.stringify(twilioVariables);
}

/**
 * Renders fallback plaintext text for a template key.
 */
export function renderFallbackText<K extends TemplateKey>(
  key: K,
  payload: TemplatePayload<K>,
): string {
  const fallback = templatesRegistry[key].fallbackText as (
    data: TemplatePayload<K>,
  ) => string;

  return fallback(payload);
}

function stringifyTemplateValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value === null || value === undefined) {
    return '';
  }

  return JSON.stringify(value);
}

function logValidationError(key: TemplateKey, error: ZodError): void {
  logger.error(
    `Invalid payload for WhatsApp template ${key}`,
    JSON.stringify(
      error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    ),
  );
}
