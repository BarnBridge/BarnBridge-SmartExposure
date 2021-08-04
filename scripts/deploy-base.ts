import { ethers } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

import { NETWORK_ENV } from '../network';

async function main(): Promise<void> {
  const {
    UniswapV2Factory, UniswapV2Router02,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
  } = NETWORK_ENV[(await ethers.provider.getNetwork()).name];

  const signer = (await ethers.getSigners())[0];
  const gasPrice = ethers.utils.parseUnits('1', 'gwei');

  // Controller
  const Controller: ContractFactory = await ethers.getContractFactory('Controller');
  // const controller: Contract = await Controller.attach('');
  const controller: Contract = await Controller.deploy({ gasPrice });
  await controller.deployed();
  console.log(`Controller:`);
  console.log(`  TxHash:           ${controller.deployTransaction.hash}`);
  console.log(`  Gas Used:         ${(await controller.deployTransaction.wait()).gasUsed.toString()} Gwei`);
  console.log(`  Address:          ${controller.address}`);

  // ETokenFactory
  const ETokenFactory: ContractFactory = await ethers.getContractFactory('ETokenFactory');
  // const eTokenFactory: Contract = await ETokenFactory.attach('');
  const eTokenFactory: Contract = await ETokenFactory.deploy(controller.address, { gasPrice });
  await eTokenFactory.deployed();
  console.log(`ETokenFactory:`);
  console.log(`  TxHash:           ${eTokenFactory.deployTransaction.hash}`);
  console.log(`  Gas Used:         ${(await eTokenFactory.deployTransaction.wait()).gasUsed.toString()} Gwei`);
  console.log(`  Address:          ${eTokenFactory.address}`);

  // EPoolHelper
  const EPoolHelper: ContractFactory = await ethers.getContractFactory('EPoolHelper');
  // const ePoolHelper: Contract = await EPoolHelper.attach('');
  const ePoolHelper: Contract = await EPoolHelper.deploy({ gasPrice });
  console.log(`EPoolHelper:`);
  console.log(`  TxHash:           ${ePoolHelper.deployTransaction.hash}`);
  console.log(`  Gas Used:         ${(await ePoolHelper.deployTransaction.wait()).gasUsed.toString()} Gwei`);
  console.log(`  Address:          ${ePoolHelper.address}`);

  // KeeperSubsidyPool
  const KeeperSubsidyPool: ContractFactory = await ethers.getContractFactory('KeeperSubsidyPool');
  // const keeperSubsidyPool: Contract = await KeeperSubsidyPool.attach('');
  const keeperSubsidyPool: Contract = await KeeperSubsidyPool.deploy(controller.address, { gasPrice });
  console.log(`KeeperSubsidyPool:`);
  console.log(`  TxHash:           ${keeperSubsidyPool.deployTransaction.hash}`);
  console.log(`  Gas Used:         ${(await keeperSubsidyPool.deployTransaction.wait()).gasUsed.toString()} Gwei`);
  console.log(`  Address:          ${keeperSubsidyPool.address}`);

  // EPoolPeriphery
  const EPoolPeriphery: ContractFactory = await ethers.getContractFactory('EPoolPeriphery');
  // const ePoolPeriphery: Contract = await EPoolPeriphery.attach('');
  const ePoolPeriphery: Contract = await EPoolPeriphery.deploy(
    controller.address,
    UniswapV2Factory,
    UniswapV2Router02,
    keeperSubsidyPool.address,
    '1030000000000000000', // 3% slippage
    { gasPrice }
  );
  await ePoolPeriphery.deployed();
  console.log(`EPoolPeriphery:`);
  console.log(`  TxHash:           ${ePoolPeriphery.deployTransaction.hash}`);
  console.log(`  Gas Used:         ${(await ePoolPeriphery.deployTransaction.wait()).gasUsed.toString()} Gwei`);
  console.log(`  Address:          ${ePoolPeriphery.address}`);

  /* --------------------------------------------------------------------------------------------------------------- */
  /* Set params                                                                                                      */
  /* --------------------------------------------------------------------------------------------------------------- */

  console.log(`KeeperSubsidyPool.setBeneficiary:`);
  const tx_grant = await keeperSubsidyPool.connect(signer).setBeneficiary(ePoolPeriphery.address, true, { gasPrice });
  console.log(`  TxHash:           ${tx_grant.hash}`);
  console.log(`  Gas Used:         ${(await tx_grant.wait()).gasUsed.toString()} Gwei`);

  // console.log(`KeeperSubsidyPool.addSubsidy:`);
  // const TokenA: ContractFactory = await ethers.getContractFactory('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20');
  // const tokenA: Contract = await TokenA.attach(WETH);
  // const tx_subsidy_1 = await tokenA.connect(signer).transfer(keeperSubsidyPool.address, '5000000000000000000', { gasPrice }); // 5 WETH
  // console.log(`  TxHash:           ${tx_subsidy_1.hash}`);
  // console.log(`  Gas Used:         ${(await tx_subsidy_1.wait()).gasUsed.toString()} Gwei`);

  // console.log(`KeeperSubsidyPool.addSubsidy:`);
  // const TokenB: ContractFactory = await ethers.getContractFactory('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20');
  // const tokenB: Contract = await TokenB.attach(USDC);
  // const tx_subsidy_2 = await tokenB.connect(signer).transfer(keeperSubsidyPool.address, '10000000000000000000000', { gasPrice }); // 10k DAI
  // console.log(`  TxHash:           ${tx_subsidy_2.hash}`);
  // console.log(`  Gas Used:         ${(await tx_subsidy_2.wait()).gasUsed.toString()} Gwei`);

  // console.log(`KeeperSubsidyPool.addSubsidy:`);
  // const TokenC: ContractFactory = await ethers.getContractFactory('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20');
  // const tokenC: Contract = await TokenC.attach(WBTC);
  // const tx_subsidy_3 = await tokenC.connect(signer).transfer(keeperSubsidyPool.address, '0.6', { gasPrice }); // 0.6 WBTC
  // console.log(`  TxHash:           ${tx_subsidy_3.hash}`);
  // console.log(`  Gas Used:         ${(await tx_subsidy_3.wait()).gasUsed.toString()} Gwei`);

  // console.log(`Controller.setGuardian:`);
  // const tx_guardian = await controller.connect(signer).setGuardian('', { gasPrice });
  // console.log(`  TxHash:           ${tx_guardian.hash}`);
  // console.log(`  Gas Used:         ${(await tx_guardian.wait()).gasUsed.toString()} Gwei`);

  // console.log(`Controller.setDao:`);
  // const tx_dao = await controller.connect(signer).setDao('', { gasPrice });
  // console.log(`  TxHash:           ${tx_dao.hash}`);
  // console.log(`  Gas Used:         ${(await tx_dao.wait()).gasUsed.toString()} Gwei`);

  // console.log(`EPoolPeriphery.setMaxFlashSwapSlippage:`);
  // const tx_slippage = await ePoolPeriphery.connect(signer).setMaxFlashSwapSlippage('20000000000000000', { gasPrice }); // 2%
  // console.log(`  TxHash:           ${tx_slippage.hash}`);
  // console.log(`  Gas Used:         ${(await tx_slippage.wait()).gasUsed.toString()} Gwei`);
}

main().then(() => process.exit(0)).catch((error: Error) => { console.error(error); process.exit(1); });
