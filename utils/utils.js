const axios = require('axios');
const config = require('../config/config');

/**
 * Helper function to make API requests
 * @param {string} endpoint - API endpoint
 * @param {object} options - Request options
 * @returns {Promise} - Response promise
 */
const makeRequest = async (endpoint, options = {}) => {
  const url = `${config.baseURL}${endpoint}`;
  const defaultOptions = {
    timeout: config.timeouts.request,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    console.log(`Making request to: ${url}`);
    const response = await axios({
      url,
      ...defaultOptions,
      ...options
    });
    console.log(`Response status: ${response.status}`);
    return response;
  } catch (error) {
    console.error(`Request failed: ${url}`, error.message);
    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error(`Response data:`, error.response.data);
      return error.response;
    } else if (error.request) {
      console.error('No response received');
      return {
        status: 0,
        data: { error: 'No response received' },
        headers: {}
      };
    } else {
      console.error('Request setup error:', error.message);
      return {
        status: 0,
        data: { error: error.message },
        headers: {}
      };
    }
  }
};

/**
 * Validate response schema
 * @param {object} response - API response
 * @param {object} schema - Expected schema
 * @returns {object} - Validation result
 */
const validateSchema = (response, schema) => {
  const errors = [];
  
  // Check if response has required fields
  schema.required.forEach(field => {
    if (!response.hasOwnProperty(field)) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate array response schema
 * @param {array} response - API response array
 * @param {object} schema - Expected schema for each item
 * @returns {object} - Validation result
 */
const validateArraySchema = (response, schema) => {
  if (!Array.isArray(response)) {
    return {
      isValid: false,
      errors: ['Response is not an array']
    };
  }
  
  const errors = [];
  response.forEach((item, index) => {
    const validation = validateSchema(item, schema);
    validation.errors.forEach(error => {
      errors.push(`Item ${index}: ${error}`);
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Test case wrapper
 * @param {string} name - Test name
 * @param {function} testFn - Test function
 * @returns {function} - Jest test function
 */
const createTestCase = (name, testFn) => {
  return test(name, async () => {
    try {
      await testFn();
    } catch (error) {
      console.error(`Test failed: ${name}`, error.message);
      throw error;
    }
  }, config.timeouts.test);
};

/**
 * Performance test helper
 * @param {function} requestFn - Request function
 * @param {number} maxTime - Maximum allowed time in ms
 * @returns {object} - Performance result
 */
const measurePerformance = async (requestFn, maxTime = 1000) => {
  const startTime = Date.now();
  const response = await requestFn();
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  return {
    duration,
    isWithinLimit: duration <= maxTime,
    response
  };
};

module.exports = {
  makeRequest,
  validateSchema,
  validateArraySchema,
  createTestCase,
  measurePerformance
}; 