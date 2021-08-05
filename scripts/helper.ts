import hre from 'hardhat';
import { Contract, ContractFactory, Overrides, Signer } from 'ethers';

const { ethers } = hre;

export async function attachContract(contractName: string, contractAddress: string): Promise<Contract> {
  if (contractAddress == undefined || contractAddress === ethers.constants.AddressZero) {
    throw new Error('Could not attach to contract. No contract address provided.');
  }
  return (await ethers.getContractFactory(contractName)).attach(contractAddress);
}

export async function callMethod(
  signer: Signer, contractName: string, contractAddress: string | undefined, methodName: string, args: Array<any>, opts: Overrides
): Promise<void> {
  if (contractAddress == undefined || contractAddress === ethers.constants.AddressZero) {
    throw new Error('Could not call method on contract. No contract address provided.');
  }
  const contract = (await ethers.getContractFactory(contractName)).attach(contractAddress);
  const tx = await contract.connect(signer)[methodName](...args, opts);
  console.log(`${contractName}.${methodName}:`);
  console.log(`  TxHash:           ${tx.hash}`);
  console.log(`  Address:          ${contract.address}`);
  await tx.wait()
  console.log(`  Gas Price:        ${tx.gasPrice.toString()} Gwei`);
  console.log(`  Gas Used:         ${tx.gasUsed.toString()} Gwei`);
  console.log(``);
}

export async function verifyContract(contractName: string, contractAddress: string, args: Array<any>): Promise<void> {
  console.log(`  Verifying ${contractName} on Etherscan ...`);
  await hre.run('verify:verify', { address: contractAddress, constructorArguments: [...args] });
  console.log(``);
}

export async function deployContract(
  contractName: string, args: Array<any>, opts: Overrides
): Promise<{contractName: string; contract: Contract; constructorParams: Array<any>}> {
  const factory: ContractFactory = await ethers.getContractFactory(contractName);
  const contract: Contract = await factory.deploy(...args, opts);
  console.log(`${contractName}:`);
  console.log(`  TxHash:           ${contract.deployTransaction.hash}`);
  await contract.deployed();
  console.log(`  Address:          ${contract.address}`);
  const receipt = await contract.deployTransaction.wait();
  console.log(`  Gas Price:        ${ethers.utils.formatUnits(contract.deployTransaction.gasPrice?.toString() || '0', 'gwei')} Gwei`);
  console.log(`  Gas Used:         ${receipt.gasUsed.toString()} Gwei \n`);
  return { contractName, contract, constructorParams: { ...args } };
}
