import { waffle } from 'hardhat';
import { assert, expect } from 'chai';

import ControllerArtifact from '../artifacts/contracts/Controller.sol/Controller.json';
import KeeperSubsidyPoolArtifact from '../artifacts/contracts/KeeperSubsidyPool.sol/KeeperSubsidyPool.json';
import ETokenArtifact from '../artifacts/contracts/EToken.sol/EToken.json';

import { Controller, EToken, KeeperSubsidyPool } from '../typechain';
import { signersFixture } from './fixture';

const { deployContract } = waffle;

describe('KeeperSubsidyPool', function () {
  before(async function () {
    await signersFixture.bind(this)();
  });

  beforeEach(async function () {
    this.controller = (await deployContract(this.signers.admin, ControllerArtifact, [])) as Controller;
    await this.controller.connect(this.signers.admin).setDao(this.accounts.dao);
    await this.controller.connect(this.signers.dao).setGuardian(this.accounts.guardian);

    this.ksp = (await deployContract(this.signers.admin, KeeperSubsidyPoolArtifact, [
      this.controller.address
    ])) as KeeperSubsidyPool;
  });

  describe('#setController', function () {
    it('should update the address of the controller if msg.sender is the dao', async function () {
      this.controller2 = (await deployContract(this.signers.admin, ControllerArtifact, [])) as Controller;
      await expect(
        this.ksp.connect(this.signers.dao).setController(this.controller2.address)
      ).to.emit(this.ksp, 'SetController').withArgs(this.controller2.address);
      expect(await this.ksp.connect(this.signers.dao).getController()).to.equal(this.controller2.address);
      await this.ksp.connect(this.signers.admin).setController(this.controller.address);
    });

    it('should fail updating the address of the controller if msg.sender is not the dao', async function () {
      this.controller2 = (await deployContract(this.signers.admin, ControllerArtifact, [])) as Controller;
      await expect(
        this.ksp.connect(this.signers.guardian).setController(this.controller2.address)
      ).to.be.revertedWith('KeeperSubsidyPool: not dao');
    });
  });

  describe('#setBeneficiary', function () {
    it('should set a new beneficiary if msg.sender is dao', async function () {
      await expect(
        this.ksp.connect(this.signers.dao).setBeneficiary(this.accounts.user, true)
      ).to.emit(this.ksp, 'SetBeneficiary').withArgs(this.accounts.user, true);
      assert(await this.ksp.connect(this.signers.dao).isBeneficiary(this.accounts.user));
    });

    it('should set a new beneficiary if msg.sender is guardian', async function () {
      await this.ksp.connect(this.signers.guardian).setBeneficiary(this.accounts.user, true);
      assert(await this.ksp.connect(this.signers.dao).isBeneficiary(this.accounts.user));
    });

    it('should reset a new beneficiary if msg.sender is dao', async function () {
      await this.ksp.connect(this.signers.dao).setBeneficiary(this.accounts.user, true);
      await this.ksp.connect(this.signers.dao).setBeneficiary(this.accounts.user, false);
      assert(
        await this.ksp.connect(this.signers.dao).isBeneficiary(this.accounts.user) === false
      );
    });

    it('should not set a new beneficiary if msg.sender is not dao or guardian', async function () {
      await expect(
        this.ksp.connect(this.signers.user).setBeneficiary(this.accounts.user, true)
      ).to.revertedWith('KeeperSubsidyPool: not dao or guardian');
    });
  });

  describe('#isBeneficiary', function () {
    it('should return true for the address of the beneficiary', async function () {
      await this.ksp.connect(this.signers.dao).setBeneficiary(this.accounts.user, true);
      assert(await this.ksp.connect(this.signers.dao).isBeneficiary(this.accounts.user));
    });

    it('should return false for the address of the a random user', async function () {
      assert(
        await this.ksp.connect(this.signers.dao).isBeneficiary(await this.signers.user.getAddress()) === false
      );
    });
  });

  describe('#requestSubsidy', function () {
    beforeEach(async function () {
      this.eToken = (await deployContract(this.signers.admin, ETokenArtifact, [
        this.controller.address, 'ET', 'EToken', this.accounts.admin
      ])) as EToken;
    });

    it('should successfully request subsidy if msg.sender is beneficiary and if funds are available', async function () {
      await this.eToken.connect(this.signers.admin).mint(this.ksp.address, 1);
      await this.ksp.connect(this.signers.dao).setBeneficiary(this.accounts.user, true);
      await this.ksp.connect(this.signers.user).requestSubsidy(this.eToken.address, 1);
    });

    it('should fail requesting subsidy if msg.sender is beneficiary and if no funds are available', async function () {
      await this.ksp.connect(this.signers.dao).setBeneficiary(this.accounts.user, true);
      await expect(
        this.ksp.connect(this.signers.user).requestSubsidy(this.eToken.address, 1)
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });

    it('should fail requesting subsidy if msg.sender is not beneficiary and if funds are available', async function () {
      await this.eToken.connect(this.signers.admin).mint(this.ksp.address, 1);
      await expect(
        this.ksp.connect(this.signers.user).requestSubsidy(this.eToken.address, 1)
      ).to.be.revertedWith('KeeperSubsidyPool: not beneficiary');
    });

    it('should fail requesting subsidy if msg.sender is not beneficiary and if no funds are available', async function () {
      await expect(
        this.ksp.connect(this.signers.user).requestSubsidy(this.eToken.address, 1)
        ).to.be.revertedWith('KeeperSubsidyPool: not beneficiary');
    });
  });
});
