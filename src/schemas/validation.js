/**
 * Zod validation schemas for knowledge base entities
 * Ensures data integrity and type safety
 */

import { z } from 'zod';

/**
 * Entity Types - All supported entity types in the knowledge base
 */
export const EntityType = z.enum([
  // Project & Code
  'project',
  'component',
  'dependency',

  // Learning
  'error',
  'solution',
  'pattern',
  'insight',
  'decision',

  // User
  'user-intent',
  'user-preference',
  'requirement',

  // Style
  'style-rule',
  'architectural-pattern',
  'tool-preference',

  // Sessions
  'session-snapshot',
  'continuation-point',
  'work-in-progress'
]);

/**
 * Confidence score validation (0-1 range)
 */
const ConfidenceSchema = z.number()
  .min(0, 'Confidence must be >= 0')
  .max(1, 'Confidence must be <= 1');

/**
 * Entity Name validation
 */
const EntityNameSchema = z.string()
  .min(1, 'Entity name cannot be empty')
  .max(200, 'Entity name too long (max 200 chars)')
  .trim();

/**
 * Observation validation
 */
const ObservationSchema = z.string()
  .min(1, 'Observation cannot be empty')
  .max(10000, 'Observation too long (max 10000 chars)');

/**
 * Relation Type validation
 */
export const RelationTypeSchema = z.string()
  .min(1, 'Relation type cannot be empty')
  .max(100, 'Relation type too long');

/**
 * Entity Schema - For create_entities
 */
export const EntitySchema = z.object({
  name: EntityNameSchema,
  entityType: EntityType,
  observations: z.array(ObservationSchema).min(1, 'At least one observation required')
});

/**
 * Relation Schema - For create_relations
 */
export const RelationSchema = z.object({
  from: EntityNameSchema,
  to: EntityNameSchema,
  relationType: RelationTypeSchema
});

/**
 * Observation Addition Schema - For add_observations
 */
export const AddObservationSchema = z.object({
  entityName: EntityNameSchema,
  contents: z.array(ObservationSchema).min(1, 'At least one observation required')
});

/**
 * Search Query Schema - For search_nodes
 */
export const SearchQuerySchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty').max(500, 'Query too long'),
  limit: z.number().int().positive().max(100).optional()
});

/**
 * Node Names Schema - For open_nodes
 */
export const NodeNamesSchema = z.object({
  names: z.array(EntityNameSchema).min(1, 'At least one entity name required').max(50)
});

/**
 * Delete Entities Schema - For delete_entities
 */
export const DeleteEntitiesSchema = z.object({
  entityNames: z.array(EntityNameSchema).min(1, 'At least one entity name required')
});

/**
 * Delete Observations Schema - For delete_observations
 */
export const DeleteObservationsSchema = z.object({
  deletions: z.array(z.object({
    entityName: EntityNameSchema,
    observations: z.array(ObservationSchema).min(1)
  })).min(1)
});

/**
 * Delete Relations Schema - For delete_relations
 */
export const DeleteRelationsSchema = z.object({
  relations: z.array(RelationSchema).min(1)
});

/**
 * Sanitization utilities
 */
export const sanitize = {
  /**
   * Sanitize string input - remove potentially dangerous characters
   */
  string: (input) => {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
  },

  /**
   * Sanitize array of strings
   */
  stringArray: (input) => {
    if (!Array.isArray(input)) return [];
    return input.map(item => sanitize.string(item)).filter(item => item.length > 0);
  },

  /**
   * Sanitize entity name - stricter than general string
   */
  entityName: (input) => {
    const cleaned = sanitize.string(input);
    // Only allow alphanumeric, spaces, hyphens, underscores
    return cleaned.replace(/[^a-zA-Z0-9\s\-_]/g, '');
  }
};

/**
 * Validation helper - validates and throws descriptive errors
 */
export function validate(schema, data, context = 'Data') {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new Error(`${context} validation failed: ${messages}`);
    }
    throw error;
  }
}

/**
 * Safe validation - returns { success, data, error }
 */
export function validateSafe(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, error: null };
  } else {
    const messages = result.error.errors.map(err =>
      `${err.path.join('.')}: ${err.message}`
    ).join(', ');
    return { success: false, data: null, error: messages };
  }
}

/**
 * Batch validation - validates array of items
 */
export function validateBatch(schema, items, context = 'Items') {
  const results = [];
  const errors = [];

  items.forEach((item, index) => {
    const result = validateSafe(schema, item);
    if (result.success) {
      results.push(result.data);
    } else {
      errors.push({ index, error: result.error, item });
    }
  });

  return { results, errors };
}
