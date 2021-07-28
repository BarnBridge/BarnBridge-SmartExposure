import { Signer } from '@ethersproject/abstract-signer';
import { task } from 'hardhat/config';
import fetch from 'node-fetch';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { EPool, EPoolHelper, EPoolPeriphery, TestERC20 } from '../../../typechain';

import { REBALANCE_WITH_FLASH_SWAP } from '../../task-names';


task(REBALANCE_WITH_FLASH_SWAP, 'Rebalances a EPool with a flash swap')
.addParam('ePool', 'Address of EPool')
.addParam('ePoolHelper', 'Address of EPoolHelper')
.addParam('ePoolPeriphery', 'Address of EPoolPeriphery')
.setAction(async function (_taskArgs: any, hre) {
  const { ethers, artifacts } = hre;
  const admin: Signer = (await ethers.getSigners())[0];

  const ePool = new ethers.Contract(_taskArgs.ePool, artifacts.readArtifactSync('EPool').abi) as EPool;
  const ePoolHelper = new ethers.Contract(_taskArgs.ePoolHelper, artifacts.readArtifactSync('EPoolHelper').abi) as EPoolHelper;
  const ePoolPeriphery = new ethers.Contract(_taskArgs.ePoolPeriphery, artifacts.readArtifactSync('EPoolPeriphery').abi) as EPoolPeriphery;
  const tranches = await ePool.connect(admin).getTranches();
  const rate = await ePool.connect(admin).getRate();
  const tokenA = new ethers.Contract(await ePool.connect(admin).tokenA(), artifacts.readArtifactSync('TestERC20').abi) as TestERC20;
  const tokenB = new ethers.Contract(await ePool.connect(admin).tokenB(), artifacts.readArtifactSync('TestERC20').abi) as TestERC20;
  const rebalanceMode = await ePool.connect(admin).rebalanceMode();
  const rebalanceMinRDiv = await ePool.connect(admin).rebalanceMinRDiv();
  const rebalanceInterval = await ePool.connect(admin).rebalanceInterval();
  const balanceA = await tokenA.connect(admin).balanceOf(await admin.getAddress());
  const balanceB = await tokenB.connect(admin).balanceOf(await admin.getAddress());
  console.log(`balanceA:         ${balanceA.toString()}`);
  console.log(`balanceB:         ${balanceB.toString()}`);
  let shouldRebalance = false;
  for (const tranche of tranches) {
    const [deltaA, deltaB, rChange, rDiv] = await ePoolHelper.connect(admin).trancheDelta(_taskArgs.ePool, tranche.eToken);
    console.log(`Estimated Rebalance on Tranche:`);
    console.log(`  tranche:        ${tranche.eToken}`);
    console.log(`  deltaA:         ${deltaA.toString() + ((rChange.gt(0)) ? ' to add' : ' to release')}`);
    console.log(`  deltaB:         ${deltaB.toString() + ((rChange.gt(0)) ? ' to release' : ' to add')}`);
    console.log(`  rDiv:           ${rDiv}`);
    console.log(`  rebalancedAt:   ${tranche.rebalancedAt}`);
    const deviated = rDiv.gte(rebalanceMinRDiv);
    const currentTimestamp = ethers.BigNumber.from(Math.round(new Date().getTime() / 1000));
    const nextRebalanceTimestamp = tranche.rebalancedAt.add(rebalanceInterval);
    const scheduled = currentTimestamp.lt(nextRebalanceTimestamp);
    if (rebalanceMode.eq(0) && (deviated || scheduled)) {
      shouldRebalance = true;
    } else if (rebalanceMode.eq(1) && (deviated && scheduled)) {
      shouldRebalance = true;
    }
  }
  const [deltaA, deltaB, rChange] = await ePoolHelper.connect(admin).delta(_taskArgs.ePool);
  console.log(`Estimated Rebalance:`);
  console.log(`  totalDeltaA:      ${deltaA.toString() + ((rChange.gt(0)) ? ' to add' : ' to release')}`);
  console.log(`  totalDeltaB:      ${deltaB.toString() + ((rChange.gt(0)) ? ' to release' : ' to add')}`);
  console.log(`  rate:             ${rate.toString()}`);

  if (shouldRebalance == false) {
    console.log('No rebalance required');
    return;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const gasPrice = String((await (await fetch('https://www.gasnow.org/api/v3/gas/price')).json()).data.fast);
  const tx_rebalance = await ePoolPeriphery.connect(admin).rebalanceWithFlashSwap(
    ePool.address, ethers.utils.parseUnits('1', 18), { gasLimit: 500000, gasPrice: gasPrice }
  );
  console.log(`EPoolPeriphery.rebalanceAllWithFlashSwap:`);
  console.log(`  TxHash:         ${tx_rebalance.hash}`);
  const receipt = await tx_rebalance.wait();
  const RebalanceEvent = new ethers.utils.Interface([ePool.interface.getEvent('RebalancedTranche')]);
  receipt.events?.forEach((event: any) => {
    try {
      const result = RebalanceEvent.parseLog(event);
      console.log(`  deltaA:         ${result.args.deltaA}` );
      console.log(`  deltaB:         ${result.args.deltaB}` );
      console.log(`  rChange:        ${result.args.rChange}` );
    // eslint-disable-next-line no-empty
    } catch(error) {}
  });
});
