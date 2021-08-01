import { ethers, waffle } from 'hardhat';
import { assert, expect } from 'chai';

import ETokenArtifact from '../artifacts/contracts/EToken.sol/EToken.json';
import ControllerArtifact from '../artifacts/contracts/Controller.sol/Controller.json';
import { EToken, Controller } from '../typechain';
import { environmentFixture, signersFixture } from './fixture';

const { deployContract } = waffle;
const { utils: { parseUnits } } = ethers;

describe('EToken', function () {
  before(async function () {
    await signersFixture.bind(this)();
    await environmentFixture.bind(this)();
    await this.controller.connect(this.signers.admin).setDao(this.accounts.dao);
    await this.controller.connect(this.signers.dao).setGuardian(this.accounts.guardian);
  });

  beforeEach(async function () {
    this.eToken = (await deployContract(this.signers.admin, ETokenArtifact, [
      this.controller.address, 'EToken', 'ET', this.accounts.owner
    ])) as EToken;
  });

  describe('#setController', function () {
    it('should update the address of the controller if msg.sender is the dao', async function () {
      this.controller2 = (await deployContract(this.signers.admin, ControllerArtifact, [])) as Controller;
      await expect(
        this.eToken.connect(this.signers.dao).setController(this.controller2.address)
      ).to.emit(this.eToken, 'SetController').withArgs(this.controller2.address);
      expect(await this.eToken.connect(this.signers.dao).getController()).to.equal(this.controller2.address);
      await this.eToken.connect(this.signers.admin).setController(this.controller.address);
    });

    it('should fail updating the address of the controller if msg.sender is not the dao', async function () {
      this.controller2 = (await deployContract(this.signers.admin, ControllerArtifact, [])) as Controller;
      await expect(
        this.eToken.connect(this.signers.guardian).setController(this.controller2.address)
      ).to.be.revertedWith('EToken: not dao');
    });
  });

  describe('#mint', function () {
    it('should mint EToken', async function () {
      assert(await this.eToken.connect(this.signers.owner).mint(this.accounts.user, 1));
    });

    it('should not mint EToken if msg.sender is not the owner', async function () {
      await expect(
        this.eToken.connect(this.signers.user).mint(this.accounts.user, 1)
      ).to.be.revertedWith('EToken: not EPool');
    });
  });

  describe('#burn', function () {
    it('should burn EToken', async function () {
      await this.eToken.connect(this.signers.owner).mint(this.accounts.user, 1);
      assert(await this.eToken.connect(this.signers.owner).burn(this.accounts.user, 1));
    });

    it('should not burn EToken if msg.sender is not the owner', async function () {
      await this.eToken.connect(this.signers.owner).mint(this.accounts.user, 1);
      await expect(
        this.eToken.connect(this.signers.user).burn(this.accounts.user, 1)
      ).to.be.revertedWith('EToken: not EPool');
    });
  });

  describe('#recover', function () {
    it('should recover excess funds', async function () {
      const amount = '1';
      await this.tokenX.connect(this.signers.admin).transfer(this.eToken.address, parseUnits(amount, this.decX));
      const balanceOfXDao = await this.tokenX.connect(this.signers.user).balanceOf(this.accounts.dao);
      const balanceOfXEToken = await this.tokenX.connect(this.signers.user).balanceOf(this.eToken.address);
      await expect(
        this.eToken.connect(this.signers.dao).recover(this.tokenX.address, parseUnits(amount, this.decX))
      ).to.emit(this.eToken, 'RecoveredToken').withArgs(this.tokenX.address, parseUnits(amount, this.decX));
      const _balanceOfXDao = await this.tokenX.connect(this.signers.user).balanceOf(this.accounts.dao);
      const _balanceOfXEToken = await this.tokenX.connect(this.signers.user).balanceOf(this.eToken.address);
      assert(_balanceOfXDao.sub(balanceOfXDao).eq(parseUnits(amount, this.decX)));
      assert(balanceOfXEToken.sub(_balanceOfXEToken).eq(parseUnits(amount, this.decX)));
    });
  });
});
