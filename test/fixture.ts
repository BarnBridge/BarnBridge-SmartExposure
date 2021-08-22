import { ethers, waffle, network } from 'hardhat';
import { BigNumber as EthersBigNumber } from 'ethers';
import { Signer } from '@ethersproject/abstract-signer';

import ControllerArtifact from '../artifacts/contracts/Controller.sol/Controller.json';
import EPoolArtifact from '../artifacts/contracts/EPool.sol/EPool.json';
import EPoolHelperArtifact from '../artifacts/contracts/EPoolHelper.sol/EPoolHelper.json';
import EPoolPeripheryArtifact from '../artifacts/contracts/EPoolPeriphery.sol/EPoolPeriphery.json';
import EPoolPeripheryV3Artifact from '../artifacts/contracts/EPoolPeripheryV3.sol/EPoolPeripheryV3.json';
import ETokenFactoryArtifact from '../artifacts/contracts/ETokenFactory.sol/ETokenFactory.json';
import TestERC20Artifact from '../artifacts/contracts/mocks/TestERC20.sol/TestERC20.json';
import AggregatorMockArtifact from '../artifacts/contracts/mocks/AggregatorMock.sol/AggregatorMock.json';
import UniswapRouterMockArtifact from '../artifacts/contracts/mocks/UniswapRouterMock.sol/UniswapRouterMock.json';
import UniswapV3RouterMockArtifact from '../artifacts/contracts/mocks/UniswapV3RouterMock.sol/UniswapV3RouterMock.json';
import IUniswapV2Router02Artifact from '../artifacts/contracts/interfaces/IUniswapRouterV2.sol/IUniswapV2Router02.json';
import IUniswapV2FactoryArtifact from '../artifacts/contracts/interfaces/IUniswapFactory.sol/IUniswapV2Factory.json';
import ISwapRouterArtifact from '../artifacts/@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json';

import { Accounts, Signers } from '../types';
import {
  Controller, EPool, EPoolHelper, EPoolPeriphery, ETokenFactory,
  AggregatorMock, UniswapRouterMock, UniswapV3RouterMock, IUniswapV2Router02, IUniswapV2Factory, ISwapRouter,
  TestERC20
} from '../typechain';

import { NETWORK_ENV } from '../network';

const { deployContract } = waffle;
const { utils: { formatUnits, parseUnits } } = ethers;

// this.forking === true, if network is forked
// this.localRun === true, if network is not forked and runs on the hardhat chain
// both are false e.g. if tests are run on live network
async function baseFixture(this: any): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  this.forking = (network.config.forking != undefined && network.config.forking.enabled === true)
  this.networkName = (this.forking === false)
    ? (await ethers.provider.getNetwork()).name
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    : (await new ethers.providers.JsonRpcProvider(network.config.forking.url).getNetwork()).name
  this.localRun = network.name === 'hardhat' && this.forking === false;
}

export async function signersFixture(this: any): Promise<void> {
  await baseFixture.bind(this)();

  // get accounts from .env
  const signers: Signer[] = await ethers.getSigners();
  this.accounts = {} as Accounts;
  this.signers = {} as Signers;
  this.signers.admin = signers[0];
  this.accounts.admin = await signers[0].getAddress();
  this.signers.user = signers[1];
  this.accounts.user = await signers[1].getAddress();
  this.signers.dao = signers[2];
  this.accounts.dao = await signers[2].getAddress();
  this.signers.guardian = signers[3];
  this.accounts.guardian = await signers[3].getAddress();
  this.signers.feesOwner = signers[4];
  this.accounts.feesOwner = await signers[4].getAddress();
  this.signers.owner = signers[5];
  this.accounts.owner = await signers[5].getAddress();
  this.signers.user2 = signers[6];
  this.accounts.user2 = await signers[6].getAddress();
}

