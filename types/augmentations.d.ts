import { BigNumber } from 'ethers';

import { Accounts, Signers } from './';
import {
  EPool, EPoolHelper, EPoolPeriphery, EPoolPeripheryV3,
  EToken, ETokenFactory, Controller,
  AggregatorMock, AggregatorV3Interface,
  UniswapRouterMock, UniswapV3RouterMock, IUniswapV2Factory, IUniswapV2Router02, ISwapRouter,
  TestERC20, TestEPoolLibrary
} from '../typechain';

declare module 'mocha' {
  export interface Context {
    networkName: string;
    forking: boolean;
    localRun: boolean;
    accounts: Accounts;
    signers: Signers;
    sFactorA: BigNumber;
    sFactorB: BigNumber;
    sFactorE: BigNumber;
    sFactorI: BigNumber;
    decA: number;
    decB: number;
    decE: number;
    decI: number;
    controller: Controller;
    ep: EPool;
    eph: EPoolHelper;
    epp: EPoolPeriphery;
    eppV3: EPoolPeripheryV3;
    aggregator: AggregatorMock | AggregatorV3Interface;
    epl: TestEPoolLibrary;
    router: UniswapRouterMock | IUniswapV2Router02;
    routerV3: UniswapV3RouterMock | ISwapRouter;
    factory: IUniswapV2Factory;
    eTokenFactory: ETokenFactory;
    eToken: EToken;
    eToken1: EToken;
    eToken2: EToken;
    eToken3: EToken;
    tokenA: TestERC20;
    tokenB: TestERC20;
    roundEqual: (a: BigNumber, b: BigNumber) => boolean
  }
}
