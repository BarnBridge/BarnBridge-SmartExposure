import { ethers, waffle } from 'hardhat';
import { assert, expect } from 'chai';

import ControllerArtifact from '../artifacts/contracts/Controller.sol/Controller.json';
import ETokenArtifact from '../artifacts/contracts/EToken.sol/EToken.json';
import ETokenFactoryArtifact from '../artifacts/contracts/ETokenFactory.sol/ETokenFactory.json';

import { Controller, EToken, ETokenFactory } from '../typechain';

import { signersFixture } from './fixture';

const { deployContract } = waffle;

describe('ETokenFactory', function () {
  before(async function () {
    await signersFixture.bind(this)();
    this.controller = (await deployContract(this.signers.admin, ControllerArtifact, [])) as Controller;
    await this.controller.connect(this.signers.admin).setDao(this.accounts.dao);
    await this.controller.connect(this.signers.dao).setGuardian(this.accounts.guardian);
  });

  beforeEach(async function () {
    this.eTokenFactory = (await deployContract(this.signers.admin, ETokenFactoryArtifact, [
      this.controller.address
    ])) as ETokenFactory;
  });

  describe('#setController', function () {
    it('should update the address of the controller if msg.sender is the dao', async function () {
      this.controller2 = (await deployContract(this.signers.admin, ControllerArtifact, [])) as Controller;
      await expect(
        this.eTokenFactory.connect(this.signers.dao).setController(this.controller2.address)
      ).to.emit(this.eTokenFactory, 'SetController').withArgs(this.controller2.address);
      expect(await this.eTokenFactory.connect(this.signers.dao).getController()).to.equal(this.controller2.address);
      await this.eTokenFactory.connect(this.signers.admin).setController(this.controller.address);
    });

    it('should fail updating the address of the controller if msg.sender is not the dao', async function () {
      this.controller2 = (await deployContract(this.signers.admin, ControllerArtifact, [])) as Controller;
      await expect(
        this.eTokenFactory.connect(this.signers.guardian).setController(this.controller2.address)
      ).to.be.revertedWith('ETokenFactory: not dao');
    });
  });

  describe('#createEToken', function () {
    it('should create a new EToken', async function () {
      const tx = await (await this.eTokenFactory.connect(this.signers.owner).createEToken('EToken', 'ET')).wait();
      const event = tx.events?.find(({ event }) => event === 'CreatedEToken');
      assert(event && event.args?.eToken);
      const eToken = await ethers.getContractAt(ETokenArtifact.abi, event?.args?.eToken) as EToken;
      expect(await eToken.connect(this.signers.owner).ePool()).to.equal(this.accounts.owner);
      expect(await eToken.connect(this.signers.owner).name()).to.equal('EToken');
      expect(await eToken.connect(this.signers.owner).symbol()).to.equal('ET');
    });
  });
});
