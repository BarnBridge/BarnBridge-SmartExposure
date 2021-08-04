import { ethers } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';
import { NETWORK_ENV } from '../network';

async function main(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const { AggregatorV3Proxy_USDC_WETH, WETH, USDC } = NETWORK_ENV[(await ethers.provider.getNetwork()).name];
  const signer = (await ethers.getSigners())[0];
  const gasPrice = ethers.utils.parseUnits('1', 'gwei');

  // Controller
  const Controller: ContractFactory = await ethers.getContractFactory('Controller');
  const controller: Contract = await Controller.attach('0xCbCc0dA1c8fC31C45Aa84931338178ada74F1017');

  // ETokenFactory
  const ETokenFactory: ContractFactory = await ethers.getContractFactory('ETokenFactory');
  const eTokenFactory: Contract = await ETokenFactory.attach('0x4018b283aeC2D2287D9578bAB434d35235ec8E8B');

  // // EPoolHelper
  // const EPoolHelper: ContractFactory = await ethers.getContractFactory('EPoolHelper');
  // const ePoolHelper: Contract = await EPoolHelper.attach('0x32f8E7FB11432263E545faA368a6a1f8eFB58314');

  // EPoolPeriphery
  const EPoolPeriphery: ContractFactory = await ethers.getContractFactory('EPoolPeriphery');
  const ePoolPeriphery: Contract = await EPoolPeriphery.attach('0xb9556a673f2e01333570e68d95dDd17d92A0511A');

  /* --------------------------------------------------------------------------------------------------------------- */
  /* EPool - WETH / USDC                                                                                             */
  /* --------------------------------------------------------------------------------------------------------------- */

  // EPool
  const EPool: ContractFactory = await ethers.getContractFactory('EPool');
  // const ePool: Contract = await EPool.attach('');
  const ePool: Contract = await EPool.deploy(
    controller.address, eTokenFactory.address, WETH, USDC, AggregatorV3Proxy_USDC_WETH, true, { gasPrice }
  );
  console.log(`EPool:`);
  console.log(`  TxHash:           ${ePool.deployTransaction.hash}`);
  console.log(`  Gas Used:         ${(await ePool.deployTransaction.wait()).gasUsed.toString()} Gwei`);
  console.log(`  Address:          ${ePool.address}`);

  console.log(`EPoolPeriphery.setEPoolApproval:`);
  const tx_approval = await ePoolPeriphery.connect(signer).setEPoolApproval(ePool.address, true, { gasPrice });
  console.log(`  TxHash:           ${tx_approval.hash}`);
  console.log(`  Gas Used:         ${(await tx_approval.wait()).gasUsed.toString()} Gwei`);

  console.log(`EPool.setFeeRate:`);
  const tx_fee = await ePool.connect(signer).setFeeRate(ethers.utils.parseUnits('0.005', 18), { gasPrice }); // 0.5%
  console.log(`  TxHash:           ${tx_fee.hash}`);
  console.log(`  Gas Used:         ${(await tx_fee.wait()).gasUsed.toString()} Gwei`);

  console.log(`EPool.setMinRDiv:`);
  const tx_rDiv = await ePool.connect(signer).setMinRDiv('24000000000000000', { gasPrice }); // 5%
  console.log(`  TxHash:           ${tx_rDiv.hash}`);
  console.log(`  Gas Used:         ${(await tx_rDiv.wait()).gasUsed.toString()} Gwei`);

  console.log(`EPool.setRebalanceInterval:`);
  const tx_interval = await ePool.connect(signer).setRebalanceInterval('86400', { gasPrice }); // every day
  console.log(`  TxHash:           ${tx_interval.hash}`);
  console.log(`  Gas Used:         ${(await tx_interval.wait()).gasUsed.toString()} Gwei`);

  console.log(`EPool.addTranche`);
  const tx_tranche_1 = await ePool.connect(signer).addTranche(
    '1000000000000000000', 'Barnbridge Exposure Token Wrapped-Ether 50% / USDC 50%', 'bb_ET_WETH50/USDC50', { gasPrice }
  );
  console.log(`  TxHash:           ${tx_tranche_1.hash}`);
  console.log(`  Gas Used:         ${(await tx_tranche_1.wait()).gasUsed.toString()} Gwei`);
  console.log(`  EToken:           ${(await ePool.connect(signer).getTranches())[0].eToken }`);

  console.log(`EPool.addTranche: 25/75`);
  const tx_tranche_2 = await ePool.connect(signer).addTranche(
    '333333333333333333', 'Barnbridge Exposure Token Wrapped-Ether 25% / USDC 75%', 'bb_ET_WETH25/USDC75', { gasPrice }
  );
  console.log(`  TxHash:           ${tx_tranche_2.hash}`);
  console.log(`  Gas Used:         ${(await tx_tranche_2.wait()).gasUsed.toString()} Gwei`);
  console.log(`  EToken:           ${(await ePool.connect(signer).getTranches())[1].eToken }`);

  console.log(`EPool.addTranche: 75/25`);
  const tx_tranche_3 = await ePool.connect(signer).addTranche(
    '3000000000000000000', 'Barnbridge Exposure Token Wrapped-Ether 75% / USDC 25%', 'bb_ET_WETH75/USDC25', { gasPrice }
  );
  console.log(`  TxHash:           ${tx_tranche_3.hash}`);
  console.log(`  Gas Used:         ${(await tx_tranche_3.wait()).gasUsed.toString()} Gwei`);
  console.log(`  EToken:           ${(await ePool.connect(signer).getTranches())[2].eToken }`);

  // // KeeperNetworkAdapter
  // const KeeperNetworkAdapter: ContractFactory = await ethers.getContractFactory('KeeperNetworkAdapter');
  // // const keeperNetworkAdapter: Contract = await KeeperNetworkAdapter.attach('')
  // const keeperNetworkAdapter: Contract = await KeeperNetworkAdapter.deploy(
  //   controller.address, ePool.address, ePoolHelper.address, ePoolPeriphery.address, { gasPrice }
  // );
  // await keeperNetworkAdapter.deployed();
  // console.log(`KeeperNetworkAdapter:`);
  // console.log(`  TxHash:           ${keeperNetworkAdapter.deployTransaction.hash}`);
  // console.log(`  Gas Used:         ${(await keeperNetworkAdapter.deployTransaction.wait()).gasUsed.toString()} Gwei`);
  // console.log(`  Address:          ${keeperNetworkAdapter.address}`);
}

main().then(() => process.exit(0)).catch((error: Error) => { console.error(error); process.exit(1); });
