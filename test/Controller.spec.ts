import { waffle } from 'hardhat';
import { assert, expect } from 'chai';

import ControllerArtifact from '../artifacts/contracts/Controller.sol/Controller.json';
import { Controller } from '../typechain';
import { signersFixture } from './fixture';

const { deployContract } = waffle;

describe('Controller', function () {
  before(async function () {
    await signersFixture.bind(this)();
  });

  beforeEach(async function () {
    this.controller = (await deployContract(this.signers.admin, ControllerArtifact, [])) as Controller;
    await this.controller.connect(this.signers.admin).setDao(this.accounts.dao);
    await this.controller.connect(this.signers.dao).setGuardian(this.accounts.guardian);
  });

  describe('#isDaoOrGuardian', function () {
    it('should return true for the address dao', async function () {
      assert(await this.controller.connect(this.signers.dao).isDaoOrGuardian(this.accounts.dao));
    });

    it('should return true for the address guardian', async function () {
      assert(await this.controller.connect(this.signers.guardian).isDaoOrGuardian(this.accounts.guardian));
    });

    it('should return false if address if not dao or guardian', async function () {
      assert(await this.controller.connect(this.signers.guardian).isDaoOrGuardian(this.accounts.user) === false);
    });
  });

  describe('#setDao', function () {
    it('should set a new dao', async function () {
      await expect(
        this.controller.connect(this.signers.dao).setDao(this.accounts.admin)
      ).to.emit(this.controller, 'SetDao').withArgs(this.accounts.admin);
      expect(await this.controller.connect(this.signers.admin).dao()).to.equal(this.accounts.admin);
    });

    it('should not set a new dao if msg.sender is the guardian', async function () {
      await expect(
        this.controller.connect(this.signers.guardian).setDao(this.accounts.admin)
      ).to.be.revertedWith('Controller: not dao');
    });

    it('should not set a new dao if msg.sender is not DAO', async function () {
      await expect(
        this.controller.connect(this.signers.user).setDao(this.accounts.admin)
      ).to.be.revertedWith('Controller: not dao');
    });
  });

  describe('#setGuardian', function () {
    it('should set a new guardian', async function () {
      await expect(
        this.controller.connect(this.signers.dao).setGuardian(this.accounts.admin)
      ).to.emit(this.controller, 'SetGuardian').withArgs(this.accounts.admin);
      expect(await this.controller.connect(this.signers.admin).guardian()).to.equal(this.accounts.admin);
    });

    it('should not set a new guardian if msg.sender is the guardian', async function () {
      await expect(
        this.controller.connect(this.signers.guardian).setGuardian(this.accounts.admin)
      ).to.be.revertedWith('Controller: not dao');
    });

    it('should not set a new guardian if msg.sender is not DAO', async function () {
      await expect(
        this.controller.connect(this.signers.user).setGuardian(this.accounts.admin)
      ).to.be.revertedWith('Controller: not dao');
    });
  });

  describe('#setFeesOwner', function () {
    it('should set a new feesOwner', async function () {
      await expect(
        this.controller.connect(this.signers.dao).setFeesOwner(this.accounts.feesOwner)
      ).to.emit(this.controller, 'SetFeesOwner').withArgs(this.accounts.feesOwner);
      expect(await this.controller.connect(this.signers.feesOwner).feesOwner()).to.equal(this.accounts.feesOwner);
    });

    it('should not set a new feesOwner if msg.sender is the guardian', async function () {
      await expect(
        this.controller.connect(this.signers.guardian).setFeesOwner(this.accounts.feesOwner)
      ).to.be.revertedWith('Controller: not dao');
    });

    it('should not set a new feesOwner if msg.sender is not DAO', async function () {
      await expect(
        this.controller.connect(this.signers.user).setFeesOwner(this.accounts.feesOwner)
      ).to.be.revertedWith('Controller: not dao');
    });
  });

  describe('#setPausedIssuance', function () {
    it('should set a pausedIssuance if msg.sender is the dao', async function () {
      await expect(
        this.controller.connect(this.signers.dao).setPausedIssuance(true)
      ).to.emit(this.controller, 'SetPausedIssuance').withArgs(true);
      assert(await this.controller.connect(this.signers.dao).pausedIssuance());
    });

    it('should set pausedIssuance if msg.sender is the guardian', async function () {
      await this.controller.connect(this.signers.guardian).setPausedIssuance(true);
      assert(await this.controller.connect(this.signers.guardian).pausedIssuance());
    });

    it('should not set a pausedIssuance if msg.sender is not DAO or guardian', async function () {
      await expect(
        this.controller.connect(this.signers.user).setPausedIssuance(true)
      ).to.be.revertedWith('Controller: not dao or guardian');
    });
  });
});
