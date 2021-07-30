import { ethers, waffle, network } from 'hardhat';
import { assert, expect } from 'chai';

import AggregatorMockArtifact from '../artifacts/contracts/mocks/AggregatorMock.sol/AggregatorMock.json';
import ControllerArtifact from '../artifacts/contracts/Controller.sol/Controller.json';
import ETokenArtifact from '../artifacts/contracts/EToken.sol/EToken.json';
import { AggregatorMock, EToken, Controller } from '../typechain';

import { environmentFixture, signersFixture } from './fixture';

const { deployContract } = waffle;
const { utils: { parseUnits } } = ethers;

describe('EPool', function () {

  before(async function () {
    await signersFixture.bind(this)();
    await environmentFixture.bind(this)();
    await this.controller.connect(this.signers.admin).setDao(this.accounts.dao);
    await this.controller.connect(this.signers.dao).setGuardian(this.accounts.guardian);
  });

  describe('#setController', function () {
    it('should update the address of the controller if msg.sender is the dao', async function () {
      this.controller2 = (await deployContract(this.signers.admin, ControllerArtifact, [])) as Controller;
      await expect(
        this.ep.connect(this.signers.dao).setController(this.controller2.address)
      ).to.emit(this.ep, 'SetController').withArgs(this.controller2.address);
      expect(await this.ep.connect(this.signers.dao).getController()).to.equal(this.controller2.address);
      await this.ep.connect(this.signers.admin).setController(this.controller.address);
    });

    it('should fail updating the address of the controller if msg.sender is not the dao', async function () {
      this.controller2 = (await deployContract(this.signers.admin, ControllerArtifact, [])) as Controller;
      await expect(
        this.ep.connect(this.signers.guardian).setController(this.controller2.address)
      ).to.be.revertedWith('EPool: not dao');
    });
  });

  describe('#setAggregator', function () {
    it('should update the address of the aggregator if msg.sender is the dao', async function () {
      this.aggregator2 = (await deployContract(this.signers.admin, AggregatorMockArtifact, [])) as AggregatorMock;
      await expect(
        this.ep.connect(this.signers.dao).setAggregator(this.aggregator2.address, false)
      ).to.emit(this.ep, 'SetAggregator').withArgs(this.aggregator2.address, false);
      expect(await this.ep.connect(this.signers.dao).getAggregator()).to.equal(this.aggregator2.address);
    });

    it('should fail updating the address of the aggregator if msg.sender is not the dao', async function () {
      this.aggregator2 = (await deployContract(this.signers.admin, AggregatorMockArtifact, [])) as AggregatorMock;
      await expect(
        this.ep.connect(this.signers.guardian).setAggregator(this.aggregator2.address, false)
      ).to.be.revertedWith('EPool: not dao');
    });
  });

  describe('#rate', function () {
    it('should return the expected rate - inverseRate false', async function () {
      this.aggregator2 = (await deployContract(this.signers.admin, AggregatorMockArtifact, [])) as AggregatorMock;
      await this.ep.connect(this.signers.dao).setAggregator(this.aggregator2.address, false);
      await this.aggregator2.connect(this.signers.admin).setAnswer(this.sFactorI.mul(2000));
      expect(await this.ep.connect(this.signers.dao).getRate()).to.equal(this.sFactorI.mul(2000));
    });

    it('should return the expected rate - inverseRate true', async function () {
      this.aggregator2 = (await deployContract(this.signers.admin, AggregatorMockArtifact, [])) as AggregatorMock;
      await this.ep.connect(this.signers.dao).setAggregator(this.aggregator2.address, true);
      await this.aggregator2.connect(this.signers.admin).setAnswer(this.sFactorI.mul(2000));
      expect(
        await this.ep.connect(this.signers.dao).getRate()).to.equal(
          this.sFactorI.mul(this.sFactorI).div(this.sFactorI.mul(2000)
        )
      );
    });
  });

  describe('#addTranche', function () {
    it('should create a new tranche', async function () {
      await expect(
        this.ep.connect(this.signers.dao).addTranche(1, '_', '_')
      ).to.emit(this.ep, 'AddedTranche').withArgs(await this.ep.connect(this.signers.dao).tranchesByIndex(0));
      const eTokenAddr = await this.ep.connect(this.signers.dao).tranchesByIndex(0);
      assert(eTokenAddr !== ethers.constants.AddressZero);
      this.eToken = new ethers.Contract(eTokenAddr, ETokenArtifact.abi) as EToken;
    });

    it('should fail creating a new tranche if the limit is reached', async function () {
      await this.ep.connect(this.signers.dao).addTranche(1, '_', '_');
      await this.ep.connect(this.signers.dao).addTranche(1, '_', '_');
      await this.ep.connect(this.signers.dao).addTranche(1, '_', '_');
      await this.ep.connect(this.signers.dao).addTranche(1, '_', '_');
      await expect(
        this.ep.connect(this.signers.dao).addTranche(1, '_', '_')
      ).to.be.revertedWith('EPool: max. tranche count');
    });
  });

  describe('integration', function () {
    // Ratio: 30/70 -> 0.42... (30% value in TokenA, 70% value in TokenB)
    // Rate: 100 (1 TokenA is 100 in TokenB)
    // TokenA: 5e18
    before(async function () {
      await environmentFixture.bind(this)();

      // approve TokenA and TokenB for EPool
      await this.tokenA.connect(this.signers.admin).approve(this.ep.address, this.sFactorA.mul(2));
      await this.tokenB.connect(this.signers.admin).approve(this.ep.address, this.sFactorB.mul(2));
      await this.tokenA.connect(this.signers.user).approve(this.ep.address, this.sFactorA.mul(5000));
      await this.tokenB.connect(this.signers.user).approve(this.ep.address, this.sFactorB.mul(5000));

      if (this.localRun || this.forking) {
        // initial exchange rate
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(1800));
      }

      // 30/70 interpreted as 30/70 split --> 30% value in TokenA, 70% value in TokenB
      this.targetRatio = parseUnits(String(30/70), this.decI);
      this.amountA = this.sFactorA.mul(1);

      // add tranche
      await this.ep.connect(this.signers.admin).addTranche(
        this.targetRatio, 'Barnbridge Exposure Token Wrapped-Ether 30% / DAI 70%', 'bb_ET_WETH30/DAI70'
      );
      const eTokenAddr = await this.ep.connect(this.signers.admin).tranchesByIndex(0);
      this.eToken = new ethers.Contract(eTokenAddr, ETokenArtifact.abi) as EToken;

      await this.controller.connect(this.signers.admin).setDao(this.accounts.dao);
      await this.controller.connect(this.signers.dao).setGuardian(this.accounts.guardian);
    });

    describe('#setFeeRate', function () {
      it('should set the fee rate if msg.sender is the dao', async function () {
        const feeRate = parseUnits('0.1', 18);
        await expect(
          this.ep.connect(this.signers.dao).setFeeRate(feeRate)
        ).to.emit(this.ep, 'SetFeeRate').withArgs(feeRate);
        assert((await this.ep.connect(this.signers.dao).feeRate()).eq(feeRate));
      });

      it('should fail setting the fee rate if msg.sender is not the dao', async function () {
        await expect(
          this.ep.connect(this.signers.guardian).setFeeRate(parseUnits('0.6', 18))
        ).to.be.revertedWith('EPool: not dao');
      });

      it('should fail setting the fee rate for fee rate exceeding the limit', async function () {
        await expect(
          this.ep.connect(this.signers.dao).setFeeRate(parseUnits('0.6', 18))
        ).to.be.revertedWith('EPool: above fee rate limit');
      });
    });

    describe('#issueExact', function () {
      it('should fail issuing EToken of tranche for an unregistered tranche', async function () {
        await expect(
          this.ep.connect(this.signers.user).issueExact(this.tokenA.address, this.sFactorE.mul(1))
        ).to.be.reverted;
      });

      it('should fail issuing EToken of tranche if issuance is paused', async function () {
        await this.controller.connect(this.signers.guardian).setPausedIssuance(true);
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        await expect(
          this.ep.connect(this.signers.user).issueExact(tranche.eToken, this.sFactorE.mul(1))
        ).to.be.revertedWith('EPool: issuance paused');
        await this.controller.connect(this.signers.guardian).setPausedIssuance(false);
      });

      it('should issue EToken of tranche', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        const amountB = await this.eph.connect(this.signers.user).tokenBForTokenA(this.ep.address, tranche.eToken, this.amountA);
        const eTokenAmount = await this.eph.connect(this.signers.user).eTokenForTokenATokenB(
          this.ep.address, tranche.eToken, this.amountA, amountB
        );
        const receipt = await (await this.ep.connect(this.signers.user).issueExact(this.eToken.address, eTokenAmount)).wait();
        const IssuanceEvent = new ethers.utils.Interface([this.ep.interface.getEvent('IssuedEToken')]);
        const event = receipt.events?.find((event: any) => {
          try { IssuanceEvent.parseLog(event); return true; } catch(error) { return false; }
        });
        if (event === undefined) { return assert(false); }
        const result = IssuanceEvent.parseLog(event);
        assert(
          result.args.eToken === tranche.eToken
          && result.args.amount.eq(eTokenAmount)
          && this.roundEqual(result.args.amountA, this.amountA)
          && this.roundEqual(result.args.amountB, amountB)
          && result.args.user === this.accounts.user
        );
        const totalSupply = await this.eToken.connect(this.signers.user).totalSupply();
        const balanceOf = await this.eToken.connect(this.signers.user).balanceOf(await this.signers.user.getAddress());
        assert(totalSupply.gt(0) && totalSupply.eq(balanceOf));
        const ratio = await this.eph.connect(this.signers.user).currentRatio(this.ep.address, tranche.eToken);
        assert(this.roundEqual(ratio, this.targetRatio));
        const [_amountA, _amountB] = await this.eph.connect(this.signers.user).tokenATokenBForEToken(
          this.ep.address, tranche.eToken, balanceOf
        );
        const _eTokenAmount = await this.eph.connect(this.signers.user).eTokenForTokenATokenB(
          this.ep.address, tranche.eToken, _amountA, _amountB
        );
        assert(this.roundEqual(balanceOf, _eTokenAmount));
      });
    });

    describe('#setRebalancingMode', function () {
      it('should set rebalanceMode if msg.sender is the dao', async function () {
        const mode = 1;
        await expect(
          this.ep.connect(this.signers.dao).setRebalanceMode(mode)
        ).to.emit(this.ep, 'SetRebalanceMode').withArgs(mode);
        assert((await this.ep.connect(this.signers.dao).rebalanceMode()).eq(mode));
      });

      it('should fail setting rebalanceMode if msg.sender is not the dao', async function () {
        await expect(
          this.ep.connect(this.signers.guardian).setRebalanceMode(1)
        ).to.revertedWith('EPool: not dao');
      });
    });

    describe('#setRebalanceMinRDiv', function () {
      it('should set minRDiv if msg.sender is the dao', async function () {
        const minRDiv = parseUnits('0.11', 18);
        await expect(
          this.ep.connect(this.signers.dao).setRebalanceMinRDiv(minRDiv)
        ).to.emit(this.ep, 'SetRebalanceMinRDiv').withArgs(minRDiv);
        assert((await this.ep.connect(this.signers.dao).rebalanceMinRDiv()).eq(minRDiv));
      });

      it('should fail setting minRDiv if msg.sender is not the dao', async function () {
        await expect(
          this.ep.connect(this.signers.guardian).setRebalanceMinRDiv(this.sFactorA.mul(1))
        ).to.revertedWith('EPool: not dao');
      });
    });

    describe('#setRebalanceInterval', function () {
      it('should set rebalancing interval if msg.sender is the dao', async function () {
        const interval = 100;
        await expect(
          this.ep.connect(this.signers.dao).setRebalanceInterval(interval)
        ).to.emit(this.ep, 'SetRebalanceInterval').withArgs(interval);
        assert((await this.ep.connect(this.signers.dao).rebalanceInterval()).eq(interval));
      });

      it('should fail setting min. deltaA if msg.sender is not the dao', async function () {
        await expect(
          this.ep.connect(this.signers.guardian).setRebalanceInterval(100)
        ).to.revertedWith('EPool: not dao');
      });
    });

    describe('#rebalance', function () {
      it('should fail rebalancing if fracDelta > 1.0', async function () {
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(2000));
        await expect(
          this.ep.connect(this.signers.user).rebalance(this.sFactorI.add(1))
        ).to.be.revertedWith('EPool: fracDelta > 1.0');
      });

      it('should rebalance tranches', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(2000));
        const currentRatioUnbalanced = await this.eph.connect(this.signers.user).currentRatio(this.ep.address, tranche.eToken);
        assert(!this.roundEqual(tranche.targetRatio, currentRatioUnbalanced))
        const delta = await this.eph.connect(this.signers.user).delta(this.ep.address);
        const preTrancheDelta = await this.eph.connect(this.signers.user).trancheDelta(this.ep.address, tranche.eToken);
        assert(preTrancheDelta.rDiv.gt(0));
        const receipt = await (await this.ep.connect(this.signers.user).rebalance(this.sFactorI)).wait();
        const RebalanceEvent = new ethers.utils.Interface([this.ep.interface.getEvent('RebalancedTranche')]);
        assert(receipt.events && receipt.events.length > 0);
        for (const event of receipt.events || []) {
          try { RebalanceEvent.parseLog(event); } catch(error) { continue; }
          if (event === undefined) { return assert(false); }
          const result = RebalanceEvent.parseLog(event);
          assert(
            this.roundEqual(result.args.deltaA, delta.deltaA)
            && this.roundEqual(result.args.deltaB, delta.deltaB)
            && this.roundEqual(result.args.rChange, delta.rChange)
          );
        }
        const postTrancheDelta = await this.eph.connect(this.signers.user).trancheDelta(this.ep.address, tranche.eToken);
        assert(postTrancheDelta.rDiv.eq(0));
        const currentRatioBalanced = await this.eph.connect(this.signers.user).currentRatio(this.ep.address, tranche.eToken);
        assert(!this.roundEqual(currentRatioUnbalanced, currentRatioBalanced));
        assert(this.roundEqual(currentRatioBalanced, tranche.targetRatio));
        const balanceOf = await this.eToken.connect(this.signers.user).balanceOf(await this.signers.user.getAddress());
        const [_amountA, _amountB] = await this.eph.connect(this.signers.user).tokenATokenBForEToken(
          this.ep.address, tranche.eToken, balanceOf
        );
        const eTokenAmount = await this.eph.connect(this.signers.user).eTokenForTokenATokenB(
          this.ep.address, tranche.eToken, _amountA, _amountB
        );
        assert(this.roundEqual(balanceOf, eTokenAmount));
      });

      it('rebalanceMode == 0: should not rebalance tranche if minRDiv is not met and if interval is not bided', async function () {
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(1980));
        await this.ep.connect(this.signers.dao).setRebalanceMode(0);
        const { rDiv: preRDiv } = await this.eph.connect(this.signers.user).trancheDelta(this.ep.address, this.eToken.address);
        await expect(
          this.ep.connect(this.signers.user).rebalance(this.sFactorI)
        ).to.not.emit(this.ep, 'RebalancedTranche');
        const { rDiv: postRDiv } = await this.eph.connect(this.signers.user).trancheDelta(this.ep.address, this.eToken.address);
        assert(preRDiv.eq(postRDiv));
      });

      it('rebalanceMode == 0: should rebalance if minRDiv is not met, interval is bided', async function () {
        await network.provider.send('evm_increaseTime', [
          (await this.ep.connect(this.signers.user).rebalanceInterval()).toNumber()
        ]);
        await expect(
          this.ep.connect(this.signers.user).rebalance(this.sFactorI)
        ).to.emit(this.ep, 'RebalancedTranche');
      });

      it('rebalanceMode == 0: should rebalance if minRDiv is met, interval is not bided', async function () {
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(2500));
        await expect(
          this.ep.connect(this.signers.user).rebalance(this.sFactorI)
        ).to.emit(this.ep, 'RebalancedTranche');
      });

      it('rebalanceMode == 1: should not rebalance if minRDiv is met, interval is not bided', async function () {
        await this.ep.connect(this.signers.dao).setRebalanceMode(1);
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(1980));
        await expect(
          this.ep.connect(this.signers.user).rebalance(this.sFactorI)
        ).to.not.emit(this.ep, 'RebalancedTranche');
      });

      it('rebalanceMode == 1: should not rebalance if minRDiv is not met, interval is bided', async function () {
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(2500));
        await network.provider.send('evm_increaseTime', [
          (await this.ep.connect(this.signers.user).rebalanceInterval()).toNumber()
        ]);
        await expect(
          this.ep.connect(this.signers.user).rebalance(this.sFactorI)
        ).to.not.emit(this.ep, 'RebalancedTranche');
      });

      it('rebalanceMode == 1: should rebalance if minRDiv is met, interval is bided', async function () {
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(1980));
        await expect(
          this.ep.connect(this.signers.user).rebalance(this.sFactorI)
        ).to.emit(this.ep, 'RebalancedTranche');
      });
    });

    describe('#redeemExact', function () {
      it('should fail redeeming EToken of tranche for an unregistered tranche', async function () {
        await expect(
          this.ep.connect(this.signers.user).redeemExact(this.tokenA.address, this.sFactorE.mul(1))
        ).to.be.reverted;
      });

      it('should fail redeeming EToken of tranche if msg.sender does not have enough EToken', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        await expect(
          this.ep.connect(this.signers.user).redeemExact(tranche.eToken, this.sFactorE.mul(10))
        ).to.be.revertedWith('EPool: insufficient EToken');
      });

      it('should redeem ETokens of tranche', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        const balanceOf = await this.eToken.connect(this.signers.user).balanceOf(await this.signers.user.getAddress());
        const [amountA, amountB] = await this.eph.connect(this.signers.user).tokenATokenBForEToken(
          this.ep.address, tranche.eToken, balanceOf
        );
        const [feeA, feeB] = await this.eph.connect(this.signers.user).feeAFeeBForEToken(this.ep.address, tranche.eToken, balanceOf);
        const [amountANet, amountBNet] = [amountA.sub(feeA), amountB.sub(feeB)];
        assert(this.roundEqual(tranche.reserveA, amountA) && this.roundEqual(tranche.reserveB, amountB));
        const receipt = await (await this.ep.connect(this.signers.user).redeemExact(this.eToken.address, balanceOf)).wait();
        const RedemptionEvent = new ethers.utils.Interface([this.ep.interface.getEvent('RedeemedEToken')]);
        const event = receipt.events?.find((event: any) => {
          try { RedemptionEvent.parseLog(event); return true; } catch(error) { return false; }
        });
        if (event === undefined) { return assert(false); }
        const result = RedemptionEvent.parseLog(event);
        assert(
          result.args.eToken === tranche.eToken
          && result.args.amount.eq(balanceOf)
          && this.roundEqual(result.args.amountA, amountANet)
          && this.roundEqual(result.args.amountB, amountBNet)
          && result.args.user === this.accounts.user
        );
        const { reserveA, reserveB } = await this.ep.connect(this.signers.user).tranches(tranche.eToken);
        assert(reserveA.eq(0) && reserveB.eq(0));
        const _balanceOf = await this.eToken.connect(this.signers.user).balanceOf(await this.signers.user.getAddress());
        assert(_balanceOf.eq(0));
      });

      it('should fail redeeming EToken of tranche if reserves are empty', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        await expect(
          this.ep.connect(this.signers.user).redeemExact(tranche.eToken, this.sFactorE.mul(10))
        ).to.be.revertedWith('EPool: insufficient liquidity');
      });
    });

    describe('#transferFees', function () {
      it('should collect the accrued fees', async function () {
        await this.controller.connect(this.signers.dao).setFeesOwner(this.accounts.feesOwner);
        const cumulativeFeeA = await this.ep.connect(this.signers.dao).cumulativeFeeA();
        const cumulativeFeeB = await this.ep.connect(this.signers.dao).cumulativeFeeB();
        await expect(
          this.ep.connect(this.signers.user).transferFees()
        ).to.emit(this.ep, 'TransferFees').withArgs(this.accounts.feesOwner, cumulativeFeeA, cumulativeFeeB);
        expect(await this.tokenA.connect(this.signers.feesOwner).balanceOf(this.accounts.feesOwner)).to.equal(cumulativeFeeA);
        expect(await this.tokenB.connect(this.signers.feesOwner).balanceOf(this.accounts.feesOwner)).to.equal(cumulativeFeeB);
        assert((await this.ep.connect(this.signers.dao).cumulativeFeeA()).eq(0));
        assert((await this.ep.connect(this.signers.dao).cumulativeFeeB()).eq(0));
      });
    });

    describe('#recover', function () {
      it('should recover excess funds', async function () {
        const amount = '1';
        await this.tokenA.connect(this.signers.admin).transfer(this.ep.address, parseUnits(amount, this.decA));
        await this.tokenB.connect(this.signers.admin).transfer(this.ep.address, parseUnits(amount, this.decB));
        await this.tokenX.connect(this.signers.admin).transfer(this.ep.address, parseUnits(amount, this.decX));
        const balanceOfADao = await this.tokenA.connect(this.signers.user).balanceOf(this.accounts.dao);
        const balanceOfAEPool = await this.tokenA.connect(this.signers.user).balanceOf(this.ep.address);
        const balanceOfBDao = await this.tokenB.connect(this.signers.user).balanceOf(this.accounts.dao);
        const balanceOfBEPool = await this.tokenB.connect(this.signers.user).balanceOf(this.ep.address);
        const balanceOfXDao = await this.tokenX.connect(this.signers.user).balanceOf(this.accounts.dao);
        const balanceOfXEPool = await this.tokenX.connect(this.signers.user).balanceOf(this.ep.address);
        await expect(
          this.ep.connect(this.signers.dao).recover(this.tokenA.address, parseUnits(amount, this.decA))
        ).to.emit(this.ep, 'RecoveredToken').withArgs(this.tokenA.address, parseUnits(amount, this.decA));
        await expect(
          this.ep.connect(this.signers.dao).recover(this.tokenB.address, parseUnits(amount, this.decB))
        ).to.emit(this.ep, 'RecoveredToken').withArgs(this.tokenB.address, parseUnits(amount, this.decB));
        await expect(
          this.ep.connect(this.signers.dao).recover(this.tokenX.address, parseUnits(amount, this.decX))
        ).to.emit(this.ep, 'RecoveredToken').withArgs(this.tokenX.address, parseUnits(amount, this.decX));
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        const _balanceOfADao = await this.tokenA.connect(this.signers.user).balanceOf(this.accounts.dao);
        const _balanceOfAEPool = await this.tokenA.connect(this.signers.user).balanceOf(this.ep.address);
        const _balanceOfBDao = await this.tokenB.connect(this.signers.user).balanceOf(this.accounts.dao);
        const _balanceOfBEPool = await this.tokenB.connect(this.signers.user).balanceOf(this.ep.address);
        const _balanceOfXDao = await this.tokenX.connect(this.signers.user).balanceOf(this.accounts.dao);
        const _balanceOfXEPool = await this.tokenX.connect(this.signers.user).balanceOf(this.ep.address);
        assert(_balanceOfADao.sub(balanceOfADao).eq(parseUnits(amount, this.decA)));
        assert(balanceOfAEPool.sub(_balanceOfAEPool).eq(parseUnits(amount, this.decA)));
        assert(_balanceOfAEPool.eq(tranche.reserveA));
        assert(_balanceOfBDao.sub(balanceOfBDao).eq(parseUnits(amount, this.decB)));
        assert(balanceOfBEPool.sub(_balanceOfBEPool).eq(parseUnits(amount, this.decB)));
        assert(_balanceOfBEPool.eq(tranche.reserveB));
        assert(_balanceOfXDao.sub(balanceOfXDao).eq(parseUnits(amount, this.decX)));
        assert(balanceOfXEPool.sub(_balanceOfXEPool).eq(parseUnits(amount, this.decX)));
      });
    });
  });
});
