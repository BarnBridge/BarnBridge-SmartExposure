import { Signer } from '@ethersproject/abstract-signer';
import { task } from 'hardhat/config';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { EPool, EPoolHelper } from '../../../typechain';

import { GET_STATE } from '../../task-names';


task(GET_STATE, 'Get the state of a EPool')
.addParam('ePool', 'Address of EPool')
.addParam('ePoolHelper', 'Address of EPoolHelper')
.setAction(async function (_taskArgs: any, hre) {
  const { ethers, artifacts } = hre;
  const admin: Signer = (await ethers.getSigners())[0];

  const ePool = new ethers.Contract(_taskArgs.ePool, artifacts.readArtifactSync('EPool').abi) as EPool;
  const ePoolHelper = new ethers.Contract(_taskArgs.ePoolHelper, artifacts.readArtifactSync('EPoolHelper').abi) as EPoolHelper;
  console.log(`EPool: `);
  console.log(`  eTokenFactory:  ${await ePool.connect(admin).eTokenFactory()}`);
  console.log(`  aggregator:     ${await ePool.connect(admin).getAggregator()}`);
  console.log(`  tokenA:         ${await ePool.connect(admin).tokenA()}`);
  console.log(`  tokenB:         ${await ePool.connect(admin).tokenB()}`);
  console.log(`  rate:           ${await ePool.connect(admin).getRate()}`);
  console.log(`  minRDiv:        ${await ePool.connect(admin).rebalanceMinRDiv()}`);
  console.log(`  interval:       ${await ePool.connect(admin).rebalanceInterval()}`);
  for(let i = 0; ; i++) {
    try {
      const tranche = await ePool.connect(admin).getTranche(await ePool.connect(admin).tranchesByIndex(i));
      if (ethers.constants.AddressZero === tranche.eToken) { break; }
      const currentRatio = await ePoolHelper.connect(admin).currentRatio(ePool.address, tranche.eToken);
      const trancheDelta = await ePoolHelper.connect(admin).trancheDelta(ePool.address, tranche.eToken);
      console.log(`  Tranche ${i}`);
      console.log(`    eToken:       ${tranche.eToken}`);
      console.log(`    reserveA:     ${tranche.reserveA}`);
      console.log(`    reserveB:     ${tranche.reserveB}`);
      console.log(`    targetRatio:  ${tranche.targetRatio}`);
      console.log(`    currentRatio: ${currentRatio}`);
      console.log(`    rDiv:         ${trancheDelta.rDiv}`);
      console.log(`    rebalancedAt: ${tranche.rebalancedAt}`);
    } catch(error) { break; }
  }
});
