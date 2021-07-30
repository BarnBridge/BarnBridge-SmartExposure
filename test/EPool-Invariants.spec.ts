import { ethers } from 'hardhat';
import { assert } from 'chai';

import ETokenArtifact from '../artifacts/contracts/EToken.sol/EToken.json';
import { EToken } from '../typechain';

import { environmentFixture, signersFixture } from './fixture';

const { utils: { parseUnits } } = ethers;

describe('EPool-Invariants', function () {
  before(async function () {
    await signersFixture.bind(this)();
    if (!this.localRun) { this.skip(); }
  });

  describe('#Invariant', function () {
    beforeEach(async function () {
      await environmentFixture.bind(this)();
      this.targetRatio = parseUnits(String(30/70), this.decI);
      this.amountA = this.sFactorA.mul(1);
      await this.ep.connect(this.signers.admin).addTranche(
        this.targetRatio, 'Barnbridge Exposure Token Wrapped-Ether 30% / DAI 70%', 'bb_ET_WETH30/DAI70'
      );
      const eTokenAddr = await this.ep.connect(this.signers.admin).tranchesByIndex(0);
      this.eToken = new ethers.Contract(eTokenAddr, ETokenArtifact.abi) as EToken;
      await this.controller.connect(this.signers.admin).setDao(this.accounts.dao);
      await this.controller.connect(this.signers.dao).setGuardian(this.accounts.guardian);

      this.totalA = async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        const { reserveA, reserveB } = await this.ep.connect(this.signers.user).tranches(tranche.eToken);
        const rate = await this.ep.connect(this.signers.user).getRate();
        return reserveA.add(reserveB.mul(this.sFactorI).div(rate).mul(this.sFactorA).div(this.sFactorB));
      };

      await this.tokenA.connect(this.signers.admin).mint(this.accounts.user, this.sFactorA.mul('1000000000000000000000'));
      await this.tokenB.connect(this.signers.admin).mint(this.accounts.user, this.sFactorB.mul('1000000000000000000000'));
      await this.tokenA.connect(this.signers.admin).mint(this.accounts.user2, this.sFactorA.mul(1));
      await this.tokenB.connect(this.signers.admin).mint(this.accounts.user2, this.sFactorB.mul(5000));
      await this.tokenA.connect(this.signers.user).approve(this.ep.address, this.sFactorA.mul('1000000000000000000000'));
      await this.tokenB.connect(this.signers.user).approve(this.ep.address, this.sFactorB.mul('1000000000000000000000'));
      await this.tokenA.connect(this.signers.user2).approve(this.ep.address, this.sFactorA.mul(1));
      await this.tokenB.connect(this.signers.user2).approve(this.ep.address, this.sFactorB.mul(5000));
    });

    xit('should never withdraw more than deposited for constant value', async function () {
      const startPrice = 1000, stepSize = 500, steps = 10;
      const topPrice = startPrice + 1.01 ** stepSize * steps;
      await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(startPrice));
      const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
      const amountB = await this.eph.connect(this.signers.user).tokenBForTokenA(this.ep.address, tranche.eToken, this.amountA);
      const eTokenAmount = await this.eph.connect(this.signers.user).eTokenForTokenATokenB(
        this.ep.address, tranche.eToken, this.amountA, amountB
      );
      await this.ep.connect(this.signers.user2).issueExact(this.eToken.address, eTokenAmount);
      const preTotalA = await this.totalA();
      await this.ep.connect(this.signers.user).issueExact(this.eToken.address, eTokenAmount);

      for (let i = 0; i < steps; i++) {
        const price = startPrice + (1.01 ** stepSize) * i;
        await this.aggregator.connect(this.signers.admin).setAnswer(parseUnits(String(price), this.decI));
        await this.ep.connect(this.signers.user).rebalance(this.sFactorI);
      }
      for (let i = 0; i < steps; i++) {
        const price = topPrice - (1.01 ** stepSize) * i;
        await this.aggregator.connect(this.signers.admin).setAnswer(parseUnits(String(price), this.decI));
        await this.ep.connect(this.signers.user).rebalance(this.sFactorI);
      }

      const balanceOf = await this.eToken.connect(this.signers.user).balanceOf(await this.signers.user.getAddress());
      await this.ep.connect(this.signers.user).redeemExact(this.eToken.address, balanceOf);
      const postTotalA = await this.totalA();
      assert(postTotalA.gte(preTotalA));
    }).timeout(100000);

    it('should never descrease in totalA', async function () {
      const priceA = 200, priceB = 3000;
      await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(priceA));
      const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
      const amountB = await this.eph.connect(this.signers.user).tokenBForTokenA(this.ep.address, tranche.eToken, this.amountA);
      const eTokenAmount = await this.eph.connect(this.signers.user).eTokenForTokenATokenB(
        this.ep.address, tranche.eToken, this.amountA, amountB
      );
      await this.ep.connect(this.signers.user2).issueExact(this.eToken.address, eTokenAmount);
      const preTotalA = await this.totalA();
      await this.ep.connect(this.signers.user).issueExact(this.eToken.address, eTokenAmount);

      for (let i = 0; i < 20; i++) {
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(priceB));
        const preTotalA_ = await this.totalA();
        await this.ep.connect(this.signers.user).rebalance(this.sFactorI);
        const postTotalA_ = await this.totalA();
        assert(this.roundEqual(postTotalA_, preTotalA_));
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(priceA));
        const preTotalA__ = await this.totalA();
        await this.ep.connect(this.signers.user).rebalance(this.sFactorI);
        const postTotalA__ = await this.totalA();
        assert(this.roundEqual(postTotalA__, preTotalA__));
      }

      const balanceOf = await this.eToken.connect(this.signers.user).balanceOf(await this.signers.user.getAddress());
      await this.ep.connect(this.signers.user).redeemExact(this.eToken.address, balanceOf);
      const { reserveA: _reserveA, reserveB: _reserveB } = await this.ep.connect(this.signers.user).tranches(tranche.eToken);
      const postTotalA = await this.totalA();
      assert(postTotalA.gte(preTotalA));
    }).timeout(100000);
  });
});
