module.exports = {
  // API Configuration
  baseURL: 'http://localhost:5006',
  
  // Test endpoints
  endpoints: {
    tokens: '/api/tokens',
    tokenPairs: '/api/token-pairs',
    history: '/api/history',
    config: '/api/config',
    auth: '/api/auth'
  },
  
  // Test data
  testData: {
    validTokenId: '0x4dc08b15ea0e10b96c41aec22fab934ba15c983e', // WTFUEL
    validPairId: '0x4dc08b15ea0e10b96c41aec22fab934ba15c983e-0x22cb20636c2d853de2b140c2eaddbfd6c3643a39',
    validSymbol: 'TFUEL',
    validResolution: '1D',
    validTimeRange: {
      from: Math.floor(Date.now() / 1000) - 86400 * 7, // 7 days ago
      to: Math.floor(Date.now() / 1000) // now
    }
  },
  
  // Expected response schemas
  schemas: {
    token: {
      required: ['id', 'name', 'symbol', 'derivedETH', 'tradeVolume', 'totalLiquidity'],
      optional: ['logo', 'volume24HrsETH', 'volume24HrsUSD']
    },
    tokenPair: {
      required: ['id', 'token0', 'token1', 'reserve0', 'reserve1'],
      optional: ['totalSupply', 'reserveUSD']
    },
    history: {
      required: ['t', 'o', 'h', 'l', 'c', 'v', 's'],
      optional: []
    }
  },
  
  // Timeouts
  timeouts: {
    request: 5000,
    test: 10000
  }
}; 