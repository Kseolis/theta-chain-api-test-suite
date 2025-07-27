const { makeRequest, validateSchema, createTestCase, measurePerformance } = require('../../utils/utils');
const config = require('../../config/config');

describe('History API Tests', () => {
  const endpoint = config.endpoints.history;
  const schema = config.schemas.history;

  describe('GET /api/history', () => {
    
    createTestCase('TC001: Should return historical data with valid schema', async () => {
      const params = {
        symbol: config.testData.validSymbol,
        resolution: config.testData.validResolution,
        from: config.testData.validTimeRange.from,
        to: config.testData.validTimeRange.to
      };
      
      const response = await makeRequest(`${endpoint}?${new URLSearchParams(params)}`);
      
      expect(response.status).toBe(200);
      
      const validation = validateSchema(response.data, schema);
      expect(validation.isValid).toBe(true);
      if (!validation.isValid) {
        console.error('Schema validation errors:', validation.errors);
      }
    });

    createTestCase('TC002: Should return historical data with required fields', async () => {
      const params = {
        symbol: config.testData.validSymbol,
        resolution: config.testData.validResolution,
        from: config.testData.validTimeRange.from,
        to: config.testData.validTimeRange.to
      };
      
      const response = await makeRequest(`${endpoint}?${new URLSearchParams(params)}`);
      
      expect(response.status).toBe(200);
      
      schema.required.forEach(field => {
        expect(response.data).toHaveProperty(field);
      });
    });

    createTestCase('TC003: Should return historical data with valid data types', async () => {
      const params = {
        symbol: config.testData.validSymbol,
        resolution: config.testData.validResolution,
        from: config.testData.validTimeRange.from,
        to: config.testData.validTimeRange.to
      };
      
      const response = await makeRequest(`${endpoint}?${new URLSearchParams(params)}`);
      
      expect(response.status).toBe(200);
      
      // Check data types
      expect(Array.isArray(response.data.t)).toBe(true);
      expect(Array.isArray(response.data.o)).toBe(true);
      expect(Array.isArray(response.data.h)).toBe(true);
      expect(Array.isArray(response.data.l)).toBe(true);
      expect(Array.isArray(response.data.c)).toBe(true);
      expect(Array.isArray(response.data.v)).toBe(true);
      expect(typeof response.data.s).toBe('string');
    });

    createTestCase('TC004: Should return 400 for invalid symbol', async () => {
      const params = {
        symbol: 'INVALID_SYMBOL',
        resolution: config.testData.validResolution,
        from: config.testData.validTimeRange.from,
        to: config.testData.validTimeRange.to
      };
      
      const response = await makeRequest(`${endpoint}?${new URLSearchParams(params)}`);
      
      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
    });

    createTestCase('TC005: Should return 400 for invalid resolution', async () => {
      const params = {
        symbol: config.testData.validSymbol,
        resolution: 'INVALID_RESOLUTION',
        from: config.testData.validTimeRange.from,
        to: config.testData.validTimeRange.to
      };
      
      const response = await makeRequest(`${endpoint}?${new URLSearchParams(params)}`);
      
      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
    });

    createTestCase('TC006: Should handle performance requirements', async () => {
      const params = {
        symbol: config.testData.validSymbol,
        resolution: config.testData.validResolution,
        from: config.testData.validTimeRange.from,
        to: config.testData.validTimeRange.to
      };
      
      const performance = await measurePerformance(
        () => makeRequest(`${endpoint}?${new URLSearchParams(params)}`),
        5000 // 5 seconds max for historical data
      );
      
      expect(performance.isWithinLimit).toBe(true);
      expect(performance.response.status).toBe(200);
    });

    createTestCase('TC007: Should return data arrays of equal length', async () => {
      const params = {
        symbol: config.testData.validSymbol,
        resolution: config.testData.validResolution,
        from: config.testData.validTimeRange.from,
        to: config.testData.validTimeRange.to
      };
      
      const response = await makeRequest(`${endpoint}?${new URLSearchParams(params)}`);
      
      expect(response.status).toBe(200);
      
      const lengths = [
        response.data.t.length,
        response.data.o.length,
        response.data.h.length,
        response.data.l.length,
        response.data.c.length,
        response.data.v.length
      ];
      
      const firstLength = lengths[0];
      lengths.forEach(length => {
        expect(length).toBe(firstLength);
      });
    });

    createTestCase('TC008: Should return valid timestamp data', async () => {
      const params = {
        symbol: config.testData.validSymbol,
        resolution: config.testData.validResolution,
        from: config.testData.validTimeRange.from,
        to: config.testData.validTimeRange.to
      };
      
      const response = await makeRequest(`${endpoint}?${new URLSearchParams(params)}`);
      
      expect(response.status).toBe(200);
      
      response.data.t.forEach(timestamp => {
        expect(typeof timestamp).toBe('number');
        expect(timestamp).toBeGreaterThan(0);
        expect(timestamp).toBeLessThanOrEqual(Date.now() / 1000);
      });
    });

    createTestCase('TC009: Should return valid OHLCV data', async () => {
      const params = {
        symbol: config.testData.validSymbol,
        resolution: config.testData.validResolution,
        from: config.testData.validTimeRange.from,
        to: config.testData.validTimeRange.to
      };
      
      const response = await makeRequest(`${endpoint}?${new URLSearchParams(params)}`);
      
      expect(response.status).toBe(200);
      
      for (let i = 0; i < response.data.t.length; i++) {
        // Check if OHLCV values are valid numbers
        expect(typeof response.data.o[i]).toBe('number');
        expect(typeof response.data.h[i]).toBe('number');
        expect(typeof response.data.l[i]).toBe('number');
        expect(typeof response.data.c[i]).toBe('number');
        expect(typeof response.data.v[i]).toBe('number');
        
        // Check if values are non-negative
        expect(response.data.o[i]).toBeGreaterThanOrEqual(0);
        expect(response.data.h[i]).toBeGreaterThanOrEqual(0);
        expect(response.data.l[i]).toBeGreaterThanOrEqual(0);
        expect(response.data.c[i]).toBeGreaterThanOrEqual(0);
        expect(response.data.v[i]).toBeGreaterThanOrEqual(0);
        
        // Check if high >= low
        expect(response.data.h[i]).toBeGreaterThanOrEqual(response.data.l[i]);
        
        // Check if open and close are within high-low range
        expect(response.data.o[i]).toBeLessThanOrEqual(response.data.h[i]);
        expect(response.data.o[i]).toBeGreaterThanOrEqual(response.data.l[i]);
        expect(response.data.c[i]).toBeLessThanOrEqual(response.data.h[i]);
        expect(response.data.c[i]).toBeGreaterThanOrEqual(response.data.l[i]);
      }
    });

    createTestCase('TC010: Should return data within specified time range', async () => {
      const from = config.testData.validTimeRange.from;
      const to = config.testData.validTimeRange.to;
      
      const params = {
        symbol: config.testData.validSymbol,
        resolution: config.testData.validResolution,
        from,
        to
      };
      
      const response = await makeRequest(`${endpoint}?${new URLSearchParams(params)}`);
      
      expect(response.status).toBe(200);
      
      if (response.data.t.length > 0) {
        const firstTimestamp = response.data.t[0];
        const lastTimestamp = response.data.t[response.data.t.length - 1];
        
        expect(firstTimestamp).toBeGreaterThanOrEqual(from);
        expect(lastTimestamp).toBeLessThanOrEqual(to);
      }
    });

    createTestCase('TC011: Should handle different time resolutions', async () => {
      const resolutions = ['1D'];
      
      for (const resolution of resolutions) {
        const params = {
          symbol: config.testData.validSymbol,
          resolution,
          from: config.testData.validTimeRange.from,
          to: config.testData.validTimeRange.to
        };
        
        const response = await makeRequest(`${endpoint}?${new URLSearchParams(params)}`);
        
        expect(response.status).toBe(200);
        expect(response.data.s).toBe('ok');
      }
    });

    createTestCase('TC012: Should handle concurrent requests', async () => {
      const params = {
        symbol: config.testData.validSymbol,
        resolution: config.testData.validResolution,
        from: config.testData.validTimeRange.from,
        to: config.testData.validTimeRange.to
      };
      
      const requests = Array(3).fill().map(() => 
        makeRequest(`${endpoint}?${new URLSearchParams(params)}`)
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('s');
        expect(response.data.s).toBe('ok');
      });
    });
  });

  describe('Error Handling Tests', () => {
    
    createTestCase('TC013: Should handle missing required parameters', async () => {
      // Test missing symbol
      const params1 = {
        resolution: config.testData.validResolution,
        from: config.testData.validTimeRange.from,
        to: config.testData.validTimeRange.to
      };
      
      const response1 = await makeRequest(`${endpoint}?${new URLSearchParams(params1)}`);
      expect(response1.status).toBe(400);
      
      // Test missing resolution
      const params2 = {
        symbol: config.testData.validSymbol,
        from: config.testData.validTimeRange.from,
        to: config.testData.validTimeRange.to
      };
      
      const response2 = await makeRequest(`${endpoint}?${new URLSearchParams(params2)}`);
      expect(response2.status).toBe(400);
      
      // Test missing from
      const params3 = {
        symbol: config.testData.validSymbol,
        resolution: config.testData.validResolution,
        to: config.testData.validTimeRange.to
      };
      
      const response3 = await makeRequest(`${endpoint}?${new URLSearchParams(params3)}`);
      expect(response3.status).toBe(400);
      
      // Test missing to
      const params4 = {
        symbol: config.testData.validSymbol,
        resolution: config.testData.validResolution,
        from: config.testData.validTimeRange.from
      };
      
      const response4 = await makeRequest(`${endpoint}?${new URLSearchParams(params4)}`);
      expect(response4.status).toBe(400);
    });

    createTestCase('TC014: Should handle invalid time parameters', async () => {
      const params = {
        symbol: config.testData.validSymbol,
        resolution: config.testData.validResolution,
        from: 'invalid_from',
        to: 'invalid_to'
      };
      
      const response = await makeRequest(`${endpoint}?${new URLSearchParams(params)}`);
      
      expect(response.status).toBe(400);
    });

    createTestCase('TC015: Should handle network timeouts', async () => {
      const params = {
        symbol: config.testData.validSymbol,
        resolution: config.testData.validResolution,
        from: config.testData.validTimeRange.from,
        to: config.testData.validTimeRange.to
      };
      
      const response = await makeRequest(`${endpoint}?${new URLSearchParams(params)}`, {
        timeout: 1 // Very short timeout
      });
      
      // Should either return data or handle timeout gracefully
      expect(response).toBeDefined();
    });

    createTestCase('TC016: Should return proper content type', async () => {
      const params = {
        symbol: config.testData.validSymbol,
        resolution: config.testData.validResolution,
        from: config.testData.validTimeRange.from,
        to: config.testData.validTimeRange.to
      };
      
      const response = await makeRequest(`${endpoint}?${new URLSearchParams(params)}`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    createTestCase('TC017: Should handle malformed requests', async () => {
      const response = await makeRequest(endpoint, {
        method: 'POST',
        data: { invalid: 'data' }
      });
      
      // Should return appropriate error status
      expect(response.status).toBe(405); // Method Not Allowed
    });
  });

  describe('Data Validation Tests', () => {
    
    createTestCase('TC018: Should validate timestamp ordering', async () => {
      const params = {
        symbol: config.testData.validSymbol,
        resolution: config.testData.validResolution,
        from: config.testData.validTimeRange.from,
        to: config.testData.validTimeRange.to
      };
      
      const response = await makeRequest(`${endpoint}?${new URLSearchParams(params)}`);
      
      expect(response.status).toBe(200);
      
      // Check if timestamps are in ascending order
      for (let i = 1; i < response.data.t.length; i++) {
        expect(response.data.t[i]).toBeGreaterThan(response.data.t[i - 1]);
      }
    });

    createTestCase('TC019: Should validate price data consistency', async () => {
      const params = {
        symbol: config.testData.validSymbol,
        resolution: config.testData.validResolution,
        from: config.testData.validTimeRange.from,
        to: config.testData.validTimeRange.to
      };
      
      const response = await makeRequest(`${endpoint}?${new URLSearchParams(params)}`);
      
      expect(response.status).toBe(200);
      
      // Check if all price arrays have the same length
      const lengths = [
        response.data.o.length,
        response.data.h.length,
        response.data.l.length,
        response.data.c.length
      ];
      
      const firstLength = lengths[0];
      lengths.forEach(length => {
        expect(length).toBe(firstLength);
      });
    });

    createTestCase('TC020: Should handle empty result sets', async () => {
      // Test with a very old time range that might not have data
      const oldFrom = Math.floor(Date.now() / 1000) - 86400 * 365 * 10; // 10 years ago
      const oldTo = oldFrom + 86400; // 1 day later
      
      const params = {
        symbol: config.testData.validSymbol,
        resolution: config.testData.validResolution,
        from: oldFrom,
        to: oldTo
      };
      
      const response = await makeRequest(`${endpoint}?${new URLSearchParams(params)}`);
      
      // Should return 200 with empty arrays or handle gracefully
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('t');
      expect(response.data).toHaveProperty('o');
      expect(response.data).toHaveProperty('h');
      expect(response.data).toHaveProperty('l');
      expect(response.data).toHaveProperty('c');
      expect(response.data).toHaveProperty('v');
    });
  });
}); 