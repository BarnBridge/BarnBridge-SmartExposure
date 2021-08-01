import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber } from 'ethers';

import {
  EPool, EPoolHelper, EPoolPeriphery, KeeperSubsidyPool, KeeperNetworkAdapter, EToken, ETokenFactory, Controller,
  AggregatorMock, AggregatorV3Interface,
  UniswapRouterMock, IUniswapV2Factory, IUniswapV2Router02,
  TestERC20, TestEPoolLibrary
} from '../typechain';

export interface Accounts {
  admin: string;
  user: string;
  dao: string;
  guardian: string;
  feesOwner: string;
  owner: string;
  user2: string;
}

export interface Signers {
  admin: Signer;
  user: Signer;
  dao: Signer;
  guardian: Signer;
  feesOwner: Signer;
  owner: Signer;
  user2: Signer;
}

export interface Context {
  networkName: string;
  forking: boolean;
  localRun: boolean;
  accounts: Accounts;
  signers: Signers;
  sFactorA: BigNumber;
  sFactorB: BigNumber;
  sFactorX: BigNumber;
  sFactorE: BigNumber;
  sFactorI: BigNumber;
  decA: number;
  decB: number;
  decX: number;
  decE: number;
  decI: number;
  controller: Controller;
  ep: EPool;
  eph: EPoolHelper;
  epp: EPoolPeriphery;
  aggregator: AggregatorMock | AggregatorV3Interface;
  ksp: KeeperSubsidyPool;
  kna: KeeperNetworkAdapter;
  epl: TestEPoolLibrary;
  router: UniswapRouterMock | IUniswapV2Router02;
  factory: IUniswapV2Factory;
  eTokenFactory: ETokenFactory;
  eToken: EToken;
  eToken1: EToken;
  eToken2: EToken;
  eToken3: EToken;
  tokenA: TestERC20;
  tokenB: TestERC20;
  tokenX: TestERC20;
  roundEqual: (a: BigNumber, b: BigNumber) => boolean
}
