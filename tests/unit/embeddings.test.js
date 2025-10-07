import { expect } from 'chai';
import { cosineSimilarity, euclideanDistance, normalize } from '../../src/utils/embeddings.js';

describe('Embedding Utilities', () => {
  describe('cosineSimilarity', () => {
    it('should calculate similarity for identical vectors', () => {
      const vec = [1, 0, 0, 0];
      const similarity = cosineSimilarity(vec, vec);
      expect(similarity).to.equal(1);
    });

    it('should calculate similarity for orthogonal vectors', () => {
      const vecA = [1, 0, 0, 0];
      const vecB = [0, 1, 0, 0];
      const similarity = cosineSimilarity(vecA, vecB);
      expect(similarity).to.equal(0);
    });

    it('should calculate similarity for opposite vectors', () => {
      const vecA = [1, 0, 0, 0];
      const vecB = [-1, 0, 0, 0];
      const similarity = cosineSimilarity(vecA, vecB);
      expect(similarity).to.equal(-1);
    });

    it('should calculate similarity for similar vectors', () => {
      const vecA = [1, 0, 0, 0];
      const vecB = [0.9, 0.1, 0, 0];
      const similarity = cosineSimilarity(vecA, vecB);
      expect(similarity).to.be.greaterThan(0.9);
    });

    it('should handle normalized vectors', () => {
      const vecA = normalize([3, 4, 0, 0]);
      const vecB = normalize([3, 4, 0, 0]);
      const similarity = cosineSimilarity(vecA, vecB);
      expect(similarity).to.be.closeTo(1, 0.001);
    });

    it('should throw for mismatched vector lengths', () => {
      expect(() => cosineSimilarity([1, 0], [1, 0, 0])).to.throw('Invalid vectors');
    });

    it('should throw for null vectors', () => {
      expect(() => cosineSimilarity(null, [1, 0])).to.throw('Invalid vectors');
      expect(() => cosineSimilarity([1, 0], null)).to.throw('Invalid vectors');
    });

    it('should handle zero vectors', () => {
      const vecA = [0, 0, 0, 0];
      const vecB = [1, 0, 0, 0];
      const similarity = cosineSimilarity(vecA, vecB);
      expect(similarity).to.equal(0);
    });
  });

  describe('euclideanDistance', () => {
    it('should calculate distance for identical vectors', () => {
      const vec = [1, 0, 0, 0];
      const distance = euclideanDistance(vec, vec);
      expect(distance).to.equal(0);
    });

    it('should calculate distance for orthogonal unit vectors', () => {
      const vecA = [1, 0, 0, 0];
      const vecB = [0, 1, 0, 0];
      const distance = euclideanDistance(vecA, vecB);
      expect(distance).to.be.closeTo(Math.sqrt(2), 0.001);
    });

    it('should calculate distance for opposite vectors', () => {
      const vecA = [1, 0, 0, 0];
      const vecB = [-1, 0, 0, 0];
      const distance = euclideanDistance(vecA, vecB);
      expect(distance).to.equal(2);
    });

    it('should calculate distance correctly', () => {
      const vecA = [0, 0, 0, 0];
      const vecB = [3, 4, 0, 0];
      const distance = euclideanDistance(vecA, vecB);
      expect(distance).to.equal(5); // 3-4-5 triangle
    });

    it('should throw for mismatched vector lengths', () => {
      expect(() => euclideanDistance([1, 0], [1, 0, 0])).to.throw('Invalid vectors');
    });

    it('should throw for null vectors', () => {
      expect(() => euclideanDistance(null, [1, 0])).to.throw('Invalid vectors');
      expect(() => euclideanDistance([1, 0], null)).to.throw('Invalid vectors');
    });
  });

  describe('normalize', () => {
    it('should normalize vector to unit length', () => {
      const vec = [3, 4, 0, 0];
      const normalized = normalize(vec);

      // Check length is 1
      const length = Math.sqrt(normalized.reduce((sum, val) => sum + val * val, 0));
      expect(length).to.be.closeTo(1, 0.001);
    });

    it('should preserve direction', () => {
      const vec = [3, 4, 0, 0];
      const normalized = normalize(vec);

      expect(normalized[0]).to.be.closeTo(0.6, 0.001);
      expect(normalized[1]).to.be.closeTo(0.8, 0.001);
    });

    it('should handle already normalized vectors', () => {
      const vec = [1, 0, 0, 0];
      const normalized = normalize(vec);

      expect(normalized[0]).to.equal(1);
      expect(normalized[1]).to.equal(0);
    });

    it('should handle zero vector', () => {
      const vec = [0, 0, 0, 0];
      const normalized = normalize(vec);

      // Should return original vector unchanged
      expect(normalized).to.deep.equal(vec);
    });

    it('should handle negative values', () => {
      const vec = [-3, 4, 0, 0];
      const normalized = normalize(vec);

      const length = Math.sqrt(normalized.reduce((sum, val) => sum + val * val, 0));
      expect(length).to.be.closeTo(1, 0.001);
      expect(normalized[0]).to.be.closeTo(-0.6, 0.001);
      expect(normalized[1]).to.be.closeTo(0.8, 0.001);
    });
  });

  describe('Integration', () => {
    it('should work together for similarity calculation', () => {
      const vecA = [3, 4, 0, 0];
      const vecB = [6, 8, 0, 0];

      const normA = normalize(vecA);
      const normB = normalize(vecB);

      const similarity = cosineSimilarity(normA, normB);
      expect(similarity).to.be.closeTo(1, 0.001); // Same direction
    });

    it('should distinguish similar from dissimilar vectors', () => {
      const base = [1, 0, 0, 0];
      const similar = [0.9, 0.1, 0, 0];
      const dissimilar = [0, 1, 0, 0];

      const simSimilar = cosineSimilarity(base, similar);
      const simDissimilar = cosineSimilarity(base, dissimilar);

      expect(simSimilar).to.be.greaterThan(simDissimilar);
    });
  });
});
