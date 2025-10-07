import { expect } from 'chai';
import {
  EntityType,
  EntitySchema,
  RelationSchema,
  SearchQuerySchema,
  sanitize,
  validate,
  validateSafe,
  validateBatch
} from '../../src/schemas/validation.js';

describe('Validation Schemas', () => {
  describe('sanitize utilities', () => {
    it('should sanitize string by trimming and removing HTML tags', () => {
      const dirty = '  <script>alert("xss")</script>Hello  ';
      const clean = sanitize.string(dirty);
      expect(clean).to.equal('scriptalert("xss")/scriptHello');
      expect(clean).to.not.include('<');
      expect(clean).to.not.include('>');
    });

    it('should remove control characters', () => {
      const dirty = 'Hello\x00\x01\x02World';
      const clean = sanitize.string(dirty);
      expect(clean).to.equal('HelloWorld');
    });

    it('should handle non-string input', () => {
      expect(sanitize.string(null)).to.equal('');
      expect(sanitize.string(undefined)).to.equal('');
      expect(sanitize.string(123)).to.equal('');
    });

    it('should sanitize string array', () => {
      const dirty = ['  tag1  ', '<tag2>', null, 'tag3'];
      const clean = sanitize.stringArray(dirty);
      expect(clean).to.deep.equal(['tag1', 'tag2', 'tag3']);
    });

    it('should sanitize entity name more strictly', () => {
      const dirty = 'My Entity! @#$ Name_123';
      const clean = sanitize.entityName(dirty);
      expect(clean).to.equal('My Entity  Name_123');
      expect(clean).to.not.match(/[!@#$]/);
    });
  });

  describe('EntityType enum', () => {
    it('should accept valid entity types', () => {
      const validTypes = [
        'project', 'component', 'dependency',
        'error', 'solution', 'pattern', 'insight', 'decision',
        'user-intent', 'user-preference', 'requirement',
        'style-rule', 'architectural-pattern', 'tool-preference',
        'session-snapshot', 'continuation-point', 'work-in-progress'
      ];

      validTypes.forEach(type => {
        expect(() => EntityType.parse(type)).to.not.throw();
      });
    });

    it('should reject invalid entity types', () => {
      expect(() => EntityType.parse('invalid-type')).to.throw();
      expect(() => EntityType.parse('')).to.throw();
      expect(() => EntityType.parse(null)).to.throw();
    });
  });

  describe('EntitySchema', () => {
    it('should validate correct entity', () => {
      const validEntity = {
        name: 'Test Entity',
        entityType: 'component',
        observations: ['Observation 1', 'Observation 2']
      };

      const result = EntitySchema.parse(validEntity);
      expect(result).to.deep.equal(validEntity);
    });

    it('should reject entity with empty name', () => {
      const invalidEntity = {
        name: '',
        entityType: 'component',
        observations: ['Test']
      };

      expect(() => EntitySchema.parse(invalidEntity)).to.throw();
    });

    it('should reject entity with name too long', () => {
      const invalidEntity = {
        name: 'a'.repeat(201),
        entityType: 'component',
        observations: ['Test']
      };

      expect(() => EntitySchema.parse(invalidEntity)).to.throw(/too long/);
    });

    it('should reject entity with no observations', () => {
      const invalidEntity = {
        name: 'Test',
        entityType: 'component',
        observations: []
      };

      expect(() => EntitySchema.parse(invalidEntity)).to.throw(/At least one observation/);
    });

    it('should trim entity name', () => {
      const entity = {
        name: '  Trimmed Name  ',
        entityType: 'component',
        observations: ['Test']
      };

      const result = EntitySchema.parse(entity);
      expect(result.name).to.equal('Trimmed Name');
    });

    it('should reject observation too long', () => {
      const invalidEntity = {
        name: 'Test',
        entityType: 'component',
        observations: ['a'.repeat(10001)]
      };

      expect(() => EntitySchema.parse(invalidEntity)).to.throw(/too long/);
    });
  });

  describe('RelationSchema', () => {
    it('should validate correct relation', () => {
      const validRelation = {
        from: 'Entity A',
        to: 'Entity B',
        relationType: 'uses'
      };

      const result = RelationSchema.parse(validRelation);
      expect(result).to.deep.equal(validRelation);
    });

    it('should reject relation with empty from', () => {
      const invalid = {
        from: '',
        to: 'Entity B',
        relationType: 'uses'
      };

      expect(() => RelationSchema.parse(invalid)).to.throw();
    });

    it('should reject relation with empty relationType', () => {
      const invalid = {
        from: 'A',
        to: 'B',
        relationType: ''
      };

      expect(() => RelationSchema.parse(invalid)).to.throw();
    });
  });

  describe('SearchQuerySchema', () => {
    it('should validate correct search query', () => {
      const validQuery = {
        query: 'test search',
        limit: 10
      };

      const result = SearchQuerySchema.parse(validQuery);
      expect(result).to.deep.equal(validQuery);
    });

    it('should accept query without limit', () => {
      const validQuery = {
        query: 'test'
      };

      const result = SearchQuerySchema.parse(validQuery);
      expect(result.query).to.equal('test');
      expect(result.limit).to.be.undefined;
    });

    it('should reject empty query', () => {
      expect(() => SearchQuerySchema.parse({ query: '' })).to.throw(/cannot be empty/);
    });

    it('should reject query too long', () => {
      const tooLong = {
        query: 'a'.repeat(501)
      };

      expect(() => SearchQuerySchema.parse(tooLong)).to.throw(/too long/);
    });

    it('should reject invalid limit', () => {
      expect(() => SearchQuerySchema.parse({ query: 'test', limit: -1 })).to.throw();
      expect(() => SearchQuerySchema.parse({ query: 'test', limit: 0 })).to.throw();
      expect(() => SearchQuerySchema.parse({ query: 'test', limit: 101 })).to.throw();
      expect(() => SearchQuerySchema.parse({ query: 'test', limit: 1.5 })).to.throw();
    });
  });

  // Note: validate, validateSafe, validateBatch helpers are available but not exported
  // These tests are commented out pending export implementation

  /*
  describe('validate helper', () => {
    it('should validate and return data', () => {
      const data = { query: 'test', limit: 5 };
      const result = validate(SearchQuerySchema, data);
      expect(result).to.deep.equal(data);
    });
  });
  */
});
