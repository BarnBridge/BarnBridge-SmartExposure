import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
dotenvConfig({ path: resolve(__dirname, './.env') });

import { HardhatUserConfig } from 'hardhat/config';
import { NetworkUserConfig } from 'hardhat/types';

import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import 'hardhat-gas-reporter'
import 'hardhat-typechain';
import 'solidity-coverage';
import "@tenderly/hardhat-tenderly"

import './tasks/clean';
import './tasks/accounts';
import './tasks/contracts/EPool/getState';
import './tasks/contracts/EPool/rebalance';
import './tasks/contracts/EPool/addTranche';
import './tasks/contracts/EPool/addTrancheAsPercentage';
import './tasks/contracts/EPool/issueExact';
import './tasks/contracts/EPool/redeemExact';
import './tasks/contracts/EPool/setFeeRate';
import './tasks/contracts/EPool/setRebalanceMinRDiv';
import './tasks/contracts/EPool/setRebalanceInterval';
import './tasks/contracts/EPoolPeriphery/issueForMaxTokenA';
import './tasks/contracts/EPoolPeriphery/issueForMaxTokenB';
import './tasks/contracts/EPoolPeriphery/redeemForMinTokenA';
import './tasks/contracts/EPoolPeriphery/redeemForMinTokenB';
import './tasks/contracts/EPoolPeriphery/rebalanceWithFlashSwap';
import './tasks/contracts/EPoolPeriphery/setMaxFlashSwapSlippage';
import './tasks/contracts/KeeperNetworkAdapter/setKeeperRebalanceMinRDiv';
import './tasks/contracts/KeeperNetworkAdapter/setKeeperRebalanceInterval';
import './tasks/contracts/KeeperSubsidyPool/addSubsidy';
import './tasks/contracts/ERC20/approve';

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  tenderly: {
    project: process.env.TENDERLY_PROJECT,
    username: process.env.TENDERLY_USERNAME,
  },
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: (process.env.PROVIDER_FORKING) ? process.env.PROVIDER_FORKING : '',
        blockNumber: Number(process.env.BLOCKNUMBER),
        enabled: (process.env.FORKING == "true") ? true : false
      }
    },
    env_network: {
      url: process.env.PROVIDER,
      chainId: Number(process.env.CHAINID),
      accounts: {
        mnemonic: (process.env.MNEMONIC) ? process.env.MNEMONIC : '',
        path: process.env.HD_PATH,
        initialIndex: Number(process.env.HD_INITIAL),
        count: Number(process.env.HD_COUNT),
      },
      gas: (process.env.GAS) ? Number(process.env.GAS) : "auto",
      gasPrice: (process.env.GAS_PRICE) ? Number(process.env.GAS_PRICE) : "auto",
      gasMultiplier: (process.env.GAS_MULTIPLIER) ? Number(process.env.GAS_MULTIPLIER) : 1
    },
    env_network_private_key: {
      url: process.env.PROVIDER,
      chainId: Number(process.env.CHAINID),
      accounts: ['0x' + process.env.PRIVATE_KEY],
      gas: (process.env.GAS) ? Number(process.env.GAS) : "auto",
      gasPrice: (process.env.GAS_PRICE) ? Number(process.env.GAS_PRICE) : "auto",
      gasMultiplier: (process.env.GAS_MULTIPLIER) ? Number(process.env.GAS_MULTIPLIER) : 1
    }
  },
  paths: {
    artifacts: './artifacts',
    cache: './cache',
    sources: './contracts',
    tests: './test',
  },
  solidity: {
    version: '0.8.1',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  }
};

export default config;
