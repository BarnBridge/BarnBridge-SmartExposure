import { Signer } from '@ethersproject/abstract-signer';
import { task } from 'hardhat/config';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { EPool, EPoolHelper, TestERC20 } from '../../../typechain';

import { REBALANCE } from '../../task-names';


task(REBALANCE, 'Rebalances a EPool')
.addParam('ePool', 'Address of EPool')
.addParam('ePoolHelper', 'Address of EPoolHelper')
.setAction(async function (_taskArgs: any, hre) {
  const { ethers, artifacts } = hre;
  const admin: Signer = (await ethers.getSigners())[0];

  const ePool = new ethers.Contract(_taskArgs.ePool, artifacts.readArtifactSync('EPool').abi) as EPool;
  const rate = await ePool.connect(admin).getRate();
  const tokenA = new ethers.Contract(await ePool.connect(admin).tokenA(), artifacts.readArtifactSync('TestERC20').abi) as TestERC20;
  const tokenB = new ethers.Contract(await ePool.connect(admin).tokenB(), artifacts.readArtifactSync('TestERC20').abi) as TestERC20;
  const balance1 = await tokenA.connect(admin).balanceOf(await admin.getAddress());
  const balance2 = await tokenB.connect(admin).balanceOf(await admin.getAddress());
  console.log(`balance1:         ${balance1.toString()}`);
  console.log(`balance2:         ${balance2.toString()}`);
  const ePoolHelper = new ethers.Contract(_taskArgs.ePoolHelper, artifacts.readArtifactSync('EPoolHelper').abi) as EPoolHelper;
  const [deltaA, deltaB, rChange] = await ePoolHelper.connect(admin).delta(_taskArgs.ePool);
  console.log(`Estimated Rebalance:`);
  console.log(`  deltaA:         ${deltaA.toString() + ((rChange.gt(0)) ? 'to add' : ' to release')}`);
  console.log(`  deltaB:         ${deltaB.toString() + ((rChange.gt(0)) ? 'to release' : ' to add')}`);
  console.log(`  rate:           ${rate.toString()}`);
  if ((rChange.gt(0)) ? deltaA.gt(balance1) : deltaB.gt(balance2)) {
    throw new Error('Insufficient funds for rebalancing the delta.');
  }
  if (rChange.gt(0)) {
    const tx_approve = await tokenA.connect(admin).approve(_taskArgs.ePool, deltaA);
    console.log(`TokenA.approve:`);
    console.log(`  TxHash:       ${tx_approve.hash}`);
  } else {
    const tx_approve = await tokenB.connect(admin).approve(_taskArgs.ePool, deltaB);
    console.log(`TokenB.approve:`);
    console.log(`  TxHash:       ${tx_approve.hash}`);
  }
  const tx_issue = await ePool.connect(admin).rebalance({ gasLimit: 1000000 });
  console.log(`EPool.rebalance:`);
  console.log(`  TxHash:         ${tx_issue.hash}`);
  const receipt = await tx_issue.wait();
  const RebalanceEvent = new ethers.utils.Interface([ePool.interface.getEvent('RebalancedTranche')]);
  receipt.events?.forEach((event: any) => {
    try {
      const result = RebalanceEvent.parseLog(event);
      console.log(`  eToken:         ${result.args.eToken}` );
      console.log(`  deltaA:         ${result.args.deltaA}` );
      console.log(`  deltaB:         ${result.args.deltaB}` );
      console.log(`  rChange:        ${result.args.rChange}` );
    // eslint-disable-next-line no-empty
    } catch(error) {}
  });
});
