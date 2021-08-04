
export const NETWORK_ENV = {
  // kovan
  'kovan': {
    'AggregatorV3Proxy': '0x22B58f1EbEDfCA50feF632bD73368b2FdA96D541', // DAI/ETH price feed (inverse true)
    'AggregatorV3Proxy_BTC_ETH': '0xF7904a295A029a3aBDFFB6F12755974a958C7C25', // inverse true
    'AggregatorV3Proxy_USDC_WETH': '0xF7904a295A029a3aBDFFB6F12755974a958C7C25', // inverse true
    'UniswapV2Factory': '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    'UniswapV2Router02': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    'UniswapV3Factory': '', // Uniswap V3 Factory
    'UniswapV3Router': '', // Uniswap V3 Router
    'UniswapV3Quoter': '', // Uniswap V3 Quoter
    'WETH': '0xd0A1E359811322d97991E03f863a0C30C2cF029C',
    'DAI': '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa',
    'USDC': '0x75b0622cec14130172eae9cf166b92e5c112faff',
    'WBTC': '0xa0a5ad2296b38bd3e3eb59aaeaf1589e8d9a29a9'
  },
  // mainnet
  'homestead': {
    'AggregatorV3Proxy_BTC_ETH': '0xdeb288F737066589598e9214E782fa5A8eD689e8', // inverse true
    'AggregatorV3Proxy_USDC_WETH': '0x986b5E1e1755e3C2440e960477f25201B0a8bbD4', // inverse true
    'UniswapV2Factory': '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac', // Sushiswap Factory
    'UniswapV2Router02': '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', // Sushiswap Router
    'UniswapV3Factory': '0x1F98431c8aD98523631AE4a59f267346ea31F984', // Uniswap V3 Factory
    'UniswapV3Router': '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 Router
    'UniswapV3Quoter': '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6', // Uniswap V3 Quoter
    'WETH': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    'WBTC': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
  }
};
