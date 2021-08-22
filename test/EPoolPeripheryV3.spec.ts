import { ethers, waffle } from 'hardhat';
import { assert, expect } from 'chai';
import BigNumber from 'bignumber.js';

import ETokenArtifact from '../artifacts/contracts/EToken.sol/EToken.json';
import ControllerArtifact from '../artifacts/contracts/Controller.sol/Controller.json';
import { EToken, Controller } from '../typechain';

import { environmentFixture, signersFixture } from './fixture';

const { deployContract } = waffle;
const { utils: { formatUnits, parseUnits } } = ethers;


describe('EPoolPeriphery', function () {
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
        this.eppV3.connect(this.signers.dao).setController(this.controller2.address)
      ).to.emit(this.eppV3, 'SetController').withArgs(this.controller2.address);
      expect(await this.eppV3.connect(this.signers.dao).getController()).to.equal(this.controller2.address);
      await this.eppV3.connect(this.signers.admin).setController(this.controller.address);
    });

    it('should fail updating the address of the controller if msg.sender is not the dao', async function () {
      this.controller2 = (await deployContract(this.signers.admin, ControllerArtifact, [])) as Controller;
      await expect(
        this.eppV3.connect(this.signers.guardian).setController(this.controller2.address)
      ).to.be.revertedWith('EPoolPeriphery: not dao');
    });
  });

  describe('#setEPoolApproval', function () {
    it('should set the approval for an EPool to true if msg.sender is the dao', async function () {
      await expect(
        this.eppV3.connect(this.signers.dao).setEPoolApproval(this.ep.address, true)
      ).to.emit(this.eppV3, 'SetEPoolApproval').withArgs(this.ep.address, true);
      expect(await this.eppV3.connect(this.signers.dao).ePools(this.ep.address)).to.equal(true);
      assert((await this.tokenA.connect(this.signers.dao).allowance(this.eppV3.address, this.ep.address)).eq(ethers.constants.MaxUint256));
      assert((await this.tokenB.connect(this.signers.dao).allowance(this.eppV3.address, this.ep.address)).eq(ethers.constants.MaxUint256));
    });

    it('should set the approval for an EPool to true if msg.sender is the guardian', async function () {
      await this.eppV3.connect(this.signers.guardian).setEPoolApproval(this.ep.address, true);
      expect(await this.eppV3.connect(this.signers.guardian).ePools(this.ep.address)).to.equal(true);
      assert((await this.tokenA.connect(this.signers.guardian).allowance(this.eppV3.address, this.ep.address)).eq(ethers.constants.MaxUint256));
      assert((await this.tokenB.connect(this.signers.guardian).allowance(this.eppV3.address, this.ep.address)).eq(ethers.constants.MaxUint256));
    });

    it('should set the approval for an EPool to false', async function () {
      await this.eppV3.connect(this.signers.dao).setEPoolApproval(this.ep.address, false);
      expect(await this.eppV3.connect(this.signers.dao).ePools(this.ep.address)).to.equal(false);
      assert((await this.tokenA.connect(this.signers.dao).allowance(this.eppV3.address, this.ep.address)).eq(0));
      assert((await this.tokenB.connect(this.signers.dao).allowance(this.eppV3.address, this.ep.address)).eq(0));
    });

    it('should fail setting the approval for an EPool if msg.sender is not the dao or guardian', async function () {
      await expect(
        this.eppV3.connect(this.signers.user).setEPoolApproval(this.ep.address, true)
      ).to.be.revertedWith('EPoolPeriphery: not dao or guardian');
    });
  });

  describe('#setFeeTierPoolPair', function () {
    it('should set fee tier for pair if msg.sender is the dao', async function () {
      await expect(
        this.eppV3.connect(this.signers.dao).setFeeTierForPair(this.tokenA.address, this.tokenB.address, 500)
      ).to.emit(this.eppV3, 'SetFeeTierForPair').withArgs(this.tokenA.address, this.tokenB.address, 500);
      expect(await this.eppV3.connect(this.signers.dao).feeTierForPair(this.tokenA.address, this.tokenB.address)).to.equal(500);
    });

    it('should set fee tier for pair if msg.sender is the guardian', async function () {
      await this.eppV3.connect(this.signers.guardian).setFeeTierForPair(this.tokenA.address, this.tokenB.address, 3000);
      expect(await this.eppV3.connect(this.signers.guardian).feeTierForPair(this.tokenA.address, this.tokenB.address)).to.equal(3000);
    });

    it('should fail setting fee tier for pair if msg.sender is not the dao or guardian', async function () {
      await expect(
        this.eppV3.connect(this.signers.user).setFeeTierForPair(this.tokenA.address, this.tokenB.address, 3000)
      ).to.be.revertedWith('EPoolPeriphery: not dao or guardian');
    });
  });

  describe('integration', function () {
    before(async function () {
      await signersFixture.bind(this)();
      await environmentFixture.bind(this)();

      if (this.localRun) { this.skip(); }

      // approve TokenA and TokenB for EPoolPeriphery
      await Promise.all([
        this.tokenA.connect(this.signers.admin).approve(this.eppV3.address, this.sFactorA.mul(2)),
        this.tokenB.connect(this.signers.admin).approve(this.eppV3.address, this.sFactorB.mul(2)),
        this.tokenA.connect(this.signers.user).approve(this.eppV3.address, this.sFactorA.mul(5000)),
        this.tokenB.connect(this.signers.user).approve(this.eppV3.address, this.sFactorB.mul(5000))
      ]);

      if (this.localRun || this.forking) {
        // initial exchange rate
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(2400));
      }
      if (this.localRun) {
        // initial exchange rate
        await this.router.connect(this.signers.admin).setRate(this.sFactorI.mul(2400));
      }

      // 30/70 interpreted as 30/70 split --> 30% value in TokenA, 70% value in TokenB
      this.targetRatio = parseUnits(String(30/70), this.decI);
      this.amountA = this.sFactorA.mul(1);
      this.amountB = this.amountA
        .mul((await this.ep.connect(this.signers.admin).getRate())).div(this.sFactorI)
        .mul(this.sFactorB).div(this.sFactorA);
      // create tranche
      await this.ep.connect(this.signers.admin).addTranche(
        this.targetRatio, 'Barnbridge Exposure Token Wrapped-Ether 30% / DAI 70%', 'bb_ET_WETH30/DAI70'
      );
      const eTokenAddr = await this.ep.connect(this.signers.admin).tranchesByIndex(0);
      assert(eTokenAddr !== ethers.constants.AddressZero);
      this.eToken = new ethers.Contract(eTokenAddr, ETokenArtifact.abi) as EToken;

      await this.controller.connect(this.signers.admin).setDao(this.accounts.dao);
      await this.controller.connect(this.signers.dao).setGuardian(this.accounts.guardian);

      this.deadline = (await ethers.provider.getBlock('latest')).timestamp + 600;
    });

    describe('#tokenBForTokenA', function () {
      it('should return the correct amountB for amountA', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        const rate = (await this.ep.connect(this.signers.user).getRate());
        const ratio = await this.eph.connect(this.signers.user).currentRatio(this.ep.address, tranche.eToken);
        // amountB = amountA * rate / ratio ~= 116
        const amountB = this.amountA
          .mul(rate).div(this.sFactorI)
          .mul(this.sFactorI).div(ratio)
          .mul(this.sFactorB).div(this.sFactorA);
        const _amountB = await this.eph.connect(this.signers.user).tokenBForTokenA(this.ep.address, tranche.eToken, this.amountA);
        assert(amountB.gt(0) && this.roundEqual(amountB, _amountB));
      });
    });

    describe('#tokenAForTokenB', function () {
      it('should return the correct amountA for amountB', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        const rate = (await this.ep.connect(this.signers.user).getRate());
        const ratio = await this.eph.connect(this.signers.user).currentRatio(this.ep.address, tranche.eToken);
        const amountB = this.amountA
          .mul(rate).div(this.sFactorI)
          .mul(this.sFactorI).div(ratio)
          .mul(this.sFactorB).div(this.sFactorA);
        // amountA = amountB / rate * ratio ~= 116
        const amountA = amountB
          .mul(this.sFactorI).div(rate)
          .mul(ratio).div(this.sFactorI)
          .mul(this.sFactorA).div(this.sFactorB);
        const _amountA = await this.eph.connect(this.signers.user).tokenAForTokenB(this.ep.address, tranche.eToken, amountB);
        assert(amountA.gt(0) && this.roundEqual(amountA, _amountA));
      });
    });

    describe('#tokenATokenBForTokenA', function () {
      it('should yield the correct amount of TokenA', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        const rate = (await this.ep.connect(this.signers.user).getRate());
        const amountB = await this.eph.connect(this.signers.user).tokenBForTokenA(this.ep.address, tranche.eToken, this.amountA);
        // totalA = amountA + amountB / rate
        const totalA = this.amountA.add(
          amountB
            .mul(this.sFactorI).div(rate)
            .mul(this.sFactorA).div(this.sFactorB)
        );
        const [_amountA, _amountB] = await this.eph.connect(this.signers.user).tokenATokenBForTokenA(
          this.ep.address, tranche.eToken, totalA
        );
        assert(this.roundEqual(this.amountA, _amountA));
        assert(this.roundEqual(amountB, _amountB));
      });
    });

    describe('#eTokenForTokenATokenB - initial deposit', function () {
      it('should yield the correct amount of eToken for an initial deposit', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        const rate = (await this.ep.connect(this.signers.user).getRate());
        const amountB = await this.eph.connect(this.signers.user).tokenBForTokenA(this.ep.address, tranche.eToken, this.amountA);
        // sqrt(amountA * amountB)
        const totalA = this.amountA.add(
          amountB
            .mul(this.sFactorI).div(rate)
            .mul(this.sFactorA).div(this.sFactorB)
        );
        const eTokenAmount = parseUnits((new BigNumber(formatUnits(totalA, this.decE))).sqrt().toFixed(this.decE), this.decE);
        const _eTokenAmount = await this.eph.connect(this.signers.user).eTokenForTokenATokenB(
          this.ep.address, tranche.eToken, this.amountA, amountB
        );
        assert(this.roundEqual(eTokenAmount, _eTokenAmount));
      });
    });

    describe('#tokenATokenBForEToken', function () {
      it('should yield the correct amount of TokenA', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        const amountB = await this.eph.connect(this.signers.user).tokenBForTokenA(this.ep.address, tranche.eToken, this.amountA);
        const eTokenAmount = await this.eph.connect(this.signers.user).eTokenForTokenATokenB(
          this.ep.address, tranche.eToken, this.amountA, amountB
        );
        const [_amountA, _amountB] = await this.eph.connect(this.signers.user).tokenATokenBForEToken(
          this.ep.address, tranche.eToken, eTokenAmount
        );
        assert(this.roundEqual(this.amountA, _amountA));
        assert(this.roundEqual(amountB, _amountB));
      });
    });

    describe('#issueForMaxTokenA', function () {
      it('should fail depositting into unapproved EPool', async function () {
        await expect(
          this.eppV3.connect(this.signers.user).issueForMaxTokenA(this.eppV3.address, ethers.constants.AddressZero, 0, 0, this.deadline)
        ).to.be.revertedWith('EPoolPeriphery: unapproved EPool');
      });

      it('should fail depositting into tranche for insufficient max. input', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        const [amountA, amountB] = await this.eph.connect(this.signers.user).tokenATokenBForTokenA(this.ep.address, tranche.eToken, this.amountA);
        const eTokenAmountIssued = await this.eph.connect(this.signers.user).eTokenForTokenATokenB(this.ep.address, tranche.eToken, amountA, amountB);
        if (!this.localRun) {
          const minAmountA = await this.eppV3.connect(this.signers.user).callStatic.minInputAmountAForEToken(this.ep.address, tranche.eToken, eTokenAmountIssued);
          await this.eppV3.connect(this.signers.user).eTokenForMinInputAmountA_Unsafe(this.ep.address, tranche.eToken, minAmountA);
          await expect(
            this.eppV3.connect(this.signers.user).issueForMaxTokenA(
              this.ep.address, tranche.eToken, eTokenAmountIssued, minAmountA.sub(1), this.deadline
            )
          ).to.be.revertedWith('STF');
        } else {
          await expect(
            this.eppV3.connect(this.signers.user).issueForMaxTokenA(
              this.ep.address, tranche.eToken, eTokenAmountIssued, 0, this.deadline
            )
          ).to.be.revertedWith('EPoolPeriphery: insufficient max. input');
        }
      });

      it('should deposit into tranche', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        const [amountA, amountB] = await this.eph.connect(this.signers.user).tokenATokenBForTokenA(this.ep.address, tranche.eToken, this.amountA);
        const eTokenAmountIssued = await this.eph.connect(this.signers.user).eTokenForTokenATokenB(this.ep.address, tranche.eToken, amountA, amountB);
        if (!this.localRun) {
          const minAmountA = await this.eppV3.connect(this.signers.user).callStatic.minInputAmountAForEToken(this.ep.address, tranche.eToken, eTokenAmountIssued);
          await this.eppV3.connect(this.signers.user).issueForMaxTokenA(
            this.ep.address, tranche.eToken, eTokenAmountIssued, minAmountA, this.deadline
          );
        } else {
          await this.eppV3.connect(this.signers.user).issueForMaxTokenA(
            this.ep.address, tranche.eToken, eTokenAmountIssued, this.amountA, this.deadline
          );
        }
        const totalSupply = await this.eToken.connect(this.signers.user).totalSupply();
        const balanceOf = await this.eToken.connect(this.signers.user).balanceOf(await this.signers.user.getAddress());
        assert(this.roundEqual(balanceOf, eTokenAmountIssued) && this.roundEqual(totalSupply, balanceOf));
        const [_amountA, _amountB] = await this.eph.connect(this.signers.user).tokenATokenBForEToken(
          this.ep.address, tranche.eToken, balanceOf
        );
        const eTokenAmount = await this.eph.connect(this.signers.user).eTokenForTokenATokenB(
          this.ep.address, tranche.eToken, _amountA, _amountB
        );
        assert(this.roundEqual(balanceOf, eTokenAmount));
      });
    });

    describe('#eTokenForTokenATokenB - subsequent deposit', function () {
      it('should yield the correct amount of eToken for a subsequent deposit', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        const rate = (await this.ep.connect(this.signers.user).getRate());
        const amountB = await this.eph.connect(this.signers.user).tokenBForTokenA(this.ep.address, tranche.eToken, this.amountA);
        const totalA = this.amountA.add(
          amountB
            .mul(this.sFactorI).div(rate)
            .mul(this.sFactorA).div(this.sFactorB)
        );
        // fraction to reserves * eTokenTotalSupply
        const reservesInTokenA = tranche.reserveA.add(tranche.reserveB.mul(this.sFactorI).div(rate).mul(this.sFactorA).div(this.sFactorB));
        const fracDepositedInTokenA = totalA.mul(this.sFactorA).div(reservesInTokenA);
        const eTokenTotalSupply = await this.eToken.connect(this.signers.user).totalSupply();
        const eTokenAmount = fracDepositedInTokenA.mul(eTokenTotalSupply).div(this.sFactorA);
        const _eTokenAmount = await this.eph.connect(this.signers.user).eTokenForTokenATokenB(
          this.ep.address, tranche.eToken, this.amountA, amountB
        );
        assert(this.roundEqual(eTokenAmount, _eTokenAmount));
      });
    });

    describe('#rebalanceWithFlashSwap', function () {
      it('should fail rebalancing an unapproved EPool', async function () {
        await expect(
          this.eppV3.connect(this.signers.user).rebalanceWithFlashSwap(this.eppV3.address, 0)
        ).to.be.revertedWith('EPoolPeriphery: unapproved EPool');
      });

      it('should fail rebalancing the EPool via flash swap - excessive slippage', async function () {
        if (!this.forking) { this.skip(); }
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(2600));
        const currentRatioUnbalanced = await this.eph.connect(this.signers.user).currentRatio(this.ep.address, tranche.eToken);
        assert(!this.roundEqual(tranche.targetRatio, currentRatioUnbalanced));
        await expect(
          // -10% slippage
          this.eppV3.connect(this.signers.user).rebalanceWithFlashSwap(this.ep.address, ethers.utils.parseUnits('0.9', 18))
        ).to.be.revertedWith('EPoolPeriphery: excessive slippage');
      });

      it('should rebalance the EPool via flash swap - rChange == 0', async function () {
        if (!this.forking) { this.skip(); }
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(2600));
        const currentRatioUnbalanced = await this.eph.connect(this.signers.user).currentRatio(this.ep.address, tranche.eToken);
        assert(!this.roundEqual(tranche.targetRatio, currentRatioUnbalanced));
        // 10% slippage
        await this.eppV3.connect(this.signers.user).rebalanceWithFlashSwap(this.ep.address, ethers.utils.parseUnits('1.1', 18));
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

      it('should rebalance the EPool via flash swap - rChange > 0', async function () {
        if (!this.forking) { this.skip(); }
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(2300));
        const currentRatioUnbalanced = await this.eph.connect(this.signers.user).currentRatio(this.ep.address, tranche.eToken);
        assert(!this.roundEqual(tranche.targetRatio, currentRatioUnbalanced));
        // 10% slippage
        await this.eppV3.connect(this.signers.user).rebalanceWithFlashSwap(this.ep.address, ethers.utils.parseUnits('1.1', 18));
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
    });

    describe('#redeemForMinTokenA', function () {
      it('should fail withdrawing from an unapproved EPool', async function () {
        await expect(
          this.eppV3.connect(this.signers.user).redeemForMinTokenA(this.eppV3.address, ethers.constants.AddressZero, 0, 0, this.deadline)
        ).to.be.revertedWith('EPoolPeriphery: unapproved EPool');
      });

      it('should fail withdrawing from tranche if output amount is not met', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        const balanceOf = await this.eToken.connect(this.signers.user).balanceOf(await this.signers.user.getAddress());
        await this.eToken.connect(this.signers.user).approve(this.eppV3.address, balanceOf);
        if (!this.localRun) {
          const minOutputA = await this.eppV3.connect(this.signers.user).callStatic.maxOutputAmountAForEToken(this.ep.address, tranche.eToken, balanceOf);
          await expect(
            this.eppV3.connect(this.signers.user).redeemForMinTokenA(
              this.ep.address, tranche.eToken, balanceOf, minOutputA.add(1), this.deadline
            )
          ).to.be.revertedWith('EPoolPeriphery: insufficient output amount');
        } else {
          await expect(
            this.eppV3.connect(this.signers.user).redeemForMinTokenA(
              this.ep.address, tranche.eToken, balanceOf, ethers.constants.MaxUint256, this.deadline
            )
          ).to.be.revertedWith('EPoolPeriphery: insufficient output amount');
        }
      });

      it('should withdraw from tranche', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        const balanceOf = await this.eToken.connect(this.signers.user).balanceOf(await this.signers.user.getAddress());
        await this.eToken.connect(this.signers.user).approve(this.eppV3.address, balanceOf );
        if (!this.localRun) {
          const minOutputA = await this.eppV3.connect(this.signers.user).callStatic.maxOutputAmountAForEToken(this.ep.address, tranche.eToken, balanceOf);
          await this.eppV3.connect(this.signers.user).redeemForMinTokenA(
            this.ep.address, tranche.eToken, balanceOf, minOutputA, this.deadline
          );
        } else {
          // ideal: no fees, no price impact
          const minOutputA = this.amountA.sub(1).mul(this.sFactorB).div(this.sFactorA).mul(this.sFactorA).div(this.sFactorB);
          await this.eppV3.connect(this.signers.user).redeemForMinTokenA(
            this.ep.address, tranche.eToken, balanceOf, minOutputA, this.deadline
          );
        }
        const totalSupply = await this.eToken.connect(this.signers.user).totalSupply();
        const _balanceOf = await this.eToken.connect(this.signers.user).balanceOf(await this.signers.user.getAddress());
        assert(totalSupply.eq(0) && this.roundEqual(totalSupply, _balanceOf));
        const [_amountA, _amountB] = await this.eph.connect(this.signers.user).tokenATokenBForEToken(
          this.ep.address, tranche.eToken, _balanceOf
        );
        const eTokenAmount = await this.eph.connect(this.signers.user).eTokenForTokenATokenB(
          this.ep.address, tranche.eToken, _amountA, _amountB
        );
        assert(this.roundEqual(_balanceOf, eTokenAmount));
      });
    });

    describe('#tokenATokenBForTokenB', function () {
      it('should yield the correct amount of TokenB', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        const rate = (await this.ep.connect(this.signers.user).getRate());
        const amountA = await this.eph.connect(this.signers.user).tokenAForTokenB(this.ep.address, tranche.eToken, this.amountB);
        // totalB = amountB + amountA * rate
        const totalB = this.amountB.add(
          amountA
            .mul(rate).div(this.sFactorI)
            .mul(this.sFactorB).div(this.sFactorA)
        );
        const [_amountA, _amountB] = await this.eph.connect(this.signers.user).tokenATokenBForTokenB(
          this.ep.address, tranche.eToken, totalB
        );
        assert(this.roundEqual(this.amountB, _amountB));
        assert(this.roundEqual(amountA, _amountA));
      });
    });

    describe('issueForMaxTokenB', function () {
      it('should deposit into tranche', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        const [amountA, amountB] = await this.eph.connect(this.signers.user).tokenATokenBForTokenB(this.ep.address, tranche.eToken, this.amountB);
        const eTokenAmountIssued = await this.eph.connect(this.signers.user).eTokenForTokenATokenB(this.ep.address, tranche.eToken, amountA, amountB);
        const balanceOf = await this.eToken.connect(this.signers.user).balanceOf(await this.signers.user.getAddress());
        if (!this.localRun) {
          const minAmountB = await this.eppV3.connect(this.signers.user).callStatic.minInputAmountBForEToken(this.ep.address, tranche.eToken, eTokenAmountIssued);
          await this.eppV3.connect(this.signers.user).eTokenForMinInputAmountB_Unsafe(this.ep.address, tranche.eToken, minAmountB);
          await this.eppV3.connect(this.signers.user).issueForMaxTokenB(
            this.ep.address, tranche.eToken, eTokenAmountIssued, minAmountB, this.deadline
          );
        } else {
          await this.eppV3.connect(this.signers.user).eTokenForMinInputAmountB_Unsafe(this.ep.address, tranche.eToken, this.amountB);
          await this.eppV3.connect(this.signers.user).issueForMaxTokenB(
            this.ep.address, tranche.eToken, eTokenAmountIssued, this.amountB, this.deadline
          );
        }
        const _balanceOf = await this.eToken.connect(this.signers.user).balanceOf(await this.signers.user.getAddress());
        assert(this.roundEqual(_balanceOf.sub(balanceOf), eTokenAmountIssued));
        const [_amountA, _amountB] = await this.eph.connect(this.signers.user).tokenATokenBForEToken(
          this.ep.address, tranche.eToken, _balanceOf.sub(balanceOf)
        );
        const eTokenAmount = await this.eph.connect(this.signers.user).eTokenForTokenATokenB(
          this.ep.address, tranche.eToken, _amountA, _amountB
        );
        assert(this.roundEqual(_balanceOf.sub(balanceOf), eTokenAmount));
      });
    });

    describe('#redeemForMinTokenB', function () {
      it('should withdraw from tranche', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        const balanceOf = await this.eToken.connect(this.signers.user).balanceOf(await this.signers.user.getAddress());
        await this.eToken.connect(this.signers.user).approve(this.eppV3.address, balanceOf);
        if (!this.localRun) {
          const minOutputB = await this.eppV3.connect(this.signers.user).callStatic.maxOutputAmountBForEToken(this.ep.address, tranche.eToken, balanceOf);
          await this.eppV3.connect(this.signers.user).redeemForMinTokenB(
            this.ep.address, tranche.eToken, balanceOf, minOutputB, this.deadline
          );
        } else {
          // ideal: no fees, no price impact
          const minOutputB = this.amountB.sub(100); // compensate for rounding error
          await this.eppV3.connect(this.signers.user).redeemForMinTokenB(
            this.ep.address, tranche.eToken, balanceOf, minOutputB, this.deadline
          );
        }
        const totalSupply = await this.eToken.connect(this.signers.user).totalSupply();
        const _balanceOf = await this.eToken.connect(this.signers.user).balanceOf(await this.signers.user.getAddress());
        assert(totalSupply.eq(0) && this.roundEqual(totalSupply, _balanceOf));
        const [_amountA, _amountB] = await this.eph.connect(this.signers.user).tokenATokenBForEToken(
          this.ep.address, tranche.eToken, _balanceOf
        );
        const eTokenAmount = await this.eph.connect(this.signers.user).eTokenForTokenATokenB(
          this.ep.address, tranche.eToken, _amountA, _amountB
        );
        assert(this.roundEqual(_balanceOf, eTokenAmount));
      });
    });

    describe('#recover', function () {
      it('should recover excess funds', async function () {
        const amount = '1';
        await this.tokenX.connect(this.signers.admin).transfer(this.eppV3.address, parseUnits(amount, this.decX));
        const balanceOfXDao = await this.tokenX.connect(this.signers.user).balanceOf(this.accounts.dao);
        const balanceOfXEPoolPeriphery = await this.tokenX.connect(this.signers.user).balanceOf(this.eppV3.address);
        await expect(
          this.eppV3.connect(this.signers.dao).recover(this.tokenX.address, parseUnits(amount, this.decX))
        ).to.emit(this.eppV3, 'RecoveredToken').withArgs(this.tokenX.address, parseUnits(amount, this.decX));
        const _balanceOfXDao = await this.tokenX.connect(this.signers.user).balanceOf(this.accounts.dao);
        const _balanceOfXEPoolPeriphery = await this.tokenX.connect(this.signers.user).balanceOf(this.ep.address);
        assert(_balanceOfXDao.sub(balanceOfXDao).eq(parseUnits(amount, this.decX)));
        assert(balanceOfXEPoolPeriphery.sub(_balanceOfXEPoolPeriphery).eq(parseUnits(amount, this.decX)));
      });
    });
  });
});
