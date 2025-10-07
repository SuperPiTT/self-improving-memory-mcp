import { expect } from 'chai';
import { retryWithBackoff, retryWithTimeout, CircuitBreaker, RetryPredicates } from '../../src/utils/retry.js';

describe('Retry Utilities', () => {
  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        return 'success';
      };

      const result = await retryWithBackoff(operation);
      expect(result).to.equal('success');
      expect(attempts).to.equal(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Temporary failure');
        return 'success';
      };

      const result = await retryWithBackoff(operation, { maxAttempts: 5, initialDelay: 10 });
      expect(result).to.equal('success');
      expect(attempts).to.equal(3);
    });

    it('should throw after max attempts', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        throw new Error('Permanent failure');
      };

      try {
        await retryWithBackoff(operation, { maxAttempts: 3, initialDelay: 10 });
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).to.equal('Permanent failure');
        expect(attempts).to.equal(3);
      }
    });

    it('should respect shouldRetry predicate', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        const error = new Error('Non-retryable');
        error.code = 'NO_RETRY';
        throw error;
      };

      const shouldRetry = (error) => error.code !== 'NO_RETRY';

      try {
        await retryWithBackoff(operation, { maxAttempts: 5, shouldRetry, initialDelay: 10 });
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).to.equal('Non-retryable');
        expect(attempts).to.equal(1); // No retries
      }
    });

    it('should call onRetry callback', async () => {
      let attempts = 0;
      let retryCallbacks = 0;

      const operation = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Retry me');
        return 'success';
      };

      const onRetry = (error, attempt, delay) => {
        retryCallbacks++;
        expect(error.message).to.equal('Retry me');
        expect(typeof delay).to.equal('number');
      };

      await retryWithBackoff(operation, { maxAttempts: 5, onRetry, initialDelay: 10 });
      expect(retryCallbacks).to.equal(2); // 2 retries before success
    });

    it('should use exponential backoff', async () => {
      let attempts = 0;
      const delays = [];

      const operation = async () => {
        attempts++;
        if (attempts < 4) throw new Error('Keep retrying');
        return 'success';
      };

      const onRetry = (error, attempt, delay) => {
        delays.push(delay);
      };

      await retryWithBackoff(operation, {
        maxAttempts: 5,
        initialDelay: 100,
        backoffFactor: 2,
        onRetry,
        maxDelay: 10000
      });

      expect(delays.length).to.equal(3);
      expect(delays[0]).to.equal(100);
      expect(delays[1]).to.equal(200);
      expect(delays[2]).to.equal(400);
    });

    it('should respect maxDelay', async () => {
      let attempts = 0;
      const delays = [];

      const operation = async () => {
        attempts++;
        if (attempts < 5) throw new Error('Keep retrying');
        return 'success';
      };

      const onRetry = (error, attempt, delay) => {
        delays.push(delay);
      };

      await retryWithBackoff(operation, {
        maxAttempts: 10,
        initialDelay: 100,
        backoffFactor: 3,
        maxDelay: 500,
        onRetry
      });

      // Should cap at maxDelay
      expect(delays[0]).to.equal(100);
      expect(delays[1]).to.equal(300);
      expect(delays[2]).to.equal(500); // Capped
      expect(delays[3]).to.equal(500); // Stays capped
    });
  });

  describe('retryWithTimeout', () => {
    it('should complete before timeout', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'success';
      };

      const result = await retryWithTimeout(operation, 1000, { maxAttempts: 3, initialDelay: 10 });
      expect(result).to.equal('success');
    });

    it('should timeout if operation takes too long', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return 'success';
      };

      try {
        await retryWithTimeout(operation, 100, { maxAttempts: 1, initialDelay: 10 });
        throw new Error('Should have timed out');
      } catch (error) {
        expect(error.message).to.include('timed out');
      }
    });
  });

  describe('CircuitBreaker', () => {
    it('should start in CLOSED state', () => {
      const breaker = new CircuitBreaker();
      expect(breaker.state).to.equal('CLOSED');
    });

    it('should execute operation in CLOSED state', async () => {
      const breaker = new CircuitBreaker();
      const operation = async () => 'success';

      const result = await breaker.execute(operation);
      expect(result).to.equal('success');
      expect(breaker.state).to.equal('CLOSED');
    });

    it('should open circuit after threshold failures', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeout: 1000 });
      const operation = async () => {
        throw new Error('Failure');
      };

      // Trigger failures
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      expect(breaker.state).to.equal('OPEN');
      expect(breaker.failures).to.equal(3);
    });

    it('should reject immediately when OPEN', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 10000 });
      const operation = async () => {
        throw new Error('Failure');
      };

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      expect(breaker.state).to.equal('OPEN');

      // Next call should be rejected immediately
      try {
        await breaker.execute(operation);
        throw new Error('Should have been rejected');
      } catch (error) {
        expect(error.message).to.include('Circuit breaker is OPEN');
      }
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 100 });
      const operation = async () => {
        throw new Error('Failure');
      };

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      expect(breaker.state).to.equal('OPEN');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Next call should try again (HALF_OPEN)
      const successOperation = async () => 'recovery';
      const result = await breaker.execute(successOperation);

      expect(result).to.equal('recovery');
      expect(breaker.state).to.equal('HALF_OPEN'); // Still HALF_OPEN, need 3 successes to close

      // After 2 more successes, it should close
      await breaker.execute(successOperation);
      await breaker.execute(successOperation);
      expect(breaker.state).to.equal('CLOSED');
    });

    it('should close circuit after successful execution in HALF_OPEN', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 100 });
      let callCount = 0;

      const operation = async () => {
        callCount++;
        if (callCount <= 2) throw new Error('Initial failures');
        return 'recovered';
      };

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      expect(breaker.state).to.equal('OPEN');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // First successful call puts it in HALF_OPEN, need 3 successes to CLOSE
      await breaker.execute(operation);
      expect(breaker.state).to.equal('HALF_OPEN');

      await breaker.execute(operation);
      expect(breaker.state).to.equal('HALF_OPEN');

      await breaker.execute(operation);
      expect(breaker.state).to.equal('CLOSED');
      expect(breaker.failures).to.equal(0);
    });

    it('should reset success count on failure', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3 });
      const successOp = async () => 'ok';
      const failOp = async () => { throw new Error('fail'); };

      // Some successes
      await breaker.execute(successOp);
      await breaker.execute(successOp);

      // One failure
      try {
        await breaker.execute(failOp);
      } catch (error) {
        // Expected
      }

      expect(breaker.state).to.equal('CLOSED'); // Still closed, below threshold
      expect(breaker.failures).to.equal(1);
    });
  });

  describe('RetryPredicates', () => {
    it('should identify network errors', () => {
      const networkError = new Error('ECONNREFUSED');
      networkError.code = 'ECONNREFUSED';

      expect(RetryPredicates.isNetworkError(networkError)).to.be.true;

      const normalError = new Error('Regular error');
      expect(RetryPredicates.isNetworkError(normalError)).to.be.false;
    });

    it('should identify database errors', () => {
      const dbError = new Error('Database locked');
      dbError.code = 'SQLITE_BUSY';

      expect(RetryPredicates.isDatabaseError(dbError)).to.be.true;

      const normalError = new Error('Regular error');
      expect(RetryPredicates.isDatabaseError(normalError)).to.be.false;
    });

    it('should combine predicates with any()', () => {
      const networkError = new Error('ECONNREFUSED');
      networkError.code = 'ECONNREFUSED';

      const dbError = new Error('Database locked');
      dbError.code = 'SQLITE_BUSY';

      const normalError = new Error('Regular');

      const combined = RetryPredicates.any(
        RetryPredicates.isNetworkError,
        RetryPredicates.isDatabaseError
      );

      expect(combined(networkError)).to.be.true;
      expect(combined(dbError)).to.be.true;
      expect(combined(normalError)).to.be.false;
    });

    it('should always retry with always predicate', () => {
      const error = new Error('Any error');
      expect(RetryPredicates.always(error)).to.be.true;
    });

    it('should never retry with never predicate', () => {
      const error = new Error('Any error');
      expect(RetryPredicates.never(error)).to.be.false;
    });
  });
});
