import { ethers, waffle } from 'hardhat';
import { assert, expect } from 'chai';

import KeeperNetworkAdapterArtifact from '../artifacts/contracts/KeeperNetworkAdapter.sol/KeeperNetworkAdapter.json';
import ControllerArtifact from '../artifacts/contracts/Controller.sol/Controller.json';
import ETokenArtifact from '../artifacts/contracts/EToken.sol/EToken.json';

import { KeeperNetworkAdapter, Controller, EToken } from '../typechain';
import { environmentFixture, signersFixture } from './fixture';

const { deployContract } = waffle;
const { utils: { parseUnits } } = ethers;


describe('KeeperNetworkAdapter', function () {
  before(async function () {
    await signersFixture.bind(this)();

    this.fundKsp = async function () {
      // fund keeper subsidy pool
      if (this.localRun) {
        await this.tokenA.connect(this.signers.admin).mint(this.ksp.address, this.sFactorA.mul(2));
        await this.tokenB.connect(this.signers.admin).mint(this.ksp.address, this.sFactorB.mul(2));
      } else {
        await this.tokenA.connect(this.signers.admin).transfer(this.ksp.address, this.sFactorA.mul(2));
        await this.tokenB.connect(this.signers.admin).transfer(this.ksp.address, this.sFactorB.mul(2));
      }
    };
  });

  beforeEach(async function () {
    this.controller = (await deployContract(this.signers.admin, ControllerArtifact, [])) as Controller;
    await this.controller.connect(this.signers.admin).setDao(this.accounts.dao);
    await this.controller.connect(this.signers.dao).setGuardian(this.accounts.guardian);

    // deploy keeper network adapter
    this.kna = (await deployContract(this.signers.admin, KeeperNetworkAdapterArtifact, [
      this.controller.address, ethers.constants.AddressZero, ethers.constants.AddressZero, ethers.constants.AddressZero
    ])) as KeeperNetworkAdapter;
  });

  describe('#setController', function () {
    it('should update the address of the controller if msg.sender is the dao', async function () {
      this.controller2 = (await deployContract(this.signers.admin, ControllerArtifact, [])) as Controller;
      await expect(
        this.kna.connect(this.signers.dao).setController(this.controller2.address)
      ).to.emit(this.kna, 'SetController').withArgs(this.controller2.address);
      expect(await this.kna.connect(this.signers.dao).getController()).to.equal(this.controller2.address);
      await this.kna.connect(this.signers.admin).setController(this.controller.address);
    });

    it('should fail updating the address of the controller if msg.sender is not the dao', async function () {
      this.controller2 = (await deployContract(this.signers.admin, ControllerArtifact, [])) as Controller;
      await expect(
        this.kna.connect(this.signers.guardian).setController(this.controller2.address)
      ).to.be.revertedWith('KeeperNetworkAdapter: not dao');
    });
  });

  describe('#setEPool', function () {
    it('should update EPool if msg.sender is dao', async function () {
      await expect(
        this.kna.connect(this.signers.dao).setEPool('0x0000000000000000000000000000000000000001')
      ).to.emit(this.kna, 'SetEPool').withArgs('0x0000000000000000000000000000000000000001');
      expect(await this.kna.connect(this.signers.dao).ePool()).to.equal('0x0000000000000000000000000000000000000001');
    });

    it('should update EPool if msg.sender is guardian', async function () {
      await this.kna.connect(this.signers.guardian).setEPool('0x0000000000000000000000000000000000000001');
      expect(await this.kna.connect(this.signers.guardian).ePool()).to.equal('0x0000000000000000000000000000000000000001');
    });

    it('should fail updating EPool if msg.sender is not dao or guardian', async function () {
      await expect(
        this.kna.connect(this.signers.user).setEPool('0x0000000000000000000000000000000000000001')
      ).to.be.revertedWith('KeeperNetworkAdapter: not dao or guardian');
    });
  });

  describe('#setEPoolHelper', function () {
    it('should update EPoolHelper if msg.sender is dao', async function () {
      await expect(
        this.kna.connect(this.signers.dao).setEPoolHelper('0x0000000000000000000000000000000000000001')
      ).to.emit(this.kna, 'SetEPoolHelper').withArgs('0x0000000000000000000000000000000000000001');
      expect(await this.kna.connect(this.signers.dao).ePoolHelper()).to.equal('0x0000000000000000000000000000000000000001');
    });

    it('should update EPoolHelper if msg.sender is guardian', async function () {
      await this.kna.connect(this.signers.guardian).setEPoolHelper('0x0000000000000000000000000000000000000001');
      expect(await this.kna.connect(this.signers.guardian).ePoolHelper()).to.equal('0x0000000000000000000000000000000000000001');
    });

    it('should fail updating EPoolHelper if msg.sender is not dao or guardian', async function () {
      await expect(
        this.kna.connect(this.signers.user).setEPoolHelper('0x0000000000000000000000000000000000000001')
      ).to.be.revertedWith('KeeperNetworkAdapter: not dao or guardian');
    });
  });

  describe('#setEPoolPeriphery', function () {
    it('should update EPoolPeriphery if msg.sender is dao', async function () {
      await expect(
        this.kna.connect(this.signers.dao).setEPoolPeriphery('0x0000000000000000000000000000000000000001')
      ).to.emit(this.kna, 'SetEPoolPeriphery').withArgs('0x0000000000000000000000000000000000000001');
      expect(await this.kna.connect(this.signers.dao).ePoolPeriphery()).to.equal('0x0000000000000000000000000000000000000001');
    });

    it('should update EPoolPeriphery if msg.sender is guardian', async function () {
      await this.kna.connect(this.signers.guardian).setEPoolPeriphery('0x0000000000000000000000000000000000000001');
      expect(await this.kna.connect(this.signers.guardian).ePoolPeriphery()).to.equal('0x0000000000000000000000000000000000000001');
    });

    it('should fail updating EPoolPeriphery if msg.sender is not dao or guardian', async function () {
      await expect(
        this.kna.connect(this.signers.user).setEPoolPeriphery('0x0000000000000000000000000000000000000001')
      ).to.be.revertedWith('KeeperNetworkAdapter: not dao or guardian');
    });
  });

  describe('#setKeeperRebalanceMinRDiv', function () {
    it('should update minRDiv if msg.sender is dao', async function () {
      await expect(
        this.kna.connect(this.signers.dao).setKeeperRebalanceMinRDiv(1)
      ).to.emit(this.kna, 'SetKeeperRebalanceMinRDiv').withArgs(1);
      expect(await this.kna.connect(this.signers.dao).keeperRebalanceMinRDiv()).to.equal(1);
    });

    it('should update minRDiv if msg.sender is guardian', async function () {
      await this.kna.connect(this.signers.guardian).setKeeperRebalanceMinRDiv(1);
      expect(await this.kna.connect(this.signers.guardian).keeperRebalanceMinRDiv()).to.equal(1);
    });

    it('should fail updating minRDiv if msg.sender is not dao or guardian', async function () {
      await expect(
        this.kna.connect(this.signers.user).setKeeperRebalanceMinRDiv(1)
      ).to.be.revertedWith('KeeperNetworkAdapter: not dao or guardian');
    });
  });


  describe('#setKeeperRebalanceInterval', function () {
    it('should update rebalance interval if msg.sender is dao', async function () {
      await expect(
        this.kna.connect(this.signers.dao).setKeeperRebalanceInterval(1)
      ).to.emit(this.kna, 'SetKeeperRebalanceInterval').withArgs(1);
      expect(await this.kna.connect(this.signers.dao).keeperRebalanceInterval()).to.equal(1);
    });

    it('should update rebalance interval if msg.sender is guardian', async function () {
      await this.kna.connect(this.signers.guardian).setKeeperRebalanceInterval(1);
      expect(await this.kna.connect(this.signers.guardian).keeperRebalanceInterval()).to.equal(1);
    });

    it('should fail updating rebalance interval if msg.sender is not dao or guardian', async function () {
      await expect(
        this.kna.connect(this.signers.user).setKeeperRebalanceInterval(1)
      ).to.be.revertedWith('KeeperNetworkAdapter: not dao or guardian');
    });
  });

  describe('#integration', function () {
    beforeEach(async function () {
      await environmentFixture.bind(this)();

      if (!this.forking) { this.skip(); }

      // approve TokenA and TokenB for EPoolPeriphery
      await this.tokenA.connect(this.signers.admin).approve(this.epp.address, this.sFactorA.mul(2));
      await this.tokenB.connect(this.signers.admin).approve(this.epp.address, this.sFactorB.mul(2));
      await this.tokenA.connect(this.signers.user).approve(this.epp.address, this.sFactorA.mul(5000));
      await this.tokenB.connect(this.signers.user).approve(this.epp.address, this.sFactorB.mul(5000));

      if (this.localRun || this.forking) {
        // initial exchange rate
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(1800));
      }
      if (this.localRun) {
        // initial exchange rate
        await this.router.connect(this.signers.admin).setRate(this.sFactorI.mul(1800));
      }

      // 30/70 interpreted as 30/70 split --> 30% value in TokenA, 70% value in TokenB
      this.targetRatio = parseUnits(String(30/70), this.decI);
      this.amountA = this.sFactorA.mul(1);
      // create tranche
      await this.ep.connect(this.signers.admin).addTranche(
        this.targetRatio, 'Barnbridge Exposure Token Wrapped-Ether 30% / DAI 70%', 'bb_ET_WETH30/DAI70',
      );
      const eTokenAddr = await this.ep.connect(this.signers.admin).tranchesByIndex(0);
      assert(eTokenAddr !== ethers.constants.AddressZero);
      this.eToken = new ethers.Contract(eTokenAddr, ETokenArtifact.abi) as EToken;

      // deposit into tranche
      const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
      const [amountA, amountB] = await this.eph.connect(this.signers.user).tokenATokenBForTokenA(this.ep.address, tranche.eToken, this.amountA);
      this.eTokenAmountIssued = await this.eph.connect(this.signers.user).eTokenForTokenATokenB(this.ep.address, tranche.eToken, amountA, amountB);
      if (!this.localRun) { this.eTokenAmountIssued = this.eTokenAmountIssued.div(10); } // compensate for rate deviation
      const deadline = (await ethers.provider.getBlock('latest')).timestamp + 600;
      await this.epp.connect(this.signers.user).issueForMaxTokenA(
        this.ep.address, tranche.eToken, this.eTokenAmountIssued, this.amountA, deadline
      );

      // set keeper network adapter
      // this.keeperRebalanceMinRDiv = parseUnits('0.00005', this.decA);
      this.keeperRebalanceMinRDiv = parseUnits('0.005', this.decA);
      await this.kna.connect(this.signers.dao).setKeeperRebalanceMinRDiv(this.keeperRebalanceMinRDiv);
      await this.kna.connect(this.signers.dao).setEPool(this.ep.address);
      await this.kna.connect(this.signers.dao).setEPoolHelper(this.eph.address);
      await this.kna.connect(this.signers.dao).setEPoolPeriphery(this.epp.address);
    });

    describe('#checkUpkeep', function () {
      it('should check upkeep - false (> minRDiv && > rebalanceInterval && not funded)', async function () {
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(1850));
        const currentRatioUnbalanced = await this.eph.connect(this.signers.user).currentRatio(this.ep.address, tranche.eToken);
        assert(!this.roundEqual(tranche.targetRatio, currentRatioUnbalanced));
        const [upkeepNeeded] = await this.kna.connect(this.signers.user).checkUpkeep(ethers.constants.HashZero);
        assert(upkeepNeeded === false);
      });

      it('should check upkeep - false (< minRDiv && > rebalanceInterval && funded)', async function () {
        await this.fundKsp();
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(1810));
        const currentRatioUnbalanced = await this.eph.connect(this.signers.user).currentRatio(this.ep.address, tranche.eToken);
        assert(!this.roundEqual(tranche.targetRatio, currentRatioUnbalanced));
        const [deltaA, deltaB, rChange, rDiv] = await this.eph.connect(this.signers.user).delta(this.ep.address);
        const [upkeepNeeded] = await this.kna.connect(this.signers.user).checkUpkeep(ethers.constants.HashZero);
        assert(rDiv.gte(this.keeperRebalanceMinRDiv) === upkeepNeeded && upkeepNeeded === false);
      });

      it('should check upkeep - false (> minRDiv && < rebalanceInterval && funded)', async function () {
        await this.fundKsp();
        await this.kna.connect(this.signers.dao).setKeeperRebalanceInterval(100);
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(1850));
        await this.kna.connect(this.signers.user).performUpkeep(ethers.constants.HashZero);
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(2000));
        const currentRatioUnbalanced = await this.eph.connect(this.signers.user).currentRatio(this.ep.address, tranche.eToken);
        assert(!this.roundEqual(tranche.targetRatio, currentRatioUnbalanced));
        const [deltaA, deltaB, rChange, rDiv] = await this.eph.connect(this.signers.user).delta(this.ep.address);
        const [upkeepNeeded] = await this.kna.connect(this.signers.user).checkUpkeep(ethers.constants.HashZero);
        assert(upkeepNeeded === false && rDiv.gte(this.keeperRebalanceMinRDiv));
      });

      it('should check upkeep - true (> minRDiv && > rebalanceInterval && funded)', async function () {
        await this.fundKsp();
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(1850));
        const currentRatioUnbalanced = await this.eph.connect(this.signers.user).currentRatio(this.ep.address, tranche.eToken);
        assert(!this.roundEqual(tranche.targetRatio, currentRatioUnbalanced));
        const [deltaA, deltaB, rChange, rDiv] = await this.eph.connect(this.signers.user).delta(this.ep.address);
        const [upkeepNeeded] = await this.kna.connect(this.signers.user).checkUpkeep(ethers.constants.HashZero);
        assert(rDiv.gte(this.keeperRebalanceMinRDiv) === upkeepNeeded && upkeepNeeded === true);
      });
    });

    describe('#performUpKeep', function () {
      it('should perform upkeep', async function () {
        await this.fundKsp();
        const tranche = await this.ep.connect(this.signers.user).tranches(await this.ep.connect(this.signers.user).tranchesByIndex(0));
        await this.aggregator.connect(this.signers.admin).setAnswer(this.sFactorI.mul(1850));
        const currentRatioUnbalanced = await this.eph.connect(this.signers.user).currentRatio(this.ep.address, tranche.eToken);
        assert(!this.roundEqual(tranche.targetRatio, currentRatioUnbalanced));
        await this.kna.connect(this.signers.user).performUpkeep(ethers.constants.HashZero);
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
  });
});
