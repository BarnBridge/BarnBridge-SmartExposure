import hre from 'hardhat';
import { Contract } from 'ethers';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
dotenvConfig({ path: resolve(__dirname, './.env') });

import { NETWORK_ENV } from '../network';
import { attachContract, callMethod, deployContract, verifyContract } from './helper';

const { ethers } = hre;

async function main(): Promise<void> {
  const {
    AggregatorV3Proxy_USDC_WETH, WETH, USDC,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
  } = NETWORK_ENV[(await ethers.provider.getNetwork()).name];

  const deployer = (await ethers.getSigners())[0];
  const opts = { gasPrice: ethers.BigNumber.from(process.env.GAS_PRICE) };

  console.log(`Deployment Config:`);
  console.log(`  Deployer:         ${await deployer.getAddress()}`);
  console.log(`  Chain Id:         ${process.env.CHAINID}`);
  console.log(`  Gas Price:        ${ethers.utils.formatUnits(opts.gasPrice, 'gwei')} Gwei\n`);

  const controller = await attachContract('Controller', '');
  const eTokenFactory = await attachContract('ETokenFactory', '');
  const ePoolPeriphery = await attachContract('EPoolPeriphery', '');
  const ePoolPeripheryV3 = await attachContract('EPoolPeripheryV3', '');
  const keeperNetworkAdapter = await attachContract('KeeperNetworkAdapter', '');

  /* --------------------------------------------------------------------------------------------------------------- */
  /* EPool - WETH / USDC                                                                                             */
  /* --------------------------------------------------------------------------------------------------------------- */

  const deployed: Array<{ contractName: string, contract: Contract, constructorParams: Array<any> }> = [];

  // EPool
  deployed.push({...await deployContract(
    'EPool', [controller.address, eTokenFactory.address, WETH, USDC, AggregatorV3Proxy_USDC_WETH, true], opts
  )});
  const ePool = deployed[deployed.length - 1].contract;

  // Approve EPool on EPoolPeriphery
  await callMethod(
    deployer, 'EPoolPeriphery', ePoolPeriphery.address, 'setEPoolApproval', [ePool.address, true], opts
  );

  // Approve EPool on EPoolPeripheryV3
  await callMethod(
    deployer, 'EPoolPeripheryV3', ePoolPeripheryV3.address, 'setEPoolApproval', [ePool.address, true], opts
  );

  // Set fee rate on EPool
  await callMethod(
    deployer, 'EPool', ePool.address, 'setFeeRate', [ethers.utils.parseUnits('0.01', '18')], opts
  );

  // Set rebalance min. ratio deviation on EPool
  await callMethod(
    deployer, 'EPool', ePool.address, 'setRebalanceMinRDiv', [ethers.utils.parseUnits('0.05', '18')], opts
  );

  // Set rebalance interval on EPool
  await callMethod(
    deployer, 'EPool', ePool.address, 'setRebalanceInterval', ['86400'], opts
  );

  // Create tranche 50 / 50 on EPool
  await callMethod(
    deployer,
    'EPool',
    ePool.address,
    'addTranche',
    ['1000000000000000000', 'Barnbridge Exposure Token Wrapped-Ether 50% / USDC 50%', 'bb_ET_WETH50/USDC50'],
    opts
  );
  console.log(`  EToken (50/50):   ${(await ePool.connect(deployer).getTranches())[0].eToken }`);

  // Create tranche 25 / 75 on EPool
  await callMethod(
    deployer,
    'EPool',
    ePool.address,
    'addTranche',
    ['333333333333333333', 'Barnbridge Exposure Token Wrapped-Ether 25% / USDC 75%', 'bb_ET_WETH25/USDC75'],
    opts
  );
  console.log(`  EToken (25/75):   ${(await ePool.connect(deployer).getTranches())[1].eToken }`);

  // Create tranche 75 / 25 on EPool
  await callMethod(
    deployer,
    'EPool',
    ePool.address,
    'addTranche',
    ['3000000000000000000', 'Barnbridge Exposure Token Wrapped-Ether 75% / USDC 25%', 'bb_ET_WETH75/USDC25'],
    opts
  );
  console.log(`  EToken (75/25):   ${(await ePool.connect(deployer).getTranches())[2].eToken }`);

  // Add EPool on KeeperNetworkAdapter
  await callMethod(
    deployer, 'KeeperNetworkAdapter', keeperNetworkAdapter.address, 'addEPool', [ePool.address], opts
  );

  /* --------------------------------------------------------------------------------------------------------------- */
  /* Verify contracts on Etherscan                                                                                   */
  /* --------------------------------------------------------------------------------------------------------------- */

  for (const { contractName, contract, constructorParams } of deployed) {
    await verifyContract(contractName, contract.address, constructorParams);
  }
}

main().then(() => process.exit(0)).catch((error: Error) => { console.error(error); process.exit(1); });
