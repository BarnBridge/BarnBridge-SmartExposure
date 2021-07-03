import { ethers, waffle } from 'hardhat';
import { assert } from 'chai';
import { BigNumber as EthersBigNumber } from 'ethers';

import ETokenArtifact from '../artifacts/contracts/EToken.sol/EToken.json';
import TestEPoolLibraryArtifact from '../artifacts/contracts/test/TestEPoolLibrary.sol/TestEPoolLibrary.json';
import { EToken, TestEPoolLibrary } from '../typechain';

import { environmentFixture, signersFixture } from './fixture';

const { deployContract } = waffle;
const { utils: { parseUnits: toUnit } } = ethers;

describe('EPoolLibrary', function () {

  before(async function () {
    await signersFixture.bind(this)();
    await environmentFixture.bind(this)();

    // deploy exposure pool library wrapper
    this.epl = (await deployContract(this.signers.admin, TestEPoolLibraryArtifact, [])) as TestEPoolLibrary;
    this.scenarios = [
      // reserves are 0
      {
        decA: 18,
        decB: 18,
        sFactorA: toUnit('1', 18),
        sFactorB: toUnit('1', 18),
        tranches: [
          { reserveA: 0, reserveB: 0, targetRatio: toUnit(String(30/70), 18), amountA: 0, amountB: ethers.BigNumber.from('2718281828459045235'), eTokenSupply: 1, eTokenAmount: ethers.BigNumber.from('1414213562373095048') },
          { reserveA: 0, reserveB: 0, targetRatio: toUnit(String(50/50), 18), amountA: ethers.BigNumber.from('3141592653589793238'), amountB: toUnit('1', 18), eTokenSupply: toUnit('100000', 18), eTokenAmount: ethers.BigNumber.from('1414213562373095048') },
          { reserveA: 0, reserveB: 0, targetRatio: toUnit(String(70/30), 18), amountA: ethers.BigNumber.from('3141592653589793238'), amountB: ethers.BigNumber.from('2718281828459045235'), eTokenSupply: toUnit('17', 18), eTokenAmount: ethers.BigNumber.from('1414213562373095048') }
        ],
        rate: toUnit('1', 18),
        feeRate: 0,
        results: {
          delta: { deltaA: 0, deltaB: 0, rChange: 0, rDiv: 0 },
          tranches: [
            {
              currentRatio: ethers.BigNumber.from('428571428571428550'),
              trancheDelta: { deltaA: 0, deltaB: 0, rChange: 0 },
              eTokenForTokenATokenB: ethers.BigNumber.from('1648721270700128146'),
              tokenATokenBForEToken: { amountA: ethers.BigNumber.from('599999999999999979'), amountB: ethers.BigNumber.from('1400000000000000018') },
              tokenAForTokenB: ethers.BigNumber.from('1164977926482447899'),
              tokenBForTokenA: ethers.BigNumber.from('0'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('0'), amountB: ethers.BigNumber.from('0') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('0'), amountB: ethers.BigNumber.from('0') }
            },
            {
              currentRatio: ethers.BigNumber.from('1000000000000000000'),
              trancheDelta: { deltaA: 0, deltaB: 0, rChange: 0 },
              eTokenForTokenATokenB: ethers.BigNumber.from('2035090330572526020'),
              tokenATokenBForEToken: { amountA: ethers.BigNumber.from('999999999999999999'), amountB: ethers.BigNumber.from('999999999999999999') },
              tokenAForTokenB: ethers.BigNumber.from('1000000000000000000'),
              tokenBForTokenA: ethers.BigNumber.from('3141592653589793238'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('1570796326794896619'), amountB: ethers.BigNumber.from('1570796326794896619') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('1570796326794896619'), amountB: ethers.BigNumber.from('1570796326794896619') }
            },
            {
              currentRatio: ethers.BigNumber.from('2333333333333333500'),
              trancheDelta: { deltaA: 0, deltaB: 0, rChange: 0 },
              eTokenForTokenATokenB: ethers.BigNumber.from('2420717761749361493'),
              tokenATokenBForEToken: { amountA: ethers.BigNumber.from('1400000000000000028'), amountB: ethers.BigNumber.from('599999999999999969') },
              tokenAForTokenB: ethers.BigNumber.from('6342657599737772668'),
              tokenBForTokenA: ethers.BigNumber.from('1346396851538482720'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('2199114857512855314'), amountB: ethers.BigNumber.from('942477796076937924') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('2199114857512855314'), amountB: ethers.BigNumber.from('942477796076937924') }
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
          { reserveA: 0, reserveB: toUnit('1', 18), targetRatio: toUnit(String(30/70), 18), amountA: 0, amountB: ethers.BigNumber.from('2718281828459045235'), eTokenSupply: 1, eTokenAmount: ethers.BigNumber.from('1414213562373095048') },
          { reserveA: 0, reserveB: toUnit('10', 18), targetRatio: toUnit(String(50/50), 18), amountA: ethers.BigNumber.from('3141592653589793238'), amountB: toUnit('1', 18), eTokenSupply: toUnit('100000', 18), eTokenAmount: ethers.BigNumber.from('1414213562373095048') },
          { reserveA: 0, reserveB: toUnit('1000', 18), targetRatio: toUnit(String(70/30), 18), amountA: ethers.BigNumber.from('3141592653589793238'), amountB: ethers.BigNumber.from('2718281828459045235'), eTokenSupply: toUnit('17', 18), eTokenAmount: ethers.BigNumber.from('1414213562373095048') }
        ],
        rate: toUnit('1', 18),
        feeRate: toUnit('1', 18),
        results: {
          delta: { deltaA: ethers.BigNumber.from('705300000000000014988'), deltaB: ethers.BigNumber.from('705300000000000014988'), rChange: 1, rDiv: 0 },
          tranches: [
            {
              currentRatio: 0,
              trancheDelta: { deltaA: ethers.BigNumber.from('299999999999999989'), deltaB: ethers.BigNumber.from('299999999999999989'), rChange: 1 },
              eTokenForTokenATokenB: 2,
              tokenATokenBForEToken: { amountA: 0, amountB: ethers.BigNumber.from('1414213562373095048000000000000000000') },
              tokenAForTokenB: ethers.BigNumber.from('1164977926482447899'),
              tokenBForTokenA: ethers.BigNumber.from('0'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('0'), amountB: ethers.BigNumber.from('0') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('0'), amountB: ethers.BigNumber.from('0') }
            },
            {
              currentRatio: 0,
              trancheDelta: { deltaA: toUnit('5', 18), deltaB: toUnit('5', 18), rChange: 1 },
              eTokenForTokenATokenB: ethers.BigNumber.from('41415926535897932300000'),
              tokenATokenBForEToken: { amountA: 0, amountB: ethers.BigNumber.from('141421356237300') },
              tokenAForTokenB: ethers.BigNumber.from('1000000000000000000'),
              tokenBForTokenA: ethers.BigNumber.from('3141592653589793238'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('1570796326794896619'), amountB: ethers.BigNumber.from('1570796326794896619') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('1570796326794896619'), amountB: ethers.BigNumber.from('1570796326794896619') }
            },
            {
              currentRatio: 0,
              trancheDelta: { deltaA: ethers.BigNumber.from('700000000000000014999'), deltaB: ethers.BigNumber.from('700000000000000014999'), rChange: 1 },
              eTokenForTokenATokenB: ethers.BigNumber.from('99617866194830246'),
              tokenATokenBForEToken: { amountA: 0, amountB: ethers.BigNumber.from('83189033080770296000') },
              tokenAForTokenB: ethers.BigNumber.from('6342657599737772668'),
              tokenBForTokenA: ethers.BigNumber.from('1346396851538482720'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('2199114857512855314'), amountB: ethers.BigNumber.from('942477796076937924') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('2199114857512855314'), amountB: ethers.BigNumber.from('942477796076937924') }
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
          { reserveA: 0, reserveB: toUnit('1', 18), targetRatio: toUnit(String(30/70), 18), amountA: 0, amountB: ethers.BigNumber.from('2718281828459045235'), eTokenSupply: 1, eTokenAmount: ethers.BigNumber.from('1414213562373095048') },
          { reserveA: 0, reserveB: toUnit('10', 18), targetRatio: toUnit(String(50/50), 18), amountA: ethers.BigNumber.from('3141592653589793238'), amountB: toUnit('1', 18), eTokenSupply: toUnit('100000', 18), eTokenAmount: ethers.BigNumber.from('1414213562373095048') },
          { reserveA: 0, reserveB: toUnit('1000', 18), targetRatio: toUnit(String(70/30), 18), amountA: ethers.BigNumber.from('3141592653589793238'), amountB: ethers.BigNumber.from('2718281828459045235'), eTokenSupply: toUnit('17', 18), eTokenAmount: ethers.BigNumber.from('1414213562373095048') }
        ],
        rate: toUnit('2', 18),
        feeRate: toUnit('0.05', 18),
        results: {
          delta: { deltaA: ethers.BigNumber.from('352650000000000007493'), deltaB: ethers.BigNumber.from('705300000000000014986'), rChange: 1, rDiv: 0 },
          tranches: [
            {
              currentRatio: 0,
              trancheDelta: { deltaA: ethers.BigNumber.from('149999999999999994'), deltaB: ethers.BigNumber.from('299999999999999988'), rChange: 1 },
              eTokenForTokenATokenB: 2,
              tokenATokenBForEToken: { amountA: 0, amountB: ethers.BigNumber.from('1414213562373095048000000000000000000') },
              tokenAForTokenB: ethers.BigNumber.from('582488963241223949'),
              tokenBForTokenA: ethers.BigNumber.from('0'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('0'), amountB: ethers.BigNumber.from('0') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('0'), amountB: ethers.BigNumber.from('0') }
            },
            {
              currentRatio: 0,
              trancheDelta: { deltaA: toUnit('2.5', 18), deltaB: toUnit('5', 18), rChange: 1 },
              eTokenForTokenATokenB: ethers.BigNumber.from('72831853071795864700000'),
              tokenATokenBForEToken: { amountA: 0, amountB: ethers.BigNumber.from('141421356237300') },
              tokenAForTokenB: ethers.BigNumber.from('500000000000000000'),
              tokenBForTokenA: ethers.BigNumber.from('6283185307179586476'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('1570796326794896619'), amountB: ethers.BigNumber.from('3141592653589793238') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('1570796326794896619'), amountB: ethers.BigNumber.from('3141592653589793238') }
            },
            {
              currentRatio: 0,
              trancheDelta: { deltaA: ethers.BigNumber.from('350000000000000007499'), deltaB: ethers.BigNumber.from('700000000000000014998'), rChange: 1 },
              eTokenForTokenATokenB: ethers.BigNumber.from('153024941305856727'),
              tokenATokenBForEToken: { amountA: 0, amountB: ethers.BigNumber.from('83189033080770296000') },
              tokenAForTokenB: ethers.BigNumber.from('3171328799868886334'),
              tokenBForTokenA: ethers.BigNumber.from('2692793703076965440'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('2199114857512855314'), amountB: ethers.BigNumber.from('1884955592153875848') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('2199114857512855314'), amountB: ethers.BigNumber.from('1884955592153875848') }
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
          { reserveA: 0, reserveB: toUnit('1', 18), targetRatio: toUnit(String(30/70), 18), amountA: 0, amountB: ethers.BigNumber.from('2718281828459045235'), eTokenSupply: 1, eTokenAmount: ethers.BigNumber.from('1414213562373095048') },
          { reserveA: 0, reserveB: toUnit('10', 18), targetRatio: toUnit(String(50/50), 18), amountA: ethers.BigNumber.from('3141592653589793238'), amountB: toUnit('1', 18), eTokenSupply: toUnit('100000', 18), eTokenAmount: ethers.BigNumber.from('1414213562373095048') },
          { reserveA: 0, reserveB: toUnit('1000', 18), targetRatio: toUnit(String(70/30), 18), amountA: ethers.BigNumber.from('3141592653589793238'), amountB: ethers.BigNumber.from('2718281828459045235'), eTokenSupply: toUnit('17', 18), eTokenAmount: ethers.BigNumber.from('1414213562373095048') }
        ],
        rate: toUnit('2', 18),
        feeRate: toUnit('1', 18),
        targetRatio: toUnit('1', 18),
        results: {
          delta: { deltaA: ethers.BigNumber.from('3526498'), deltaB: ethers.BigNumber.from('705299600000000000000'), rChange: 1, rDiv: 0 },
          tranches: [
            {
              currentRatio: 0,
              trancheDelta: { deltaA: ethers.BigNumber.from('1499'), deltaB: ethers.BigNumber.from('299800000000000000'), rChange: 1 },
              eTokenForTokenATokenB: 2,
              tokenATokenBForEToken: { amountA: 0, amountB: ethers.BigNumber.from('1414213562373095048000000000000000000') },
              tokenAForTokenB: ethers.BigNumber.from('5824'),
              tokenBForTokenA: ethers.BigNumber.from('0'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('0'), amountB: ethers.BigNumber.from('0') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('0'), amountB: ethers.BigNumber.from('0') }
            },
            {
              currentRatio: 0,
              trancheDelta: { deltaA: 25000, deltaB: ethers.BigNumber.from('5000000000000000000'), rChange: 1 },
              eTokenForTokenATokenB: ethers.BigNumber.from('6283185307179596476000000000000000000'),
              tokenATokenBForEToken: { amountA: 0, amountB: ethers.BigNumber.from('141421356237300') },
              tokenAForTokenB: ethers.BigNumber.from('5000'),
              tokenBForTokenA: ethers.BigNumber.from('628318530717958647600000000000000'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('1570796326794896619'), amountB: ethers.BigNumber.from('314159265358979323800000000000000') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('1570796326794896619'), amountB: ethers.BigNumber.from('314159265358979323800000000000000') }
            },
            {
              currentRatio: 0,
              trancheDelta: { deltaA: ethers.BigNumber.from('3499999'), deltaB: ethers.BigNumber.from('699999800000000000000'), rChange: 1 },
              eTokenForTokenATokenB: ethers.BigNumber.from('10681415022205343218600000000000'),
              tokenATokenBForEToken: { amountA: 0, amountB: ethers.BigNumber.from('83189033080770296000') },
              tokenAForTokenB: 31713,
              tokenBForTokenA: ethers.BigNumber.from('269279370307696544022902120870000'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('2199114857512855314'), amountB: ethers.BigNumber.from('188495559215387584855222039230620') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('2199114857512855314'), amountB: ethers.BigNumber.from('188495559215387584855222039230620') }
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
          { reserveA: toUnit('1', 18), reserveB: 0, targetRatio: toUnit(String(30/70), 18), amountA: 0, amountB: ethers.BigNumber.from('2718281828459045235'), eTokenSupply: 1, eTokenAmount: ethers.BigNumber.from('1414213562373095048') },
          { reserveA: toUnit('10', 18), reserveB: 0, targetRatio: toUnit(String(50/50), 18), amountA: ethers.BigNumber.from('3141592653589793238'), amountB: toUnit('1', 18), eTokenSupply: toUnit('100000', 18), eTokenAmount: ethers.BigNumber.from('1414213562373095048') },
          { reserveA: toUnit('1000', 18), reserveB: 0, targetRatio: toUnit(String(70/30), 18), amountA: ethers.BigNumber.from('3141592653589793238'), amountB: ethers.BigNumber.from('2718281828459045235'), eTokenSupply: toUnit('17', 18), eTokenAmount: ethers.BigNumber.from('1414213562373095048') }
        ],
        rate: toUnit('1', 18),
        feeRate: toUnit('2', 18),
        results: {
          delta: { deltaA: ethers.BigNumber.from('305699999999999985010'), deltaB: ethers.BigNumber.from('305699999999999985010'), rChange: 0, rDiv: ethers.BigNumber.from('302373887240356068') },
          tranches: [
            {
              currentRatio: ethers.BigNumber.from('115792089237316195423570985008687907853269984665640564039457584007913129639935'),
              trancheDelta: { deltaA: ethers.BigNumber.from('700000000000000010'), deltaB: ethers.BigNumber.from('700000000000000010'), rChange: 0 },
              eTokenForTokenATokenB: 2,
              tokenATokenBForEToken: { amountA: ethers.BigNumber.from('1414213562373095048000000000000000000'), amountB: 0 },
              tokenAForTokenB: ethers.BigNumber.from('1164977926482447899'),
              tokenBForTokenA: ethers.BigNumber.from('0'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('0'), amountB: ethers.BigNumber.from('0') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('0'), amountB: ethers.BigNumber.from('0') }
            },
            {
              currentRatio: ethers.BigNumber.from('115792089237316195423570985008687907853269984665640564039457584007913129639935'),
              trancheDelta: { deltaA: toUnit('5', 18), deltaB: toUnit('5', 18), rChange: 0 },
              eTokenForTokenATokenB: ethers.BigNumber.from('41415926535897932300000'),
              tokenATokenBForEToken: { amountA: ethers.BigNumber.from('141421356237300'), amountB: 0 },
              tokenAForTokenB: ethers.BigNumber.from('1000000000000000000'),
              tokenBForTokenA: ethers.BigNumber.from('3141592653589793238'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('1570796326794896619'), amountB: ethers.BigNumber.from('1570796326794896619') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('1570796326794896619'), amountB: ethers.BigNumber.from('1570796326794896619') }
            },
            {
              currentRatio: ethers.BigNumber.from('115792089237316195423570985008687907853269984665640564039457584007913129639935'),
              trancheDelta: { deltaA: ethers.BigNumber.from('299999999999999985000'), deltaB: ethers.BigNumber.from('299999999999999985000'), rChange: 0 },
              eTokenForTokenATokenB: ethers.BigNumber.from('99617866194830246'),
              tokenATokenBForEToken: { amountA: ethers.BigNumber.from('83189033080770296000'), amountB: 0 },
              tokenAForTokenB: ethers.BigNumber.from('6342657599737772668'),
              tokenBForTokenA: ethers.BigNumber.from('1346396851538482720'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('2199114857512855314'), amountB: ethers.BigNumber.from('942477796076937924') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('2199114857512855314'), amountB: ethers.BigNumber.from('942477796076937924') }
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
          { reserveA: toUnit('0.5', 18), reserveB: toUnit('0.5', 18), targetRatio: toUnit(String(30/70), 18), amountA: 0, amountB: ethers.BigNumber.from('2718281828459045235'), eTokenSupply: 1, eTokenAmount: ethers.BigNumber.from('1414213562373095048') },
          { reserveA: toUnit('0.5', 18), reserveB: toUnit('0.5', 18), targetRatio: toUnit(String(50/50), 18), amountA: ethers.BigNumber.from('3141592653589793238'), amountB: toUnit('1', 18), eTokenSupply: toUnit('100000', 18), eTokenAmount: ethers.BigNumber.from('1414213562373095048') },
          { reserveA: toUnit('0.5', 18), reserveB: toUnit('0.5', 18), targetRatio: toUnit(String(70/30), 18), amountA: ethers.BigNumber.from('3141592653589793238'), amountB: ethers.BigNumber.from('2718281828459045235'), eTokenSupply: toUnit('17', 18), eTokenAmount: ethers.BigNumber.from('1414213562373095048') }
        ],
        rate: toUnit('1', 18),
        feeRate: toUnit('100', 18),
        results: {
          delta: { deltaA: 4, deltaB: 4, rChange: 1, rDiv: 2 },
          tranches: [
            {
              currentRatio: ethers.BigNumber.from('1000000000000000000'),
              trancheDelta: { deltaA: ethers.BigNumber.from('200000000000000010'), deltaB: ethers.BigNumber.from('200000000000000010'), rChange: 0 },
              eTokenForTokenATokenB: 2,
              tokenATokenBForEToken: { amountA: ethers.BigNumber.from('707106781186547524000000000000000000'), amountB: ethers.BigNumber.from('707106781186547524000000000000000000') },
              tokenAForTokenB: ethers.BigNumber.from('1164977926482447899'),
              tokenBForTokenA: ethers.BigNumber.from('0'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('0'), amountB: ethers.BigNumber.from('0') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('0'), amountB: ethers.BigNumber.from('0') }
            },
            {
              currentRatio: ethers.BigNumber.from('1000000000000000000'),
              trancheDelta: { deltaA: 0, deltaB: 0, rChange: 0 },
              eTokenForTokenATokenB: ethers.BigNumber.from('414159265358979323800000'),
              tokenATokenBForEToken: { amountA: ethers.BigNumber.from('7071067811865'), amountB: ethers.BigNumber.from('7071067811865') },
              tokenAForTokenB: ethers.BigNumber.from('1000000000000000000'),
              tokenBForTokenA: ethers.BigNumber.from('3141592653589793238'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('1570796326794896619'), amountB: ethers.BigNumber.from('1570796326794896619') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('1570796326794896619'), amountB: ethers.BigNumber.from('1570796326794896619') }
            },
            {
              currentRatio: ethers.BigNumber.from('1000000000000000000'),
              trancheDelta: { deltaA: ethers.BigNumber.from('200000000000000014'), deltaB: ethers.BigNumber.from('200000000000000014'), rChange: 1 },
              eTokenForTokenATokenB: ethers.BigNumber.from('99617866194830254041'),
              tokenATokenBForEToken: { amountA: ethers.BigNumber.from('41594516540385148'), amountB: ethers.BigNumber.from('41594516540385148') },
              tokenAForTokenB: ethers.BigNumber.from('6342657599737772668'),
              tokenBForTokenA: ethers.BigNumber.from('1346396851538482720'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('2199114857512855314'), amountB: ethers.BigNumber.from('942477796076937924') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('2199114857512855314'), amountB: ethers.BigNumber.from('942477796076937924') }
            }
          ]
        }
      },
      // reserves are equal and non zero and rate is not 1
      {
        decA: 18,
        decB: 18,
        sFactorA: toUnit('1', 18),
        sFactorB: toUnit('1', 18),
        tranches: [
          { reserveA: toUnit('0.5', 18), reserveB: toUnit('0.5', 18), targetRatio: toUnit(String(30/70), 18), amountA: 0, amountB: ethers.BigNumber.from('2718281828459045235'), eTokenSupply: 1, eTokenAmount: ethers.BigNumber.from('1414213562373095048') },
          { reserveA: toUnit('0.5', 18), reserveB: toUnit('0.5', 18), targetRatio: toUnit(String(50/50), 18), amountA: ethers.BigNumber.from('3141592653589793238'), amountB: toUnit('1', 18), eTokenSupply: toUnit('100000', 18), eTokenAmount: ethers.BigNumber.from('1414213562373095048') },
          { reserveA: toUnit('0.5', 18), reserveB: toUnit('0.5', 18), targetRatio: toUnit(String(70/30), 18), amountA: ethers.BigNumber.from('3141592653589793238'), amountB: ethers.BigNumber.from('2718281828459045235'), eTokenSupply: toUnit('17', 18), eTokenAmount: ethers.BigNumber.from('1414213562373095048') }
        ],
        rate: toUnit('2', 18),
        feeRate: toUnit('1', 18),
        results: {
        delta: { deltaA: ethers.BigNumber.from('374999999999999997'), deltaB: ethers.BigNumber.from('749999999999999994'), rChange: 0, rDiv: ethers.BigNumber.from('249999999999999998') },
          tranches: [
            {
              currentRatio: ethers.BigNumber.from('2000000000000000000'),
              trancheDelta: { deltaA: ethers.BigNumber.from('275000000000000008'), deltaB: ethers.BigNumber.from('550000000000000016'), rChange: 0 },
              eTokenForTokenATokenB: 1,
              tokenATokenBForEToken: { amountA: ethers.BigNumber.from('707106781186547524000000000000000000'), amountB: ethers.BigNumber.from('707106781186547524000000000000000000') },
              tokenAForTokenB: ethers.BigNumber.from('582488963241223949'),
              tokenBForTokenA: ethers.BigNumber.from('0'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('0'), amountB: ethers.BigNumber.from('0') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('0'), amountB: ethers.BigNumber.from('0') }
            },
            {
              currentRatio: ethers.BigNumber.from('2000000000000000000'),
              trancheDelta: { deltaA: ethers.BigNumber.from('125000000000000000'), deltaB: ethers.BigNumber.from('250000000000000000'), rChange: 0 },
              eTokenForTokenATokenB: ethers.BigNumber.from('485545687145305765000000'),
              tokenATokenBForEToken: { amountA: ethers.BigNumber.from('7071067811865'), amountB: ethers.BigNumber.from('7071067811865') },
              tokenAForTokenB: ethers.BigNumber.from('500000000000000000'),
              tokenBForTokenA: ethers.BigNumber.from('6283185307179586476'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('1570796326794896619'), amountB: ethers.BigNumber.from('3141592653589793238') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('1570796326794896619'), amountB: ethers.BigNumber.from('3141592653589793238') }
            },
            {
              currentRatio: ethers.BigNumber.from('2000000000000000000'),
              trancheDelta: { deltaA: ethers.BigNumber.from('25000000000000011'), deltaB: ethers.BigNumber.from('50000000000000022'), rChange: 1 },
              eTokenForTokenATokenB: ethers.BigNumber.from('102016627537237826041'),
              tokenATokenBForEToken: { amountA: ethers.BigNumber.from('41594516540385148'), amountB: ethers.BigNumber.from('41594516540385148') },
              tokenAForTokenB: ethers.BigNumber.from('3171328799868886334'),
              tokenBForTokenA: ethers.BigNumber.from('2692793703076965440'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('2199114857512855314'), amountB: ethers.BigNumber.from('1884955592153875848') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('2199114857512855314'), amountB: ethers.BigNumber.from('1884955592153875848') }
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
          { reserveA: toUnit('0.5', 18), reserveB: toUnit('0.5', 18), targetRatio: toUnit(String(30/70), 18), amountA: 0, amountB: ethers.BigNumber.from('2718281828459045235'), eTokenSupply: 1, eTokenAmount: ethers.BigNumber.from('1414213562373095048') },
          { reserveA: toUnit('0.5', 18), reserveB: toUnit('0.5', 18), targetRatio: toUnit(String(50/50), 18), amountA: ethers.BigNumber.from('3141592653589793238'), amountB: toUnit('1', 18), eTokenSupply: toUnit('100000', 18), eTokenAmount: ethers.BigNumber.from('1414213562373095048') },
          { reserveA: toUnit('0.5', 18), reserveB: toUnit('0.5', 18), targetRatio: toUnit(String(70/30), 18), amountA: ethers.BigNumber.from('3141592653589793238'), amountB: ethers.BigNumber.from('2718281828459045235'), eTokenSupply: toUnit('17', 18), eTokenAmount: ethers.BigNumber.from('1414213562373095048') }
        ],
        rate: toUnit('2', 18),
        feeRate: toUnit('0.01', 18),
        results: {
          delta: { deltaA: ethers.BigNumber.from('750000002249996262'), deltaB: ethers.BigNumber.from('150000000449999252400000000000000'), rChange: 0, rDiv: ethers.BigNumber.from('500000001499997508') },
          tranches: [
            {
              currentRatio: ethers.BigNumber.from('200000000000000000000000000000000'),
              trancheDelta: { deltaA: ethers.BigNumber.from('350000002099999262'), deltaB: ethers.BigNumber.from('70000000419999852400000000000000'), rChange: 0 },
              eTokenForTokenATokenB: 0,
              tokenATokenBForEToken: { amountA: ethers.BigNumber.from('707106781186547524000000000000000000'), amountB: ethers.BigNumber.from('707106781186547524000000000000000000') },
              tokenAForTokenB: ethers.BigNumber.from('5824'),
              tokenBForTokenA: ethers.BigNumber.from('0'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('0'), amountB: ethers.BigNumber.from('0') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('0'), amountB: ethers.BigNumber.from('0') }
            },
            {
              currentRatio: ethers.BigNumber.from('200000000000000000000000000000000'),
              trancheDelta: { deltaA: ethers.BigNumber.from('249999999999998750'), deltaB: ethers.BigNumber.from('49999999999999750000000000000000'), rChange: 0 },
              eTokenForTokenATokenB: ethers.BigNumber.from('628318530717956506000000'),
              tokenATokenBForEToken: { amountA: 7071067811865, amountB: ethers.BigNumber.from('7071067811865') },
              tokenAForTokenB: ethers.BigNumber.from('5000'),
              tokenBForTokenA: ethers.BigNumber.from('628318530717958647600000000000000'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('1570796326794896619'), amountB: ethers.BigNumber.from('314159265358979323800000000000000') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('1570796326794896619'), amountB: ethers.BigNumber.from('314159265358979323800000000000000') }
            },
            {
              currentRatio: ethers.BigNumber.from('200000000000000000000000000000000'),
              trancheDelta: { deltaA: ethers.BigNumber.from('150000000149998250'), deltaB: ethers.BigNumber.from('30000000029999650000000000000000'), rChange: 0 },
              eTokenForTokenATokenB: ethers.BigNumber.from('106814150222052898114'),
              tokenATokenBForEToken: { amountA: ethers.BigNumber.from('41594516540385148'), amountB: ethers.BigNumber.from('41594516540385148') },
              tokenAForTokenB: 31713,
              tokenBForTokenA: ethers.BigNumber.from('269279370307696544022902120870000'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('2199114857512855314'), amountB: ethers.BigNumber.from('188495559215387584855222039230620') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('2199114857512855314'), amountB: ethers.BigNumber.from('188495559215387584855222039230620') }
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
          { reserveA: toUnit('1', 18), reserveB: toUnit('1', 18), targetRatio: toUnit(String(30/70), 18), amountA: 0, amountB: ethers.BigNumber.from('2718281828459045235'), eTokenSupply: 1, eTokenAmount: ethers.BigNumber.from('1414213562373095048') },
          { reserveA: toUnit('1', 18), reserveB: toUnit('1', 18), targetRatio: toUnit(String(50/50), 18), amountA: ethers.BigNumber.from('3141592653589793238'), amountB: toUnit('1', 18), eTokenSupply: toUnit('100000', 18), eTokenAmount: ethers.BigNumber.from('1414213562373095048') },
          { reserveA: toUnit('1', 18), reserveB: toUnit('1', 18), targetRatio: toUnit(String(70/30), 18), amountA: ethers.BigNumber.from('3141592653589793238'), amountB: ethers.BigNumber.from('2718281828459045235'), eTokenSupply: toUnit('17', 18), eTokenAmount: ethers.BigNumber.from('1414213562373095048') }
        ],
        rate: toUnit('1', 18),
        feeRate: toUnit('1', 18),
        results: {
          delta: { deltaA: ethers.BigNumber.from('14999999998500000045000000003'), deltaB: ethers.BigNumber.from('1499999999850000004'), rChange: 1, rDiv: ethers.BigNumber.from('4999999999500000015000000001') },
          tranches: [
            {
              currentRatio: ethers.BigNumber.from('100000000'),
              trancheDelta: { deltaA: ethers.BigNumber.from('2999999999299999894999999989'), deltaB: ethers.BigNumber.from('299999999929999989'), rChange: 1 },
              eTokenForTokenATokenB: 2,
              tokenATokenBForEToken: { amountA: ethers.BigNumber.from('1414213562373095048000000000000000000'), amountB: ethers.BigNumber.from('1414213562373095048000000000000000000') },
              tokenAForTokenB: ethers.BigNumber.from('11649779264824478996082465330'),
              tokenBForTokenA: ethers.BigNumber.from('0'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('0'), amountB: ethers.BigNumber.from('0') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('0'), amountB: ethers.BigNumber.from('0') }
            },
            {
              currentRatio: ethers.BigNumber.from('100000000'),
              trancheDelta: { deltaA: ethers.BigNumber.from('4999999999500000000000000000'), deltaB: ethers.BigNumber.from('499999999950000000'), rChange: 1 },
              eTokenForTokenATokenB: ethers.BigNumber.from('100000000021415926500000'),
              tokenATokenBForEToken: { amountA: ethers.BigNumber.from('14142135623730'), amountB: ethers.BigNumber.from('14142135623730') },
              tokenAForTokenB: ethers.BigNumber.from('10000000000000000000000000000'),
              tokenBForTokenA: ethers.BigNumber.from('314159265'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('1570796326794896619'), amountB: ethers.BigNumber.from('157079632') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('1570796326794896619'), amountB: ethers.BigNumber.from('157079632') }
            },
            {
              currentRatio: ethers.BigNumber.from('100000000'),
              trancheDelta: { deltaA: ethers.BigNumber.from('6999999999700000150000000014'), deltaB: ethers.BigNumber.from('699999999970000015'), rChange: 1 },
              eTokenForTokenATokenB: ethers.BigNumber.from('46210791084523397389'),
              tokenATokenBForEToken: { amountA: ethers.BigNumber.from('83189033080770296'), amountB: ethers.BigNumber.from('83189033080770296') },
              tokenAForTokenB: ethers.BigNumber.from('63426575997377726680469714098'),
              tokenBForTokenA: ethers.BigNumber.from('134639685'),
              tokenATokenBForTokenA: { amountA: ethers.BigNumber.from('2199114857512855314'), amountB: ethers.BigNumber.from('94247779') },
              tokenATokenBForTokenB: { amountA: ethers.BigNumber.from('2199114857512855314'), amountB: ethers.BigNumber.from('94247779') }
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
          { reserveA: ethers.BigNumber.from('100000000000000009'), reserveB: ethers.BigNumber.from('100000'), targetRatio: toUnit(String(50/50), 18), amountA: 0, amountB: 0, eTokenSupply: 0, eTokenAmount: 0 }
        ],
        rate: toUnit('1', 18),
        feeRate: toUnit('1', 18),
        results: {
          delta: { deltaA: ethers.BigNumber.from('0'), deltaB: ethers.BigNumber.from('0'), rChange: 0, rDiv: ethers.BigNumber.from('0') },
          tranches: [
            {
              currentRatio: ethers.BigNumber.from('1000000000000000090'),
              trancheDelta: { deltaA: ethers.BigNumber.from('0'), deltaB: ethers.BigNumber.from('0'), rChange: 0 },
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
          { reserveA: ethers.BigNumber.from('3811729104010212'), reserveB: ethers.BigNumber.from('8067834'), targetRatio: toUnit(String(50/50), 18), amountA: 0, amountB: 0, eTokenSupply: 0, eTokenAmount: 0 },
          { reserveA: ethers.BigNumber.from('2082532324155799'), reserveB: ethers.BigNumber.from('13369999'), targetRatio: toUnit(String(25/75), 18), amountA: 0, amountB: 0, eTokenSupply: 0, eTokenAmount: 0 },
          { reserveA: ethers.BigNumber.from('11183284412251486'), reserveB: ethers.BigNumber.from('7893085'), targetRatio: toUnit(String(75/25), 18), amountA: 0, amountB: 0, eTokenSupply: 0, eTokenAmount: 0 }
        ],
        rate: ethers.BigNumber.from('2122977615747369595606'),
        feeRate: ethers.BigNumber.from('5000000000000000'),
        results: {
          delta: { deltaA: ethers.BigNumber.from('0'), deltaB: ethers.BigNumber.from('0'), rChange: 0, rDiv: ethers.BigNumber.from('0') },
          tranches: [
            {
              currentRatio: ethers.BigNumber.from('1003022070744943096'),
              trancheDelta: { deltaA: ethers.BigNumber.from('5742303857941'), deltaB: ethers.BigNumber.from('10614'), rChange: 0 },
              eTokenForTokenATokenB: 0,
              tokenATokenBForEToken: { amountA: 0, amountB: 0 },
              tokenAForTokenB: 0,
              tokenBForTokenA: 0,
              tokenATokenBForTokenA: { amountA: 0, amountB: 0 },
              tokenATokenBForTokenB: { amountA: 0, amountB: 0 }
            },
            {
              currentRatio: ethers.BigNumber.from('330678372395772534'),
              trancheDelta: { deltaA: ethers.BigNumber.from('12540225866110'), deltaB: ethers.BigNumber.from('25475'), rChange: 1 },
              eTokenForTokenATokenB: 0,
              tokenATokenBForEToken: { amountA: 0, amountB: 0 },
              tokenAForTokenB: 0,
              tokenBForTokenA: 0,
              tokenATokenBForTokenA: { amountA: 0, amountB: 0 },
              tokenATokenBForTokenB: { amountA: 0, amountB: 0 }
            },
            {
              currentRatio: ethers.BigNumber.from('3007931940140817345'),
              trancheDelta: { deltaA: ethers.BigNumber.from('7372602198203'), deltaB: ethers.BigNumber.from('14860'), rChange: 0 },
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
        sFactorA?: EthersBigNumber,
        sFactorB?:EthersBigNumber
      ): Promise<EthersBigNumber> {
        return await this.epl.connect(this.signers.admin).currentRatio(
          { eToken: ethers.constants.AddressZero, sFactorE: this.sFactorE, reserveA, reserveB, targetRatio },
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
          const ratio = await this.currentRatio(t.reserveA, t.reserveB, s.rate, t.targetRatio, s.sFactorA, s.sFactorB);
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
        sFactorA?: EthersBigNumber,
        sFactorB?:EthersBigNumber
      ): Promise<{ deltaA: EthersBigNumber; deltaB: EthersBigNumber; rChange: EthersBigNumber; }> {
        return await this.epl.connect(this.signers.admin).trancheDelta(
          { eToken: ethers.constants.AddressZero, sFactorE: this.sFactorE, reserveA, reserveB, targetRatio },
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
          const delta = await this.trancheDelta(t.reserveA, t.reserveB, s.rate, t.targetRatio, s.sFactorA, s.sFactorB);
          assert(
            delta.deltaA.eq(result.deltaA) && delta.deltaB.eq(result.deltaB) && delta.rChange.eq(result.rChange),
            `
            expected deltaA: ${result.deltaA.toString()}, actual deltaA: ${delta.deltaA.toString()}
            expected deltaB: ${result.deltaB.toString()}, actual deltaB: ${delta.deltaB.toString()}
            expected rChange: ${result.rChange.toString()}, actual rChange: ${delta.rChange.toString()}
            `
          );
        }
      }
    });
  });

  describe('#delta', function () {
    before(async function () {
      this.delta = async function (
        tranches: { reserveA: EthersBigNumber; reserveB: EthersBigNumber; targetRatio: EthersBigNumber }[],
        rate: EthersBigNumber,
        sFactorA?: EthersBigNumber,
        sFactorB?:EthersBigNumber
      ): Promise<{ deltaA: EthersBigNumber; deltaB: EthersBigNumber; rChange: EthersBigNumber; }> {
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
        amountA: EthersBigNumber,
        amountB: EthersBigNumber,
        sFactorA?: EthersBigNumber,
        sFactorB?:EthersBigNumber
      ): Promise<EthersBigNumber> {
        return await this.epl.connect(this.signers.admin).eTokenForTokenATokenB(
          { eToken, sFactorE: this.sFactorE, reserveA, reserveB, targetRatio },
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
            this.eToken.address, t.reserveA, t.reserveB, s.rate, t.targetRatio, t.amountA, t.amountB, s.sFactorA, s.sFactorB
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
        amount: EthersBigNumber,
        sFactorA?: EthersBigNumber,
        sFactorB?:EthersBigNumber
      ): Promise<{ amountA: EthersBigNumber; amountB: EthersBigNumber; }> {
        return await this.epl.connect(this.signers.admin).tokenATokenBForEToken(
          { eToken, sFactorE: this.sFactorE, reserveA, reserveB, targetRatio },
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
            this.eToken.address, t.reserveA, t.reserveB, s.rate, t.targetRatio, t.eTokenAmount, s.sFactorA, s.sFactorB
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