export async function environmentFixture(this: any): Promise<void> {
  if (this.signers == undefined) {
    throw new Error('Run signersFixture first.');
  }

  const {
    UniswapV2Factory, UniswapV2Router02, UniswapV3Factory, UniswapV3Router, UniswapV3Quoter, WETH, DAI
  } = NETWORK_ENV[this.networkName as keyof typeof NETWORK_ENV] || {};

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (this.localRun) {
    // this.decimals for TokenA, TokenB, EToken, internal vars
    this.decA = 18;
    this.decB = 8;
    this.decE = 18;
    this.decI = 18;
    this.sFactorA = parseUnits('1', this.decA);
    this.sFactorB = parseUnits('1', this.decB);
    this.sFactorE = parseUnits('1', this.decE);
    this.sFactorI = parseUnits('1', this.decI);
    // deploy TokenA and TokenB, Aggregator Mock, Uniswap Router Mock
    this.tokenA = (await deployContract(this.signers.admin, TestERC20Artifact, ['T1', 'T1', this.decA])) as TestERC20;
    this.tokenB = (await deployContract(this.signers.admin, TestERC20Artifact, ['T2', 'T2', this.decB])) as TestERC20;
    this.aggregator = (await deployContract(this.signers.admin, AggregatorMockArtifact, [])) as AggregatorMock;
    this.router = (await deployContract(this.signers.admin, UniswapRouterMockArtifact, [this.tokenA.address, this.tokenB.address, this.decA, this.decB])) as UniswapRouterMock;
    this.routerV3 = (await deployContract(this.signers.admin, UniswapV3RouterMockArtifact, [this.tokenA.address, this.tokenB.address, this.decA, this.decB])) as UniswapV3RouterMock;
    await Promise.all([
      // mint TokenA and TokenB to Admin and User
      this.tokenA.connect(this.signers.admin).mint(this.accounts.admin, this.sFactorA.mul(2)),
      this.tokenB.connect(this.signers.admin).mint(this.accounts.admin, this.sFactorB.mul(2)),
      this.tokenA.connect(this.signers.admin).mint(this.accounts.user, this.sFactorA.mul(5000)),
      this.tokenB.connect(this.signers.admin).mint(this.accounts.user, this.sFactorB.mul(5000)),
      // mint TokenB for Uniswap Router reserve
      this.tokenA.connect(this.signers.admin).mint(this.router.address, this.sFactorA.mul(5000)),
      this.tokenB.connect(this.signers.admin).mint(this.router.address, this.sFactorB.mul(5000))
    ]);
  } else {
    // attach to Uniswap Router, Uniswap Factory, Aggregator, TokenA and TokenB
    this.router = new ethers.Contract(UniswapV2Router02, IUniswapV2Router02Artifact.abi) as IUniswapV2Router02;
    this.routerV3 = new ethers.Contract(UniswapV3Router, ISwapRouterArtifact.abi) as ISwapRouter;
    this.factory = new ethers.Contract(UniswapV2Factory, IUniswapV2FactoryArtifact.abi) as IUniswapV2Factory;
    // this.aggregator = new ethers.Contract(AggregatorV3Proxy, AggregatorV3InterfaceArtifact.abi) as AggregatorV3Interface;
    this.aggregator = (await deployContract(this.signers.admin, AggregatorMockArtifact, [])) as AggregatorMock;
    this.tokenA = new ethers.Contract(ethers.utils.getAddress(WETH), TestERC20Artifact.abi) as TestERC20;
    this.tokenB = new ethers.Contract(ethers.utils.getAddress(DAI), TestERC20Artifact.abi) as TestERC20;
    // this.decimals for TokenA, TokenB, EToken, internal vars
    this.decA = await this.tokenA.connect(this.signers.admin).decimals();
    this.decB = await this.tokenB.connect(this.signers.admin).decimals();
    this.decE = 18;
    this.decI = 18;
    this.sFactorA = parseUnits('1', this.decA);
    this.sFactorB = parseUnits('1', this.decB);
    this.sFactorE = parseUnits('1', this.decE);
    this.sFactorI = parseUnits('1', this.decI);
    // fund Admin and User with 2000 ETH
    await Promise.all([
      network.provider.request({ method: 'hardhat_setBalance', params: [this.accounts.admin, '0x6C6B935B8BBD400000']}),
      network.provider.request({ method: 'hardhat_setBalance', params: [this.accounts.user, '0x6C6B935B8BBD400000']})
    ]);
    await Promise.all([
      // fund Admin and User with 1000 WETH
      network.provider.send(
        'hardhat_setStorageAt',
        [
          this.tokenA.address,
          ethers.utils.keccak256((new ethers.utils.AbiCoder).encode(['address', 'uint256'], [this.accounts.admin, '3'])),
          '0x00000000000000000000000000000000000000000000003635c9adc5dea00000'
        ]
      ),
      network.provider.send(
        'hardhat_setStorageAt',
        [
          this.tokenA.address,
          ethers.utils.keccak256((new ethers.utils.AbiCoder).encode(['address', 'uint256'], [this.accounts.user, '3'])),
          '0x00000000000000000000000000000000000000000000003635c9adc5dea00000'
        ]
      ),
      // fund Admin and User with 5000 DAI
      network.provider.send(
        'hardhat_setStorageAt',
        [
          this.tokenB.address,
          ethers.utils.keccak256((new ethers.utils.AbiCoder).encode(['address', 'uint256'], [this.accounts.admin, '2'])),
          '0x00000000000000000000000000000000000000000000010f0cf064dd59200000'
        ]
      ),
      network.provider.send(
        'hardhat_setStorageAt',
        [
          this.tokenB.address,
          ethers.utils.keccak256((new ethers.utils.AbiCoder).encode(['address', 'uint256'], [this.accounts.user, '2'])),
          '0x00000000000000000000000000000000000000000000010f0cf064dd59200000'
        ]
      )
    ]);
  }

  // deploy third party token
  this.decX = 18;
  this.sFactorX = parseUnits('1', this.decX);
  this.tokenX = (await deployContract(this.signers.admin, TestERC20Artifact, ['T1', 'T1', this.decX])) as TestERC20;
  await Promise.all([
    this.tokenX.connect(this.signers.admin).mint(this.accounts.admin, this.sFactorX.mul(2)),
    this.tokenX.connect(this.signers.admin).mint(this.accounts.user, this.sFactorX.mul(5000))
  ]);

  // deploy controller
  this.controller = (await deployContract(this.signers.admin, ControllerArtifact, [])) as Controller;
  // deploy EToken token factory
  this.eTokenFactory = (await deployContract(this.signers.admin, ETokenFactoryArtifact, [
    this.controller.address
  ])) as ETokenFactory;
  // deploy exposure pool
  this.ep = (await deployContract(this.signers.admin, EPoolArtifact, [
    this.controller.address,
    this.eTokenFactory.address,
    this.tokenA.address,
    this.tokenB.address,
    this.aggregator.address,
    !(this.localRun || this.forking) // real feed uses DAI/ETH feed for which the price needs to be the inverse of itself
  ])) as EPool;
  // deploy exposure pool helper
  this.eph = (await deployContract(this.signers.admin, EPoolHelperArtifact, [])) as EPoolHelper;
  // deploy periphery
  this.epp = (await deployContract(this.signers.admin, EPoolPeripheryArtifact, [
    this.controller.address,
    (this.factory) ? this.factory.address : ethers.constants.AddressZero,
    this.router.address,
  ])) as EPoolPeriphery;
  this.eppV3 = (await deployContract(this.signers.admin, EPoolPeripheryV3Artifact, [
    this.controller.address,
    UniswapV3Factory || ethers.constants.AddressZero,
    this.routerV3.address,
    UniswapV3Quoter || ethers.constants.AddressZero
  ])) as EPoolPeriphery;

  await Promise.all([
    // approve ep for epp
    this.epp.connect(this.signers.admin).setEPoolApproval(this.ep.address, true),
    // approve ep for eppV3
    this.eppV3.connect(this.signers.admin).setEPoolApproval(this.ep.address, true)
  ]);

  // varying this.decimals for TokenA and TokenB can cause precision when calculating the current ratio
  // only compare ratios up to the precision of token with the lowest precision
  this.roundEqual = function (a: EthersBigNumber, b: EthersBigNumber): boolean {
    const precision = ((this.decA < this.decB) ? this.decA : this.decB) - 4;
    return (
      parseFloat(formatUnits(a)).toFixed(precision) == parseFloat(formatUnits(b)).toFixed(precision)
    );
  };
}
