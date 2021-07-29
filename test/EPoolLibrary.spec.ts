import { ethers, waffle } from 'hardhat';
import { assert } from 'chai';
import { BigNumber as EthersBigNumber } from 'ethers';

import ETokenArtifact from '../artifacts/contracts/EToken.sol/EToken.json';
import TestEPoolLibraryArtifact from '../artifacts/contracts/test/TestEPoolLibrary.sol/TestEPoolLibrary.json';
import { EToken, TestEPoolLibrary } from '../typechain';

import { environmentFixture, signersFixture } from './fixture';

const { deployContract } = waffle;
const { utils: { parseUnits: toUnit }, BigNumber: { from: toBigNumber }  } = ethers;

describe('EPoolLibrary', function () {

  before(async function () {
    await signersFixture.bind(this)();
    await environmentFixture.bind(this)();

    // deploy exposure pool library wrapper
    this.epl = (await deployContract(this.signers.admin, TestEPoolLibraryArtifact, [])) as TestEPoolLibrary;
    this.scenarios = [
      // reserves are 0, currentRation == targetRatio
      {
        decA: 18,
        decB: 18,
        sFactorA: toUnit('1', 18),
        sFactorB: toUnit('1', 18),
        tranches: [
          { reserveA: 0, reserveB: 0, targetRatio: toUnit(String(30/70), 18), amountA: 0, amountB: toBigNumber('2718281828459045235'), eTokenSupply: 1, eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 },
          { reserveA: 0, reserveB: 0, targetRatio: toUnit(String(50/50), 18), amountA: toBigNumber('3141592653589793238'), amountB: toUnit('1', 18), eTokenSupply: toUnit('100000', 18), eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 },
          { reserveA: 0, reserveB: 0, targetRatio: toUnit(String(70/30), 18), amountA: toBigNumber('3141592653589793238'), amountB: toBigNumber('2718281828459045235'), eTokenSupply: toUnit('17', 18), eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 }
        ],
        rate: toUnit('1', 18),
        feeRate: 0,
        results: {
          delta: { deltaA: 0, deltaB: 0, rChange: 0 },
          tranches: [
            {
              currentRatio: toBigNumber('428571428571428550'),
              trancheDelta: { deltaA: 0, deltaB: 0, rChange: 0, rDiv: 0 },
              eTokenForTokenATokenB: toBigNumber('1648721270700128146'),
              tokenATokenBForEToken: { amountA: toBigNumber('599999999999999979'), amountB: toBigNumber('1400000000000000018') },
              tokenAForTokenB: toBigNumber('1164977926482447899'),
              tokenBForTokenA: toBigNumber('0'),
              tokenATokenBForTokenA: { amountA: toBigNumber('0'), amountB: toBigNumber('0') },
              tokenATokenBForTokenB: { amountA: toBigNumber('0'), amountB: toBigNumber('0') }
            },
            {
              currentRatio: toBigNumber('1000000000000000000'),
              trancheDelta: { deltaA: 0, deltaB: 0, rChange: 0, rDiv: 0 },
              eTokenForTokenATokenB: toBigNumber('2035090330572526020'),
              tokenATokenBForEToken: { amountA: toBigNumber('999999999999999999'), amountB: toBigNumber('999999999999999999') },
              tokenAForTokenB: toBigNumber('1000000000000000000'),
              tokenBForTokenA: toBigNumber('3141592653589793238'),
              tokenATokenBForTokenA: { amountA: toBigNumber('1570796326794896619'), amountB: toBigNumber('1570796326794896619') },
              tokenATokenBForTokenB: { amountA: toBigNumber('1570796326794896619'), amountB: toBigNumber('1570796326794896619') }
            },
            {
              currentRatio: toBigNumber('2333333333333333500'),
              trancheDelta: { deltaA: 0, deltaB: 0, rChange: 0, rDiv: 0 },
              eTokenForTokenATokenB: toBigNumber('2420717761749361493'),
              tokenATokenBForEToken: { amountA: toBigNumber('1400000000000000028'), amountB: toBigNumber('599999999999999969') },
              tokenAForTokenB: toBigNumber('6342657599737772668'),
              tokenBForTokenA: toBigNumber('1346396851538482720'),
              tokenATokenBForTokenA: { amountA: toBigNumber('2199114857512855314'), amountB: toBigNumber('942477796076937924') },
              tokenATokenBForTokenB: { amountA: toBigNumber('2199114857512855314'), amountB: toBigNumber('942477796076937924') }
            }
          ]
        }
      },
      // reserveA is 0, reserve B is not 0
      {
        decA: 18,
        decB: 18,
        sFactorA: toUnit('1', 18),
        sFactorB: toUnit('1', 18),
        tranches: [
          { reserveA: 0, reserveB: toUnit('1', 18), targetRatio: toUnit(String(30/70), 18), amountA: 0, amountB: toBigNumber('2718281828459045235'), eTokenSupply: 1, eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 },
          { reserveA: 0, reserveB: toUnit('10', 18), targetRatio: toUnit(String(50/50), 18), amountA: toBigNumber('3141592653589793238'), amountB: toUnit('1', 18), eTokenSupply: toUnit('100000', 18), eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 },
          { reserveA: 0, reserveB: toUnit('1000', 18), targetRatio: toUnit(String(70/30), 18), amountA: toBigNumber('3141592653589793238'), amountB: toBigNumber('2718281828459045235'), eTokenSupply: toUnit('17', 18), eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 }
        ],
        rate: toUnit('1', 18),
        feeRate: toUnit('1', 18),
        results: {
          delta: { deltaA: toBigNumber('705300000000000014988'), deltaB: toBigNumber('705300000000000014988'), rChange: 1 },
          tranches: [
            {
              currentRatio: 0,
              trancheDelta: { deltaA: toBigNumber('299999999999999989'), deltaB: toBigNumber('299999999999999989'), rChange: 1, rDiv: toBigNumber('1000000000000000000') },
              eTokenForTokenATokenB: 2,
              tokenATokenBForEToken: { amountA: 0, amountB: toBigNumber('1414213562373095048000000000000000000') },
              tokenAForTokenB: toBigNumber('1164977926482447899'),
              tokenBForTokenA: toBigNumber('0'),
              tokenATokenBForTokenA: { amountA: toBigNumber('0'), amountB: toBigNumber('0') },
              tokenATokenBForTokenB: { amountA: toBigNumber('0'), amountB: toBigNumber('0') }
            },
            {
              currentRatio: 0,
              trancheDelta: { deltaA: toUnit('5', 18), deltaB: toUnit('5', 18), rChange: 1, rDiv: toBigNumber('1000000000000000000') },
              eTokenForTokenATokenB: toBigNumber('41415926535897932300000'),
              tokenATokenBForEToken: { amountA: 0, amountB: toBigNumber('141421356237300') },
              tokenAForTokenB: toBigNumber('1000000000000000000'),
              tokenBForTokenA: toBigNumber('3141592653589793238'),
              tokenATokenBForTokenA: { amountA: toBigNumber('1570796326794896619'), amountB: toBigNumber('1570796326794896619') },
              tokenATokenBForTokenB: { amountA: toBigNumber('1570796326794896619'), amountB: toBigNumber('1570796326794896619') }
            },
            {
              currentRatio: 0,
              trancheDelta: { deltaA: toBigNumber('700000000000000014999'), deltaB: toBigNumber('700000000000000014999'), rChange: 1, rDiv: toBigNumber('1000000000000000000') },
              eTokenForTokenATokenB: toBigNumber('99617866194830246'),
              tokenATokenBForEToken: { amountA: 0, amountB: toBigNumber('83189033080770296000') },
              tokenAForTokenB: toBigNumber('6342657599737772668'),
              tokenBForTokenA: toBigNumber('1346396851538482720'),
              tokenATokenBForTokenA: { amountA: toBigNumber('2199114857512855314'), amountB: toBigNumber('942477796076937924') },
              tokenATokenBForTokenB: { amountA: toBigNumber('2199114857512855314'), amountB: toBigNumber('942477796076937924') }
            }
          ]
        }
      },
      // reserveA is 0, reserve B is not 0, and rate is not 1
      {
        decA: 18,
        decB: 18,
        sFactorA: toUnit('1', 18),
        sFactorB: toUnit('1', 18),
        tranches: [
          { reserveA: 0, reserveB: toUnit('1', 18), targetRatio: toUnit(String(30/70), 18), amountA: 0, amountB: toBigNumber('2718281828459045235'), eTokenSupply: 1, eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 },
          { reserveA: 0, reserveB: toUnit('10', 18), targetRatio: toUnit(String(50/50), 18), amountA: toBigNumber('3141592653589793238'), amountB: toUnit('1', 18), eTokenSupply: toUnit('100000', 18), eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 },
          { reserveA: 0, reserveB: toUnit('1000', 18), targetRatio: toUnit(String(70/30), 18), amountA: toBigNumber('3141592653589793238'), amountB: toBigNumber('2718281828459045235'), eTokenSupply: toUnit('17', 18), eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 }
        ],
        rate: toUnit('2', 18),
        feeRate: toUnit('0.05', 18),
        results: {
          delta: { deltaA: toBigNumber('352650000000000007493'), deltaB: toBigNumber('705300000000000014986'), rChange: 1 },
          tranches: [
            {
              currentRatio: 0,
              trancheDelta: { deltaA: toBigNumber('149999999999999994'), deltaB: toBigNumber('299999999999999988'), rChange: 1, rDiv: toBigNumber('1000000000000000000') },
              eTokenForTokenATokenB: 2,
              tokenATokenBForEToken: { amountA: 0, amountB: toBigNumber('1414213562373095048000000000000000000') },
              tokenAForTokenB: toBigNumber('582488963241223949'),
              tokenBForTokenA: toBigNumber('0'),
              tokenATokenBForTokenA: { amountA: toBigNumber('0'), amountB: toBigNumber('0') },
              tokenATokenBForTokenB: { amountA: toBigNumber('0'), amountB: toBigNumber('0') }
            },
            {
              currentRatio: 0,
              trancheDelta: { deltaA: toUnit('2.5', 18), deltaB: toUnit('5', 18), rChange: 1, rDiv: toBigNumber('1000000000000000000') },
              eTokenForTokenATokenB: toBigNumber('72831853071795864700000'),
              tokenATokenBForEToken: { amountA: 0, amountB: toBigNumber('141421356237300') },
              tokenAForTokenB: toBigNumber('500000000000000000'),
              tokenBForTokenA: toBigNumber('6283185307179586476'),
              tokenATokenBForTokenA: { amountA: toBigNumber('1570796326794896619'), amountB: toBigNumber('3141592653589793238') },
              tokenATokenBForTokenB: { amountA: toBigNumber('1570796326794896619'), amountB: toBigNumber('3141592653589793238') }
            },
            {
              currentRatio: 0,
              trancheDelta: { deltaA: toBigNumber('350000000000000007499'), deltaB: toBigNumber('700000000000000014998'), rChange: 1, rDiv: toBigNumber('1000000000000000000') },
              eTokenForTokenATokenB: toBigNumber('153024941305856727'),
              tokenATokenBForEToken: { amountA: 0, amountB: toBigNumber('83189033080770296000') },
              tokenAForTokenB: toBigNumber('3171328799868886334'),
              tokenBForTokenA: toBigNumber('2692793703076965440'),
              tokenATokenBForTokenA: { amountA: toBigNumber('2199114857512855314'), amountB: toBigNumber('1884955592153875848') },
              tokenATokenBForTokenB: { amountA: toBigNumber('2199114857512855314'), amountB: toBigNumber('1884955592153875848') }
            }
          ]
        }
      },
      // reserveA is 0, reserve B is not 0, rate is not 1, and precisions are different
      {
        decA: 8,
        decB: 22,
        sFactorA: toUnit('1', 8),
        sFactorB: toUnit('1', 22),
        tranches: [
          { reserveA: 0, reserveB: toUnit('1', 18), targetRatio: toUnit(String(30/70), 18), amountA: 0, amountB: toBigNumber('2718281828459045235'), eTokenSupply: 1, eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 },
          { reserveA: 0, reserveB: toUnit('10', 18), targetRatio: toUnit(String(50/50), 18), amountA: toBigNumber('3141592653589793238'), amountB: toUnit('1', 18), eTokenSupply: toUnit('100000', 18), eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 },
          { reserveA: 0, reserveB: toUnit('1000', 18), targetRatio: toUnit(String(70/30), 18), amountA: toBigNumber('3141592653589793238'), amountB: toBigNumber('2718281828459045235'), eTokenSupply: toUnit('17', 18), eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 }
        ],
        rate: toUnit('2', 18),
        feeRate: toUnit('1', 18),
        targetRatio: toUnit('1', 18),
        results: {
          delta: { deltaA: toBigNumber('3526498'), deltaB: toBigNumber('705299600000000000000'), rChange: 1 },
          tranches: [
            {
              currentRatio: 0,
              trancheDelta: { deltaA: toBigNumber('1499'), deltaB: toBigNumber('299800000000000000'), rChange: 1, rDiv: toBigNumber('1000000000000000000') },
              eTokenForTokenATokenB: 2,
              tokenATokenBForEToken: { amountA: 0, amountB: toBigNumber('1414213562373095048000000000000000000') },
              tokenAForTokenB: toBigNumber('5824'),
              tokenBForTokenA: toBigNumber('0'),
              tokenATokenBForTokenA: { amountA: toBigNumber('0'), amountB: toBigNumber('0') },
              tokenATokenBForTokenB: { amountA: toBigNumber('0'), amountB: toBigNumber('0') }
            },
            {
              currentRatio: 0,
              trancheDelta: { deltaA: 25000, deltaB: toBigNumber('5000000000000000000'), rChange: 1, rDiv: toBigNumber('1000000000000000000') },
              eTokenForTokenATokenB: toBigNumber('6283185307179596476000000000000000000'),
              tokenATokenBForEToken: { amountA: 0, amountB: toBigNumber('141421356237300') },
              tokenAForTokenB: toBigNumber('5000'),
              tokenBForTokenA: toBigNumber('628318530717958647600000000000000'),
              tokenATokenBForTokenA: { amountA: toBigNumber('1570796326794896619'), amountB: toBigNumber('314159265358979323800000000000000') },
              tokenATokenBForTokenB: { amountA: toBigNumber('1570796326794896619'), amountB: toBigNumber('314159265358979323800000000000000') }
            },
            {
              currentRatio: 0,
              trancheDelta: { deltaA: toBigNumber('3499999'), deltaB: toBigNumber('699999800000000000000'), rChange: 1, rDiv: toBigNumber('1000000000000000000') },
              eTokenForTokenATokenB: toBigNumber('10681415022205343218600000000000'),
              tokenATokenBForEToken: { amountA: 0, amountB: toBigNumber('83189033080770296000') },
              tokenAForTokenB: 31713,
              tokenBForTokenA: toBigNumber('269279370307696544022902120870000'),
              tokenATokenBForTokenA: { amountA: toBigNumber('2199114857512855314'), amountB: toBigNumber('188495559215387584855222039230620') },
              tokenATokenBForTokenB: { amountA: toBigNumber('2199114857512855314'), amountB: toBigNumber('188495559215387584855222039230620') }
            }
          ]
        }
      },
      // reserveA is not 0, reserveB is 0
      {
        decA: 18,
        decB: 18,
        sFactorA: toUnit('1', 18),
        sFactorB: toUnit('1', 18),
        tranches: [
          { reserveA: toUnit('1', 18), reserveB: 0, targetRatio: toUnit(String(30/70), 18), amountA: 0, amountB: toBigNumber('2718281828459045235'), eTokenSupply: 1, eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 },
          { reserveA: toUnit('10', 18), reserveB: 0, targetRatio: toUnit(String(50/50), 18), amountA: toBigNumber('3141592653589793238'), amountB: toUnit('1', 18), eTokenSupply: toUnit('100000', 18), eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 },
          { reserveA: toUnit('1000', 18), reserveB: 0, targetRatio: toUnit(String(70/30), 18), amountA: toBigNumber('3141592653589793238'), amountB: toBigNumber('2718281828459045235'), eTokenSupply: toUnit('17', 18), eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 }
        ],
        rate: toUnit('1', 18),
        feeRate: toUnit('2', 18),
        results: {
          delta: { deltaA: toBigNumber('305699999999999985010'), deltaB: toBigNumber('305699999999999985010'), rChange: 0 },
          tranches: [
            {
              currentRatio: ethers.constants.MaxUint256,
              trancheDelta: { deltaA: toBigNumber('700000000000000010'), deltaB: toBigNumber('700000000000000010'), rChange: 0, rDiv: toBigNumber('115792089237316195423570985008687907853269984665640564039457584007913129639935') },
              eTokenForTokenATokenB: 2,
              tokenATokenBForEToken: { amountA: toBigNumber('1414213562373095048000000000000000000'), amountB: 0 },
              tokenAForTokenB: toBigNumber('1164977926482447899'),
              tokenBForTokenA: toBigNumber('0'),
              tokenATokenBForTokenA: { amountA: toBigNumber('0'), amountB: toBigNumber('0') },
              tokenATokenBForTokenB: { amountA: toBigNumber('0'), amountB: toBigNumber('0') }
            },
            {
              currentRatio: ethers.constants.MaxUint256,
              trancheDelta: { deltaA: toUnit('5', 18), deltaB: toUnit('5', 18), rChange: 0, rDiv: toBigNumber('115792089237316195423570985008687907853269984665640564039457584007913129639935') },
              eTokenForTokenATokenB: toBigNumber('41415926535897932300000'),
              tokenATokenBForEToken: { amountA: toBigNumber('141421356237300'), amountB: 0 },
              tokenAForTokenB: toBigNumber('1000000000000000000'),
              tokenBForTokenA: toBigNumber('3141592653589793238'),
              tokenATokenBForTokenA: { amountA: toBigNumber('1570796326794896619'), amountB: toBigNumber('1570796326794896619') },
              tokenATokenBForTokenB: { amountA: toBigNumber('1570796326794896619'), amountB: toBigNumber('1570796326794896619') }
            },
            {
              currentRatio: ethers.constants.MaxUint256,
              trancheDelta: { deltaA: toBigNumber('299999999999999985000'), deltaB: toBigNumber('299999999999999985000'), rChange: 0, rDiv: toBigNumber('115792089237316195423570985008687907853269984665640564039457584007913129639935') },
              eTokenForTokenATokenB: toBigNumber('99617866194830246'),
              tokenATokenBForEToken: { amountA: toBigNumber('83189033080770296000'), amountB: 0 },
              tokenAForTokenB: toBigNumber('6342657599737772668'),
              tokenBForTokenA: toBigNumber('1346396851538482720'),
              tokenATokenBForTokenA: { amountA: toBigNumber('2199114857512855314'), amountB: toBigNumber('942477796076937924') },
              tokenATokenBForTokenB: { amountA: toBigNumber('2199114857512855314'), amountB: toBigNumber('942477796076937924') }
            }
          ]
        }
      },
      // reserves are equal and non zero
      {
        decA: 18,
        decB: 18,
        sFactorA: toUnit('1', 18),
        sFactorB: toUnit('1', 18),
        tranches: [
          { reserveA: toUnit('0.5', 18), reserveB: toUnit('0.5', 18), targetRatio: toUnit(String(30/70), 18), amountA: 0, amountB: toBigNumber('2718281828459045235'), eTokenSupply: 1, eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 },
          { reserveA: toUnit('0.5', 18), reserveB: toUnit('0.5', 18), targetRatio: toUnit(String(50/50), 18), amountA: toBigNumber('3141592653589793238'), amountB: toUnit('1', 18), eTokenSupply: toUnit('100000', 18), eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 },
          { reserveA: toUnit('0.5', 18), reserveB: toUnit('0.5', 18), targetRatio: toUnit(String(70/30), 18), amountA: toBigNumber('3141592653589793238'), amountB: toBigNumber('2718281828459045235'), eTokenSupply: toUnit('17', 18), eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 }
        ],
        rate: toUnit('1', 18),
        feeRate: toUnit('100', 18),
        results: {
          delta: { deltaA: 4, deltaB: 4, rChange: 1 },
          tranches: [
            {
              currentRatio: toBigNumber('1000000000000000000'),
              trancheDelta: { deltaA: toBigNumber('200000000000000010'), deltaB: toBigNumber('200000000000000010'), rChange: 0, rDiv: toBigNumber('1333333333333333450') },
              eTokenForTokenATokenB: 2,
              tokenATokenBForEToken: { amountA: toBigNumber('707106781186547524000000000000000000'), amountB: toBigNumber('707106781186547524000000000000000000') },
              tokenAForTokenB: toBigNumber('1164977926482447899'),
              tokenBForTokenA: toBigNumber('0'),
              tokenATokenBForTokenA: { amountA: toBigNumber('0'), amountB: toBigNumber('0') },
              tokenATokenBForTokenB: { amountA: toBigNumber('0'), amountB: toBigNumber('0') }
            },
            {
              currentRatio: toBigNumber('1000000000000000000'),
              trancheDelta: { deltaA: 0, deltaB: 0, rChange: 0, rDiv: 0 },
              eTokenForTokenATokenB: toBigNumber('414159265358979323800000'),
              tokenATokenBForEToken: { amountA: toBigNumber('7071067811865'), amountB: toBigNumber('7071067811865') },
              tokenAForTokenB: toBigNumber('1000000000000000000'),
              tokenBForTokenA: toBigNumber('3141592653589793238'),
              tokenATokenBForTokenA: { amountA: toBigNumber('1570796326794896619'), amountB: toBigNumber('1570796326794896619') },
              tokenATokenBForTokenB: { amountA: toBigNumber('1570796326794896619'), amountB: toBigNumber('1570796326794896619') }
            },
            {
              currentRatio: toBigNumber('1000000000000000000'),
              trancheDelta: { deltaA: toBigNumber('200000000000000014'), deltaB: toBigNumber('200000000000000014'), rChange: 1, rDiv: toBigNumber('571428571428571460') },
              eTokenForTokenATokenB: toBigNumber('99617866194830254041'),
              tokenATokenBForEToken: { amountA: toBigNumber('41594516540385148'), amountB: toBigNumber('41594516540385148') },
              tokenAForTokenB: toBigNumber('6342657599737772668'),
              tokenBForTokenA: toBigNumber('1346396851538482720'),
              tokenATokenBForTokenA: { amountA: toBigNumber('2199114857512855314'), amountB: toBigNumber('942477796076937924') },
              tokenATokenBForTokenB: { amountA: toBigNumber('2199114857512855314'), amountB: toBigNumber('942477796076937924') }
            }
          ]
        }
      },
      // reserves are equal and non zero, rate is not 1 and precisions are different
      {
        decA: 8,
        decB: 22,
        sFactorA: toUnit('1', 8),
        sFactorB: toUnit('1', 22),
        tranches: [
          { reserveA: toUnit('0.5', 18), reserveB: toUnit('0.5', 18), targetRatio: toUnit(String(30/70), 18), amountA: 0, amountB: toBigNumber('2718281828459045235'), eTokenSupply: 1, eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 },
          { reserveA: toUnit('0.5', 18), reserveB: toUnit('0.5', 18), targetRatio: toUnit(String(50/50), 18), amountA: toBigNumber('3141592653589793238'), amountB: toUnit('1', 18), eTokenSupply: toUnit('100000', 18), eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 },
          { reserveA: toUnit('0.5', 18), reserveB: toUnit('0.5', 18), targetRatio: toUnit(String(70/30), 18), amountA: toBigNumber('3141592653589793238'), amountB: toBigNumber('2718281828459045235'), eTokenSupply: toUnit('17', 18), eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 }
        ],
        rate: toUnit('2', 18),
        feeRate: toUnit('0.01', 18),
        results: {
          delta: { deltaA: toBigNumber('750000002249996262'), deltaB: toBigNumber('150000000449999252400000000000000'), rChange: 0 },
          tranches: [
            {
              currentRatio: toBigNumber('200000000000000000000000000000000'),
              trancheDelta: { deltaA: toBigNumber('350000002099999262'), deltaB: toBigNumber('70000000419999852400000000000000'), rChange: 0, rDiv: toBigNumber('466666666666665690000000000000001') },
              eTokenForTokenATokenB: 0,
              tokenATokenBForEToken: { amountA: toBigNumber('707106781186547524000000000000000000'), amountB: toBigNumber('707106781186547524000000000000000000') },
              tokenAForTokenB: toBigNumber('5824'),
              tokenBForTokenA: toBigNumber('0'),
              tokenATokenBForTokenA: { amountA: toBigNumber('0'), amountB: toBigNumber('0') },
              tokenATokenBForTokenB: { amountA: toBigNumber('0'), amountB: toBigNumber('0') }
            },
            {
              currentRatio: toBigNumber('200000000000000000000000000000000'),
              trancheDelta: { deltaA: toBigNumber('249999999999998750'), deltaB: toBigNumber('49999999999999750000000000000000'), rChange: 0, rDiv: toBigNumber('199999999999999000000000000000000') },
              eTokenForTokenATokenB: toBigNumber('628318530717956506000000'),
              tokenATokenBForEToken: { amountA: 7071067811865, amountB: toBigNumber('7071067811865') },
              tokenAForTokenB: toBigNumber('5000'),
              tokenBForTokenA: toBigNumber('628318530717958647600000000000000'),
              tokenATokenBForTokenA: { amountA: toBigNumber('1570796326794896619'), amountB: toBigNumber('314159265358979323800000000000000') },
              tokenATokenBForTokenB: { amountA: toBigNumber('1570796326794896619'), amountB: toBigNumber('314159265358979323800000000000000') }
            },
            {
              currentRatio: toBigNumber('200000000000000000000000000000000'),
              trancheDelta: { deltaA: toBigNumber('150000000149998250'), deltaB: toBigNumber('30000000029999650000000000000000'), rChange: 0, rDiv: toBigNumber('85714285714284708163265306122449') },
              eTokenForTokenATokenB: toBigNumber('106814150222052898114'),
              tokenATokenBForEToken: { amountA: toBigNumber('41594516540385148'), amountB: toBigNumber('41594516540385148') },
              tokenAForTokenB: 31713,
              tokenBForTokenA: toBigNumber('269279370307696544022902120870000'),
              tokenATokenBForTokenA: { amountA: toBigNumber('2199114857512855314'), amountB: toBigNumber('188495559215387584855222039230620') },
              tokenATokenBForTokenB: { amountA: toBigNumber('2199114857512855314'), amountB: toBigNumber('188495559215387584855222039230620') }
            }
          ]
        }
      },
      // tranche ratios
      {
        decA: 18,
        decB: 8,
        sFactorA: toUnit('1', 18),
        sFactorB: toUnit('1', 8),
        tranches: [
          { reserveA: toUnit('1', 18), reserveB: toUnit('1', 18), targetRatio: toUnit(String(30/70), 18), amountA: 0, amountB: toBigNumber('2718281828459045235'), eTokenSupply: 1, eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 },
          { reserveA: toUnit('1', 18), reserveB: toUnit('1', 18), targetRatio: toUnit(String(50/50), 18), amountA: toBigNumber('3141592653589793238'), amountB: toUnit('1', 18), eTokenSupply: toUnit('100000', 18), eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 },
          { reserveA: toUnit('1', 18), reserveB: toUnit('1', 18), targetRatio: toUnit(String(70/30), 18), amountA: toBigNumber('3141592653589793238'), amountB: toBigNumber('2718281828459045235'), eTokenSupply: toUnit('17', 18), eTokenAmount: toBigNumber('1414213562373095048'), rebalancedAt: 0 }
        ],
        rate: toUnit('1', 18),
        feeRate: toUnit('1', 18),
        results: {
          delta: { deltaA: toBigNumber('14999999998500000045000000003'), deltaB: toBigNumber('1499999999850000004'), rChange: 1 },
          tranches: [
            {
              currentRatio: toBigNumber('100000000'),
              trancheDelta: { deltaA: toBigNumber('2999999999299999894999999989'), deltaB: toBigNumber('299999999929999989'), rChange: 1, rDiv: toBigNumber('999999999766666667') },
              eTokenForTokenATokenB: 2,
              tokenATokenBForEToken: { amountA: toBigNumber('1414213562373095048000000000000000000'), amountB: toBigNumber('1414213562373095048000000000000000000') },
              tokenAForTokenB: toBigNumber('11649779264824478996082465330'),
              tokenBForTokenA: toBigNumber('0'),
              tokenATokenBForTokenA: { amountA: toBigNumber('0'), amountB: toBigNumber('0') },
              tokenATokenBForTokenB: { amountA: toBigNumber('0'), amountB: toBigNumber('0') }
            },
            {
              currentRatio: toBigNumber('100000000'),
              trancheDelta: { deltaA: toBigNumber('4999999999500000000000000000'), deltaB: toBigNumber('499999999950000000'), rChange: 1, rDiv: toBigNumber('999999999900000000') },
              eTokenForTokenATokenB: toBigNumber('100000000021415926500000'),
              tokenATokenBForEToken: { amountA: toBigNumber('14142135623730'), amountB: toBigNumber('14142135623730') },
              tokenAForTokenB: toBigNumber('10000000000000000000000000000'),
              tokenBForTokenA: toBigNumber('314159265'),
              tokenATokenBForTokenA: { amountA: toBigNumber('1570796326794896619'), amountB: toBigNumber('157079632') },
              tokenATokenBForTokenB: { amountA: toBigNumber('1570796326794896619'), amountB: toBigNumber('157079632') }
            },
            {
              currentRatio: toBigNumber('100000000'),
              trancheDelta: { deltaA: toBigNumber('6999999999700000150000000014'), deltaB: toBigNumber('699999999970000015'), rChange: 1, rDiv: toBigNumber('999999999957142858') },
              eTokenForTokenATokenB: toBigNumber('46210791084523397389'),
              tokenATokenBForEToken: { amountA: toBigNumber('83189033080770296'), amountB: toBigNumber('83189033080770296') },
              tokenAForTokenB: toBigNumber('63426575997377726680469714098'),
              tokenBForTokenA: toBigNumber('134639685'),
              tokenATokenBForTokenA: { amountA: toBigNumber('2199114857512855314'), amountB: toBigNumber('94247779') },
              tokenATokenBForTokenB: { amountA: toBigNumber('2199114857512855314'), amountB: toBigNumber('94247779') }
            }
          ]
        }
      },
      // non-zero, zero deltaA, deltaB should return 0 for both
      {
        decA: 18,
        decB: 6,
        sFactorA: toUnit('1', 18),
        sFactorB: toUnit('1', 6),
        tranches: [
          { reserveA: toBigNumber('100000000000000009'), reserveB: toBigNumber('100000'), targetRatio: toUnit(String(50/50), 18), amountA: 0, amountB: 0, eTokenSupply: 0, eTokenAmount: 0, rebalancedAt: 0 }
        ],
        rate: toUnit('1', 18),
        feeRate: toUnit('1', 18),
        results: {
          delta: { deltaA: toBigNumber('0'), deltaB: toBigNumber('0'), rChange: 0 },
          tranches: [
            {
              currentRatio: toBigNumber('1000000000000000090'),
              trancheDelta: { deltaA: toBigNumber('0'), deltaB: toBigNumber('0'), rChange: 0, rDiv: 0 },
              eTokenForTokenATokenB: 0,
              tokenATokenBForEToken: { amountA: 0, amountB: 0 },
              tokenAForTokenB: 0,
              tokenBForTokenA: 0,
              tokenATokenBForTokenA: { amountA: 0, amountB: 0 },
              tokenATokenBForTokenB: { amountA: 0, amountB: 0 }
            },
          ]
        }
      },
      // underflow by rounding error - in totalDeltaB
      {
        decA: 18,
        decB: 6,
        sFactorA: toUnit('1', 18),
        sFactorB: toUnit('1', 6),
        tranches: [
          { reserveA: toBigNumber('3811729104010212'), reserveB: toBigNumber('8067834'), targetRatio: toUnit(String(50/50), 18), amountA: 0, amountB: 0, eTokenSupply: 0, eTokenAmount: 0, rebalancedAt: 0 },
          { reserveA: toBigNumber('2082532324155799'), reserveB: toBigNumber('13369999'), targetRatio: toUnit(String(25/75), 18), amountA: 0, amountB: 0, eTokenSupply: 0, eTokenAmount: 0, rebalancedAt: 0 },
          { reserveA: toBigNumber('11183284412251486'), reserveB: toBigNumber('7893085'), targetRatio: toUnit(String(75/25), 18), amountA: 0, amountB: 0, eTokenSupply: 0, eTokenAmount: 0, rebalancedAt: 0 }
        ],
        rate: toBigNumber('2122977615747369595606'),
        feeRate: toBigNumber('5000000000000000'),
        results: {
          delta: { deltaA: toBigNumber('0'), deltaB: toBigNumber('0'), rChange: 0 },
          tranches: [
            {
              currentRatio: toBigNumber('1003022070744943096'),
              trancheDelta: { deltaA: toBigNumber('5742303857941'), deltaB: toBigNumber('10614'), rChange: 0, rDiv: toBigNumber('3022070744943096') },
              eTokenForTokenATokenB: 0,
              tokenATokenBForEToken: { amountA: 0, amountB: 0 },
              tokenAForTokenB: 0,
              tokenBForTokenA: 0,
              tokenATokenBForTokenA: { amountA: 0, amountB: 0 },
              tokenATokenBForTokenB: { amountA: 0, amountB: 0 }
            },
            {
              currentRatio: toBigNumber('330678372395772534'),
              trancheDelta: { deltaA: toBigNumber('12540225866110'), deltaB: toBigNumber('25475'), rChange: 1, rDiv: toBigNumber('7964882812682299') },
              eTokenForTokenATokenB: 0,
              tokenATokenBForEToken: { amountA: 0, amountB: 0 },
              tokenAForTokenB: 0,
              tokenBForTokenA: 0,
              tokenATokenBForTokenA: { amountA: 0, amountB: 0 },
              tokenATokenBForTokenB: { amountA: 0, amountB: 0 }
            },
            {
              currentRatio: toBigNumber('3007931940140817345'),
              trancheDelta: { deltaA: toBigNumber('7372602198203'), deltaB: toBigNumber('14860'), rChange: 0, rDiv: toBigNumber('2643980046939115') },
              eTokenForTokenATokenB: 0,
              tokenATokenBForEToken: { amountA: 0, amountB: 0 },
              tokenAForTokenB: 0,
              tokenBForTokenA: 0,
              tokenATokenBForTokenA: { amountA: 0, amountB: 0 },
              tokenATokenBForTokenB: { amountA: 0, amountB: 0 }
            }
          ]
        }
      }
    ];
  });

  describe('#currentRatio', function () {
    before(async function () {
      this.currentRatio = async function(
        reserveA: EthersBigNumber,
        reserveB: EthersBigNumber,
        rate: EthersBigNumber,
        targetRatio: EthersBigNumber,
        rebalancedAt: EthersBigNumber,
        sFactorA?: EthersBigNumber,
        sFactorB?:EthersBigNumber
      ): Promise<EthersBigNumber> {
        return await this.epl.connect(this.signers.admin).currentRatio(
          {
            eToken: ethers.constants.AddressZero, sFactorE: this.sFactorE, reserveA, reserveB, targetRatio, rebalancedAt
          },
          rate,
          sFactorA || this.sFactorA,
          sFactorB || this.sFactorB
        );
      };
    });

    it('should return correct current ratio for all scenarios', async function () {
      for (const s of this.scenarios) {
        this.decA = s.decA;
        this.decB = s.decB;
        for (let i = 0; i < s.tranches.length; i++) {
          const t = s.tranches[i];
          const result = s.results.tranches[i].currentRatio;
          const ratio = await this.currentRatio(
            t.reserveA, t.reserveB, s.rate, t.targetRatio, t.rebalancedAt, s.sFactorA, s.sFactorB
          );
          assert(ratio.eq(result), `expected ratio: ${result.toString()}, actual ratio: ${ratio.toString()}`);
        }
      }
    });
  });

  describe('#trancheDelta', function () {
    before(async function () {
      this.trancheDelta = async function (
        reserveA: EthersBigNumber,
        reserveB: EthersBigNumber,
        rate: EthersBigNumber,
        targetRatio: EthersBigNumber,
        rebalancedAt: EthersBigNumber,
        sFactorA?: EthersBigNumber,
        sFactorB?:EthersBigNumber
      ): Promise<{ deltaA: EthersBigNumber; deltaB: EthersBigNumber; rChange: EthersBigNumber; rDiv: EthersBigNumber }> {
        return await this.epl.connect(this.signers.admin).trancheDelta(
          {
            eToken: ethers.constants.AddressZero, sFactorE: this.sFactorE, reserveA, reserveB, targetRatio, rebalancedAt
          },
          rate,
          sFactorA || this.sFactorA,
          sFactorB || this.sFactorB
        );
      };
    });

    it('should return correct deltaA, deltaB, rChange for all scenarios', async function () {
      for (const s of this.scenarios) {
        this.decA = s.decA;
        this.decB = s.decB;
        for (let i = 0; i < s.tranches.length; i++) {
          const t = s.tranches[i];
          const result = s.results.tranches[i].trancheDelta;
          const delta = await this.trancheDelta(
            t.reserveA, t.reserveB, s.rate, t.targetRatio, t.rebalancedAt, s.sFactorA, s.sFactorB
          );
          assert(
            delta.deltaA.eq(result.deltaA)
            && delta.deltaB.eq(result.deltaB)
            && delta.rChange.eq(result.rChange)
            && delta.rDiv.eq(result.rDiv),
            `
            expected deltaA: ${result.deltaA.toString()}, actual deltaA: ${delta.deltaA.toString()}
            expected deltaB: ${result.deltaB.toString()}, actual deltaB: ${delta.deltaB.toString()}
            expected rChange: ${result.rChange.toString()}, actual rChange: ${delta.rChange.toString()}
            expected rDiv: ${result.rDiv.toString()}, actual rDiv: ${delta.rDiv.toString()}
            `
          );
        }
      }
    });
  });

  describe('#delta', function () {
    before(async function () {
      this.delta = async function (
        tranches: {
          reserveA: EthersBigNumber; reserveB: EthersBigNumber; targetRatio: EthersBigNumber, rebalancedAt: EthersBigNumber
        }[],
        rate: EthersBigNumber,
        sFactorA?: EthersBigNumber,
        sFactorB?:EthersBigNumber
      ): Promise<{ deltaA: EthersBigNumber; deltaB: EthersBigNumber; rChange: EthersBigNumber }> {
        return await this.epl.connect(this.signers.admin).delta(
          tranches.map((t) => ({ ...t, eToken: ethers.constants.AddressZero, sFactorE: this.sFactorE })),
          rate,
          sFactorA || this.sFactorA,
          sFactorB || this.sFactorB
        );
      };
    });

    it('should return correct deltaA, deltaB, rChange for all scenarios', async function () {
      for (const s of this.scenarios) {
        this.decA = s.decA;
        this.decB = s.decB;
        const result = s.results.delta;
        const delta = await this.delta(s.tranches, s.rate, s.sFactorA, s.sFactorB);
        assert(
          delta.deltaA.eq(result.deltaA) && delta.deltaB.eq(result.deltaB) && delta.rChange.eq(result.rChange),
          `
          expected deltaA: ${result.deltaA.toString()}, actual deltaA: ${delta.deltaA.toString()}
          expected deltaB: ${result.deltaB.toString()}, actual deltaB: ${delta.deltaB.toString()}
          expected rChange: ${result.rChange.toString()}, actual rChange: ${delta.rChange.toString()}
          `
        );
      }
    });
  });

  describe('#eTokenForTokenATokenB', function () {
    before(async function () {
      this.eTokenForTokenATokenB = async function(
        eToken: string,
        reserveA: EthersBigNumber,
        reserveB: EthersBigNumber,
        rate: EthersBigNumber,
        targetRatio: EthersBigNumber,
        rebalancedAt: EthersBigNumber,
        amountA: EthersBigNumber,
        amountB: EthersBigNumber,
        sFactorA?: EthersBigNumber,
        sFactorB?:EthersBigNumber
      ): Promise<EthersBigNumber> {
        return await this.epl.connect(this.signers.admin).eTokenForTokenATokenB(
          { eToken, sFactorE: this.sFactorE, reserveA, reserveB, targetRatio, rebalancedAt },
          amountA,
          amountB,
          rate,
          sFactorA || this.sFactorA,
          sFactorB || this.sFactorB
        );
      };
    });

    it('should return correct eToken amount for TokenA and TokenB for all scenarios', async function () {
      for (const s of this.scenarios) {
        this.decA = s.decA;
        this.decB = s.decB;
        for (let i = 0; i < s.tranches.length; i++) {
          const t = s.tranches[i];
          this.eToken = (await deployContract(this.signers.admin, ETokenArtifact, [
            ethers.constants.AddressZero, 'ET', 'EToken', this.accounts.admin
          ])) as EToken;
          await this.eToken.connect(this.signers.admin).mint(this.accounts.admin, t.eTokenSupply);
          const result = s.results.tranches[i].eTokenForTokenATokenB;
          const amount = await this.eTokenForTokenATokenB(
            this.eToken.address,
            t.reserveA,
            t.reserveB,
            s.rate,
            t.targetRatio,
            t.rebalancedAt,
            t.amountA,
            t.amountB,
            s.sFactorA,
            s.sFactorB
          );
          assert(amount.eq(result), `expected amount: ${result.toString()}, actual amount: ${amount.toString()}`);
        }
      }
    });
  });

  describe('#tokenATokenBForEToken', function () {
    before(async function () {
      this.tokenATokenBForEToken = async function(
        eToken: string,
        reserveA: EthersBigNumber,
        reserveB: EthersBigNumber,
        rate: EthersBigNumber,
        targetRatio: EthersBigNumber,
        rebalancedAt: EthersBigNumber,
        amount: EthersBigNumber,
        sFactorA?: EthersBigNumber,
        sFactorB?:EthersBigNumber
      ): Promise<{ amountA: EthersBigNumber; amountB: EthersBigNumber; }> {
        return await this.epl.connect(this.signers.admin).tokenATokenBForEToken(
          { eToken, sFactorE: this.sFactorE, reserveA, reserveB, targetRatio, rebalancedAt },
          amount,
          rate,
          sFactorA || this.sFactorA,
          sFactorB || this.sFactorB
        );
      };
    });

    it('should return correct amount for TokenA and TokenB for eToken amount for all scenarios', async function () {
      for (const s of this.scenarios) {
        this.decA = s.decA;
        this.decB = s.decB;
        for (let i = 0; i < s.tranches.length; i++) {
          const t = s.tranches[i];
          this.eToken = (await deployContract(this.signers.admin, ETokenArtifact, [
            ethers.constants.AddressZero, 'ET', 'EToken', this.accounts.admin
          ])) as EToken;
          await this.eToken.connect(this.signers.admin).mint(this.accounts.admin, t.eTokenSupply);
          const result = s.results.tranches[i].tokenATokenBForEToken;
          const amounts = await this.tokenATokenBForEToken(
            this.eToken.address, t.reserveA, t.reserveB, s.rate, t.targetRatio, t.rebalancedAt, t.eTokenAmount, s.sFactorA, s.sFactorB
          );
          assert(
            this.roundEqual(amounts.amountA, result.amountA) && this.roundEqual(amounts.amountB, result.amountB),
            `
            expected amountA: ${result.amountA.toString()}, actual amountA: ${amounts.amountA.toString()}
            expected amountB: ${result.amountB.toString()}, actual amountB: ${amounts.amountB.toString()}
            `
          );
        }
      }
    });
  });

  describe('#tokenAForTokenB', function () {
    before(async function () {
      this.tokenAForTokenB = async function(
        amountB: EthersBigNumber,
        ratio: EthersBigNumber,
        rate: EthersBigNumber,
        sFactorA?: EthersBigNumber,
        sFactorB?:EthersBigNumber
      ): Promise<EthersBigNumber> {
        return await this.epl.connect(this.signers.admin).tokenAForTokenB(
          amountB,
          ratio,
          rate,
          sFactorA || this.sFactorA,
          sFactorB || this.sFactorB
        );
      };
    });

    it('should return correct amountA for amountB for all scenarios', async function () {
      for (const s of this.scenarios) {
        this.decA = s.decA;
        this.decB = s.decB;
        for (let i = 0; i < s.tranches.length; i++) {
          const t = s.tranches[i];
          const result = s.results.tranches[i].tokenAForTokenB;
          const amountA = await this.tokenAForTokenB(t.amountB, t.targetRatio, s.rate, s.sFactorA, s.sFactorB);
          assert(amountA.eq(result), `expected amountA: ${result.toString()}, actual amountA: ${amountA.toString()}`);
        }
      }
    });
  });

  describe('#tokenBForTokenA', function () {
    before(async function () {
      this.tokenBForTokenA = async function(
        amountA: EthersBigNumber,
        ratio: EthersBigNumber,
        rate: EthersBigNumber,
        sFactorA?: EthersBigNumber,
        sFactorB?:EthersBigNumber
      ): Promise<EthersBigNumber> {
        return await this.epl.connect(this.signers.admin).tokenBForTokenA(
          amountA,
          ratio,
          rate,
          sFactorA || this.sFactorA,
          sFactorB || this.sFactorB
        );
      };
    });

    it('should return correct amountB for amountA for all scenarios', async function () {
      for (const s of this.scenarios) {
        this.decA = s.decA;
        this.decB = s.decB;
        for (let i = 0; i < s.tranches.length; i++) {
          const t = s.tranches[i];
          const result = s.results.tranches[i].tokenBForTokenA;
          const amountB = await this.tokenBForTokenA(t.amountA, t.targetRatio, s.rate, s.sFactorA, s.sFactorB);
          assert(amountB.eq(result), `expected amountB: ${result.toString()}, actual amountB: ${amountB.toString()}`);
        }
      }
    });
  });

  describe('#tokenATokenBForTokenA', function () {
    before(async function () {
      this.tokenATokenBForTokenA = async function(
        amountA: EthersBigNumber,
        ratio: EthersBigNumber,
        rate: EthersBigNumber,
        sFactorA?: EthersBigNumber,
        sFactorB?:EthersBigNumber
      ): Promise<{ amountA: EthersBigNumber; amountB: EthersBigNumber; }> {
        return await this.epl.connect(this.signers.admin).tokenATokenBForTokenA(
          amountA,
          ratio,
          rate,
          sFactorA || this.sFactorA,
          sFactorB || this.sFactorB
        );
      };
    });

    it('should return correct amount for TokenA and TokenB for TokenA amount for all scenarios', async function () {
      for (const s of this.scenarios) {
        this.decA = s.decA;
        this.decB = s.decB;
        for (let i = 0; i < s.tranches.length; i++) {
          const t = s.tranches[i];
          const result = s.results.tranches[i].tokenATokenBForTokenA;
          const amounts = await this.tokenATokenBForTokenA(t.amountA, t.targetRatio, s.rate, s.sFactorA, s.sFactorB);
          assert(
            this.roundEqual(amounts.amountA, result.amountA) && this.roundEqual(amounts.amountB, result.amountB),
            `
            expected amountA: ${result.amountA.toString()}, actual amountA: ${amounts.amountA.toString()}
            expected amountB: ${result.amountB.toString()}, actual amountB: ${amounts.amountB.toString()}
            `
          );
        }
      }
    });
  });

  describe('#tokenATokenBForTokenB', function () {
    before(async function () {
      this.tokenATokenBForTokenB = async function(
        amountB: EthersBigNumber,
        ratio: EthersBigNumber,
        rate: EthersBigNumber,
        sFactorA?: EthersBigNumber,
        sFactorB?:EthersBigNumber
      ): Promise<{ amountA: EthersBigNumber; amountB: EthersBigNumber; }> {
        return await this.epl.connect(this.signers.admin).tokenATokenBForTokenB(
          amountB,
          ratio,
          rate,
          sFactorA || this.sFactorA,
          sFactorB || this.sFactorB
        );
      };
    });

    it('should return correct amount for TokenA and TokenB for TokenB amount for all scenarios', async function () {
      for (const s of this.scenarios) {
        this.decA = s.decA;
        this.decB = s.decB;
        for (let i = 0; i < s.tranches.length; i++) {
          const t = s.tranches[i];
          const result = s.results.tranches[i].tokenATokenBForTokenB;
          const totalB = EthersBigNumber.from(t.amountA).mul(s.rate).div(this.sFactorI).mul(s.sFactorB).div(s.sFactorA);
          const amounts = await this.tokenATokenBForTokenB(totalB, t.targetRatio, s.rate, s.sFactorA, s.sFactorB);
          assert(
            this.roundEqual(amounts.amountA, result.amountA) && this.roundEqual(amounts.amountB, result.amountB),
            `
            expected amountA: ${result.amountA.toString()}, actual amountA: ${amounts.amountA.toString()}
            expected amountB: ${result.amountB.toString()}, actual amountB: ${amounts.amountB.toString()}
            `
          );
        }
      }
    });
  });

  describe('#totalA', function () {
    before(async function () {
      this.totalA = async function(
        amountA: EthersBigNumber,
        amountB: EthersBigNumber,
        rate: EthersBigNumber,
        sFactorA?: EthersBigNumber,
        sFactorB?:EthersBigNumber
      ): Promise<EthersBigNumber> {
        return await this.epl.connect(this.signers.admin).totalA(
          amountA,
          amountB,
          rate,
          sFactorA || this.sFactorA,
          sFactorB || this.sFactorB
        );
      };
    });

    it('should return correct amount for of TotalA of TokenA and TokenB amount for all scenarios', async function () {
      for (const s of this.scenarios) {
        this.decA = s.decA;
        this.decB = s.decB;
        for (let i = 0; i < s.tranches.length; i++) {
          const t = s.tranches[i];
          const totalA = EthersBigNumber.from(t.amountB).mul(this.sFactorI).div(s.sFactorB).mul(this.sFactorI).div(s.rate).mul(s.sFactorA).div(this.sFactorI).add(t.amountA);
          const _totalA = await this.totalA(t.amountA, t.amountB, s.rate, s.sFactorA, s.sFactorB);
          assert(
            this.roundEqual(totalA, _totalA),
            `
            expected totalA: ${totalA.toString()}, actual totalA: ${_totalA.toString()}
            `
          );
        }
      }
    });
  });

  describe('#totalB', function () {
    before(async function () {
      this.totalB = async function(
        amountA: EthersBigNumber,
        amountB: EthersBigNumber,
        rate: EthersBigNumber,
        sFactorA?: EthersBigNumber,
        sFactorB?:EthersBigNumber
      ): Promise<EthersBigNumber> {
        return await this.epl.connect(this.signers.admin).totalB(
          amountA,
          amountB,
          rate,
          sFactorA || this.sFactorA,
          sFactorB || this.sFactorB
        );
      };
    });

    it('should return correct amount for of TotalB of TokenA and TokenB amount for all scenarios', async function () {
      for (const s of this.scenarios) {
        this.decA = s.decA;
        this.decB = s.decB;
        for (let i = 0; i < s.tranches.length; i++) {
          const t = s.tranches[i];
          const totalB = EthersBigNumber.from(t.amountA).mul(s.rate).div(this.sFactorI).mul(s.sFactorB).div(s.sFactorA).add(t.amountB);
          const _totalB = await this.totalB(t.amountA, t.amountB, s.rate, s.sFactorA, s.sFactorB);
          assert(
            this.roundEqual(totalB, _totalB),
            `
            expected totalA: ${totalB.toString()}, actual totalA: ${_totalB.toString()}
            `
          );
        }
      }
    });
  });

  describe('#feeAFeeBForTokenATokenB', function () {
    before(async function () {
      this.feeAFeeBForTokenATokenB = async function(
        amountA: EthersBigNumber,
        amountB: EthersBigNumber,
        feeRate: EthersBigNumber,
      ): Promise<{ feeA: EthersBigNumber; feeB: EthersBigNumber; }> {
        return await this.epl.connect(this.signers.admin).feeAFeeBForTokenATokenB(
          amountA,
          amountB,
          feeRate
        );
      };
    });

    it('should return correct feeA and feeB for TokenA and TokenB for all scenarios', async function () {
      for (const s of this.scenarios) {
        this.decA = s.decA;
        this.decB = s.decB;
        for (let i = 0; i < s.tranches.length; i++) {
          const t = s.tranches[i];
          const result = await this.feeAFeeBForTokenATokenB(t.amountA, t.amountB, s.feeRate);
          const feeA = EthersBigNumber.from(t.amountA).mul(s.feeRate).div(this.sFactorI);
          const feeB = EthersBigNumber.from(t.amountB).mul(s.feeRate).div(this.sFactorI);

          assert(
            this.roundEqual(feeA, result.feeA) && this.roundEqual(feeB, result.feeB),
            `
            expected feeA: ${feeA.toString()}, actual feeA: ${result.feeA.toString()}
            expected feeB: ${feeB.toString()}, actual feeB: ${result.feeB.toString()}
            `
          );
        }
      }
    });
  });
});
