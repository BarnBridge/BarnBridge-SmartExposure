import hre from 'hardhat';
import { Contract } from 'ethers';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
dotenvConfig({ path: resolve(__dirname, './.env') });

import { NETWORK_ENV } from '../network';
import { callMethod, deployContract, verifyContract } from './helper';

const { ethers } = hre;

async function main(): Promise<void> {
  const {
    WETH, DAI, AggregatorV3Proxy_DAI_WETH,
    UniswapV2Factory, UniswapV2Router02,
    UniswapV3Factory, UniswapV3Router, UniswapV3Quoter
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
  } = NETWORK_ENV[(await ethers.provider.getNetwork()).name];

  const deployer = (await ethers.getSigners())[0];
  const opts = { gasPrice: ethers.BigNumber.from(process.env.GAS_PRICE) };

  console.log(`Deployment Config:`);
  console.log(`  Deployer:         ${await deployer.getAddress()}`);
  console.log(`  Chain Id:         ${process.env.CHAINID}`);
  console.log(`  Gas Price:        ${ethers.utils.formatUnits(opts.gasPrice, 'gwei')} Gwei\n`);

  /* --------------------------------------------------------------------------------------------------------------- */
  /* Deploy contracts                                                                                                */
  /* --------------------------------------------------------------------------------------------------------------- */

  const deployed: Array<{ contractName: string, contract: Contract, constructorParams: Array<any> }> = [];

  // Controller
  deployed.push({...await deployContract('Controller', [], opts)});
  const controller = deployed[deployed.length - 1].contract;

  // ETokenFactory
  deployed.push({...await deployContract('ETokenFactory', [controller.address], opts)});
  const eTokenFactory = deployed[deployed.length - 1].contract;

  // EPoolHelper
  deployed.push({...await deployContract('EPoolHelper', [], opts)});
  const ePoolHelper = deployed[deployed.length - 1].contract;

  // KeeperSubsidyPool
  deployed.push({...await deployContract('KeeperSubsidyPool', [controller.address], opts)});
  const keeperSubsidyPool = deployed[deployed.length - 1].contract;

  // EPoolPeriphery
  deployed.push({...await deployContract(
    'EPoolPeriphery',
    // 1.03 % --> 3% flash swap slippage
    [controller.address, UniswapV2Factory, UniswapV2Router02, keeperSubsidyPool.address, '1030000000000000000'],
    opts
  )});
  const ePoolPeriphery = deployed[deployed.length - 1].contract;

  // EPoolPeripheryV3
  deployed.push({...await deployContract(
    'EPoolPeripheryV3',
    // 1.03 % --> 3% flash swap slippage
    [controller.address, UniswapV3Factory, UniswapV3Router, keeperSubsidyPool.address, '1030000000000000000', UniswapV3Quoter],
    opts
  )});
  const ePoolPeripheryV3 = deployed[deployed.length - 1].contract;

  // KeeperNetworkAdapter
  deployed.push({...await deployContract(
    'KeeperNetworkAdapter', [controller.address, ePoolHelper.address], opts
  )});

  // EPool - WETH / DAI
  deployed.push({...await deployContract(
    'EPool', [controller.address, eTokenFactory.address, WETH, DAI, AggregatorV3Proxy_DAI_WETH, true], opts
  )});
  const ePool = deployed[deployed.length - 1].contract;

  /* --------------------------------------------------------------------------------------------------------------- */
  /* Set params                                                                                                      */
  /* --------------------------------------------------------------------------------------------------------------- */

  // Add EPoolPeriphery as beneficiary on KeeperSubsidyPool
  await callMethod(
    deployer, 'KeeperSubsidyPool', keeperSubsidyPool.address, 'setBeneficiary', [ePoolPeriphery.address, true], opts
  );

  // Add EPoolPeripheryV3 as beneficiary on KeeperSubsidyPool
  await callMethod(
    deployer, 'KeeperSubsidyPool', keeperSubsidyPool.address, 'setBeneficiary', [ePoolPeripheryV3.address, true], opts
  );

  // Transfer 1 WETH to KeeperSubsidyPool
  await callMethod(
    deployer,
    '@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20',
    WETH,
    'transfer',
    [keeperSubsidyPool.address, ethers.utils.parseEther('1')],
    opts
  );

  // Transfer 20 DAI to KeeperSubsidyPool
  await callMethod(
    deployer,
    '@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20',
    DAI,
    'transfer',
    [keeperSubsidyPool.address, ethers.utils.parseUnits('20', 18)],
    opts
  );

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

  // Create tranche on EPool
  await callMethod(
    deployer,
    'EPool',
    ePool.address,
    'addTranche',
    ['428571428571428540', 'Barnbridge Exposure Token Wrapped-Ether 30% / DAI 70%', 'bb_ET_WETH30/DAI70'],
    opts
  );
  console.log(`  EToken:           ${(await ePool.connect(deployer).getTranches())[0].eToken }`);

  /* --------------------------------------------------------------------------------------------------------------- */
  /* Verify contracts on Etherscan                                                                                   */
  /* --------------------------------------------------------------------------------------------------------------- */

  for (const { contractName, contract, constructorParams } of deployed) {
    await verifyContract(contractName, contract.address, constructorParams);
  }
}

main().then(() => process.exit(0)).catch((error: Error) => { console.error(error); process.exit(1); });
