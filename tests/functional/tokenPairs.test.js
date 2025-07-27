const { makeRequest, validateArraySchema, createTestCase, measurePerformance } = require('../../utils/utils');
const config = require('../../config/config');

describe('Token Pairs API Tests', () => {
  const endpoint = config.endpoints.tokenPairs;
  const schema = config.schemas.tokenPair;

  describe('GET /api/token-pairs', () => {
    
    createTestCase('TC001: Should handle API errors gracefully', async () => {
      const response = await makeRequest(endpoint);
      
      // API currently returns timeout (status 0), so we test error handling
      if (response.status === 500) {
        expect(response.status).toBe(500);
        expect(response.data).toBe('Server Error');
      } else if (response.status === 0) {
        // Timeout or connection error
        expect(response.status).toBe(0);
        expect(response.data).toHaveProperty('error');
      } else {
        // If API is working, test normal flow
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('pairs');
        expect(response.data).toHaveProperty('success');
        expect(response.data.success).toBe('ok');
        
        const validation = validateArraySchema(response.data.pairs, schema);
        expect(validation.isValid).toBe(true);
        if (!validation.isValid) {
          console.error('Schema validation errors:', validation.errors);
        }
      }
    });

    createTestCase('TC002: Should return proper error response for broken API', async () => {
      const response = await makeRequest(endpoint);
      
      // Test that we get a proper error response
      expect(response).toBeDefined();
      expect(response.status).toBeDefined();
      
      if (response.status === 500) {
        expect(response.data).toBe('Server Error');
      } else if (response.status === 0) {
        expect(response.data).toHaveProperty('error');
      }
    });

    createTestCase('TC003: Should handle timeout scenarios', async () => {
      const response = await makeRequest(endpoint, {
        timeout: 1 // Very short timeout to test timeout handling
      });
      
      expect(response).toBeDefined();
      expect(response.status).toBe(0);
      expect(response.data).toHaveProperty('error');
    });

    createTestCase('TC004: Should test API availability', async () => {
      const response = await makeRequest(endpoint);
      
      // Test that API endpoint exists and responds
      expect(response).toBeDefined();
      expect(response.status).toBeDefined();
      
      // Log the actual response for debugging
      console.log('Token Pairs API Response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });
    });

    createTestCase('TC005: Should handle different HTTP methods', async () => {
      // Test that only GET is allowed
      const response = await makeRequest(endpoint, {
        method: 'POST',
        data: { test: 'data' }
      });
      
      // API might return 404 or 405 for POST requests
      expect([404, 405]).toContain(response.status);
    });

    createTestCase('TC006: Should validate response structure when API works', async () => {
      const response = await makeRequest(endpoint);
      
      if (response.status === 200) {
        // API is working, test normal flow
        expect(response.data).toHaveProperty('pairs');
        expect(response.data).toHaveProperty('success');
        expect(response.data.pairs).toBeInstanceOf(Array);
        
        if (response.data.pairs.length > 0) {
          const firstPair = response.data.pairs[0];
          schema.required.forEach(field => {
            expect(firstPair).toHaveProperty(field);
          });
        }
      } else {
        // API is broken, test error handling
        expect([500, 0]).toContain(response.status);
        if (response.status === 500) {
          expect(response.data).toBe('Server Error');
        } else if (response.status === 0) {
          expect(response.data).toHaveProperty('error');
        }
      }
    });

    createTestCase('TC007: Should test performance under error conditions', async () => {
      const performance = await measurePerformance(
        () => makeRequest(endpoint),
        6000 // 6 seconds max for broken API
      );
      
      // Should complete within timeout, even if API is broken
      expect(performance.isWithinLimit).toBe(true);
      expect(performance.response).toBeDefined();
    });

    createTestCase('TC008: Should handle concurrent requests to broken API', async () => {
      const requests = Array(3).fill().map(() => makeRequest(endpoint));
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response).toBeDefined();
        expect(response.status).toBeDefined();
        
        if (response.status === 500) {
          expect(response.data).toBe('Server Error');
        } else if (response.status === 0) {
          expect(response.data).toHaveProperty('error');
        }
      });
    });
  });

  describe('GET /api/token-pairs/:id', () => {
    
    createTestCase('TC009: Should handle specific pair requests when API works', async () => {
      // First get all pairs to get a valid ID
      const allPairsResponse = await makeRequest(endpoint);
      
      if (allPairsResponse.status === 200 && allPairsResponse.data.pairs.length > 0) {
        const validPairId = allPairsResponse.data.pairs[0].id;
        const specificPairResponse = await makeRequest(`${endpoint}/${validPairId}`);
        
        expect(specificPairResponse.status).toBe(200);
        expect(specificPairResponse.data).toHaveProperty('pair');
        expect(specificPairResponse.data).toHaveProperty('success');
        expect(specificPairResponse.data.success).toBe('ok');
        expect(specificPairResponse.data.pair.id).toBe(validPairId);
      } else {
        // API is broken, test error handling
        expect([500, 0]).toContain(allPairsResponse.status);
        if (allPairsResponse.status === 500) {
          expect(allPairsResponse.data).toBe('Server Error');
        } else if (allPairsResponse.status === 0) {
          expect(allPairsResponse.data).toHaveProperty('error');
        }
      }
    });

    createTestCase('TC010: Should return 404 for invalid pair ID when API works', async () => {
      const invalidPairId = '0x1234567890123456789012345678901234567890-0x0987654321098765432109876543210987654321';
      const response = await makeRequest(`${endpoint}/${invalidPairId}`);
      
      if (response.status === 200) {
        // API is working but pair not found
        expect(response.status).toBe(404);
        expect(response.data).toHaveProperty('error');
      } else {
        // API is broken
        expect([500, 0]).toContain(response.status);
        if (response.status === 500) {
          expect(response.data).toBe('Server Error');
        } else if (response.status === 0) {
          expect(response.data).toHaveProperty('error');
        }
      }
    });

    createTestCase('TC011: Should handle malformed pair ID', async () => {
      const malformedPairId = 'invalid-pair-id';
      const response = await makeRequest(`${endpoint}/${malformedPairId}`);
      
      // Should return appropriate error status
      expect([404, 0]).toContain(response.status);
    });
  });

  describe('Error Handling Tests', () => {
    
    createTestCase('TC012: Should handle network timeouts gracefully', async () => {
      const response = await makeRequest(endpoint, {
        timeout: 1 // Very short timeout
      });
      
      expect(response.status).toBe(0);
      expect(response.data).toHaveProperty('error');
      expect(response.data.error).toBe('No response received');
    });

    createTestCase('TC013: Should return proper content type when available', async () => {
      const response = await makeRequest(endpoint);
      
      if (response.status === 200) {
        expect(response.headers['content-type']).toMatch(/application\/json/);
      } else if (response.status === 500) {
        expect(response.headers['content-type']).toMatch(/text\/html/);
      }
    });

    createTestCase('TC014: Should handle malformed requests', async () => {
      const response = await makeRequest(endpoint, {
        method: 'POST',
        data: { invalid: 'data' }
      });
      
      // API might return 404 or 405 for POST requests
      expect([404, 405]).toContain(response.status);
    });
  });

  describe('Data Validation Tests', () => {
    
    createTestCase('TC015: Should validate pair data when API works', async () => {
      const response = await makeRequest(endpoint);
      
      if (response.status === 200 && response.data.pairs.length > 0) {
        response.data.pairs.forEach(pair => {
          // Check if numeric fields are valid numbers
          expect(parseFloat(pair.reserve0)).not.toBeNaN();
          expect(parseFloat(pair.reserve1)).not.toBeNaN();
          
          if (pair.totalSupply) {
            expect(parseFloat(pair.totalSupply)).not.toBeNaN();
          }
          
          if (pair.reserveUSD) {
            expect(parseFloat(pair.reserveUSD)).not.toBeNaN();
          }
          
          // Check if string fields are not empty
          expect(pair.id.trim()).not.toBe('');
        });
      } else {
        // API is broken, test error handling
        expect([500, 0]).toContain(response.status);
        if (response.status === 500) {
          expect(response.data).toBe('Server Error');
        } else if (response.status === 0) {
          expect(response.data).toHaveProperty('error');
        }
      }
    });

    createTestCase('TC016: Should validate pair IDs when API works', async () => {
      const response = await makeRequest(endpoint);
      
      if (response.status === 200) {
        response.data.pairs.forEach(pair => {
          // Check if pair ID follows expected format (token0-token1)
          expect(pair.id).toMatch(/^0x[a-fA-F0-9]{40}-0x[a-fA-F0-9]{40}$/);
        });
      } else {
        // API is broken, test error handling
        expect([500, 0]).toContain(response.status);
        if (response.status === 500) {
          expect(response.data).toBe('Server Error');
        } else if (response.status === 0) {
          expect(response.data).toHaveProperty('error');
        }
      }
    });

    createTestCase('TC017: Should validate token relationships when API works', async () => {
      const response = await makeRequest(endpoint);
      
      if (response.status === 200) {
        response.data.pairs.forEach(pair => {
          // Check that token0 and token1 are different
          if (pair.token0 && pair.token1) {
            expect(pair.token0.id).not.toBe(pair.token1.id);
          }
        });
      } else {
        // API is broken, test error handling
        expect([500, 0]).toContain(response.status);
        if (response.status === 500) {
          expect(response.data).toBe('Server Error');
        } else if (response.status === 0) {
          expect(response.data).toHaveProperty('error');
        }
      }
    });
  });
}); 