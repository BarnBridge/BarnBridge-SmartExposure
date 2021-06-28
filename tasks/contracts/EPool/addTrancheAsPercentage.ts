import { Signer } from '@ethersproject/abstract-signer';
import { task } from 'hardhat/config';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { EPool } from '../../../typechain';
import { ADD_TRANCHE_AS_PERCENTAGE } from '../../task-names';

task(ADD_TRANCHE_AS_PERCENTAGE, 'Add a new tranche to a EPool')
.addParam('ePool', 'Address of EPool')
.addParam('targetRatioPercentage', 'Target ratio precentage of TokenA of the tranche')
.addParam('eTokenSymbol', 'Symbol of the tranches EToken')
.addParam('eTokenName', 'Name of the tranches EToken')
.setAction(async function (_taskArgs: any, { ethers, artifacts }) {
  const admin: Signer = (await ethers.getSigners())[0];
  const targetRatioPercentage = Number(_taskArgs.targetRatioPercentage);
  if (targetRatioPercentage >= 100) {console.log("Error: targetRatioPercentage must be less than 100"); return}
  const targetRatio: number = targetRatioPercentage/(100 - targetRatioPercentage) * 10 ** 18;
  console.log('targetRatio Is: ' + targetRatio);
  const ePool = new ethers.Contract(_taskArgs.ePool, artifacts.readArtifactSync('EPool').abi) as EPool;
  const tx_create = await ePool.connect(admin).addTranche(
    targetRatio.toString(), _taskArgs.eTokenName, _taskArgs.eTokenSymbol
  );
  console.log(`EPool.addTranche:`);
  console.log(`  TxHash:         ${tx_create.hash}`);
  const eToken = (await tx_create.wait()).events?.find((logs: any) => logs.event === 'AddedTranche')?.args?.join() as string;
  console.log(`  eToken:         ${eToken}`);
});
