exports.SUPPORTED_PAIRS = [
  { symbol: 'BTCUSDT',  base: 'BTC',  quote: 'USDT', basePrice: 67450.00, volatility: 0.002 },
  { symbol: 'ETHUSDT',  base: 'ETH',  quote: 'USDT', basePrice: 3580.00,  volatility: 0.003 },
  { symbol: 'BNBUSDT',  base: 'BNB',  quote: 'USDT', basePrice: 598.00,   volatility: 0.004 },
  { symbol: 'SOLUSDT',  base: 'SOL',  quote: 'USDT', basePrice: 178.50,   volatility: 0.005 },
  { symbol: 'XRPUSDT',  base: 'XRP',  quote: 'USDT', basePrice: 0.5820,   volatility: 0.006 },
  { symbol: 'ADAUSDT',  base: 'ADA',  quote: 'USDT', basePrice: 0.4610,   volatility: 0.005 },
  { symbol: 'DOGEUSDT', base: 'DOGE', quote: 'USDT', basePrice: 0.1620,   volatility: 0.007 },
  { symbol: 'DOTUSDT',  base: 'DOT',  quote: 'USDT', basePrice: 7.840,    volatility: 0.005 },
  { symbol: 'MATICUSDT',base: 'MATIC',quote: 'USDT', basePrice: 0.8940,   volatility: 0.006 },
  { symbol: 'LINKUSDT', base: 'LINK', quote: 'USDT', basePrice: 14.820,   volatility: 0.004 },
];

exports.ORDER_TYPES = ['MARKET', 'LIMIT', 'STOP_LIMIT'];
exports.ORDER_SIDES = ['BUY', 'SELL'];
exports.ORDER_STATUS = ['OPEN', 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED'];
exports.USER_ROLES = ['admin', 'trader', 'viewer'];
exports.INITIAL_USDT_BALANCE = 10000; // Demo starting balance
