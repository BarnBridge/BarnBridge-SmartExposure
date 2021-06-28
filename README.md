# Smart Exposure

## Specification
[SPEC.md](./SPEC.md)

## Initial Setup
### Install NVM and the latest version of NodeJS 12.x
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash 
    # Restart terminal and/or run commands given at the end of the installation script
    nvm install 12
    nvm use 12
    npm install yarn --global
### Use Git to pull down the BarnBridge-SmartExposure repository from GitHub
    git clone https://github.com/BarnBridge/BarnBridge-SmartExposure.git
    cd BarnBridge-SmartExposure
    
## Updating the .env file
## Copy sample.env into .env
    cp sample.env .env
### Create an API key with a Provider that supports Forking such as Alchemy Labs to run Mainnet Forking tests
Alchemy.io can be used to fork the current state of the Mainnet into your development environment. A free account will suffice. 

1. Navigate to [Alchemy](https://alchemyapi.io) and create an account.
2. Log in and create a new Project on Mainnet. 
3. Navigate to the [Dashboard](https://dashboard.alchemyapi.io/) and click View Key.  Paste the URL into the section labeled PROVIDER_FORKING in the `.env` file. 
(Optional: update sectionlabeled BLOCKNUMBER in the `.env` file to fork a more recent state, at time of writing it is `12488859`)

### Create an API key with a Provider to deploy to Ethereum Public Testnets. In this guide, we are using Infura on Kovan.
4. Navigate to [Infura.io](https://infura.io/) and create an account
5. Log in and select "Get started and create your first project to access the Ethereum network"
6. Create a project and name it appropriately. On the Settings page, switch the Network to Kovan and note the project URL ie https://kovan.infura.io/v3/INFURA-API-KEY
7. Copy the Project URL and paste it into the section labeled PROVIDER in the `.env` file.

### Create an API key with Etherscan 
8. Navigate to [EtherScan](https://etherscan.io/) and create an account 
9. Log in and navigate to [MyAPIKey](https://etherscan.io/myapikey) 
10. Use the Add button to create an API key, and paste it into the section labeled ETHERSCAN in the `.env` file

### Update the .env file with your test wallet info
11. Finally, insert the mnemonic phrase for your testing wallet into the `.env` file. You can use a MetaMask instance, and switch the network to Kovan on the upper right. DO NOT USE YOUR PERSONAL METAMASK SEED PHRASE; USE A DIFFERENT BROWSER WITH AN INDEPENDENT METAMASK INSTALLATION
12. You'll need some Kovan-ETH (it is free) in order to pay the gas costs of deploying the contracts on the TestNet; you can use your GitHub account to authenticate to the [KovanFaucet](https://faucet.kovan.network/) and receive 2 Kovan-ETH for free every 24 hours

### Get WETH and DAI for testing
13. Navigate to [UniswapV2](https://app.uniswap.org/#/swap?use=V2), connect your test wallet (ie MetaMask), and swap Kovan ETH for at least 1 WETH and 20 DAI for testing the addSubsidy call in deploy.ts


### Configure any additional options required in .env
14. In general the defaults are ok for testing purposes on Kovan; update as needed if you require

## Installing

Execute the yarn command to install all dependencies. Use the --update-checksums option to avoid SHA hash mismatch issues

```sh
yarn --update-checksums 
```

### Compile

Compile the smart contracts with Hardhat:

```sh
$ yarn compile
```

### Test

Run the Mocha tests:

```sh
# run test locally on clean env.
$ yarn test
# run test locally on kovan fork
$ yarn test:forking
```

### Coverage

Generate the code coverage report:

```sh
$ yarn coverage
```

## Deploying
Use the deploy-from-env script to deploy to the Chain specified in .env (defaults to CHAINID 42 which is Kovan)
Deploys default pool WETH/DAI 30%/70%

```sh
$ yarn deploy-from-env
```
Note the EPool address which is used in subsequent steps

### EPool

Adding a tranche to a EPool with percentage of TokenA (must be less than 100).
EToken and EToken Symbol Names are arbitrary

```sh
$ yarn hardhat addTrancheAsPercentage --network env_network \
  --e-pool E_POOL_ADDRESS \
  --target-ratio-percentage TARGET_RATIO_PERCENTAGE
  --e-token-name ETOKEN_NAME
  --e-token-symbol ETOKEN_SYMBOL
```

Adding a tranche to a EPool with exact ratio (TokenA/TokenB * 10^18)

```sh
$ yarn hardhat addTranche --network env_network \
  --e-pool E_POOL_ADDRESS \
  --target-ratio TARGET_RATIO
  --e-token-name ETOKEN_NAME
  --e-token-symbol ETOKEN_SYMBOL
```

Get the state of a EPool

```sh
$ yarn hardhat getState --network env_network \
  --e-pool E_POOL_ADDRESS \
  --e-pool-helper E_POOL_HELPER_ADDRESS
```

Issue amount of EToken
```sh
$ yarn hardhat issueExact --network env_network \
  --e-pool E_POOL_ADDRESS \
  --e-pool-helper E_POOL_HELPER_ADDRESS
  --e-token E_TOKEN_ADDRESS \
  --amount EToken_AMOUNT
```

Redeem amount of EToken

```sh
$ yarn hardhat redeemExact --network env_network \
  --e-pool E_POOL_ADDRESS \
  --e-pool-helper E_POOL_HELPER_ADDRESS
  --e-token E_TOKEN_ADDRESS \
  --amount E_TOKEN_AMOUNT
```

Set redemption feeRate for EPool

```sh
$ yarn hardhat setFeeRate --network env_network \
  --e-pool E_POOL_ADDRESS \
  --fee-rate FEE_RATE
```

Update min. ratio divergence required to perform rebalancing
```sh
$ yarn hardhat setMinRDiv --network env_network \
  --e-pool EPool \
  --min-r-div MIN_R_DIV
```

Update interval required to perform rebalancing
```sh
$ yarn hardhat setRebalanceInterval --network env_network \
  --e-pool EPool \
  --interval REBALANCE_INTERVAL
```

### EPoolPeriphery
Issue amount of EToken for max. TokenA via the periphery

```sh
$ yarn hardhat issueForMaxTokenA --network env_network \
  --e-pool E_POOL_ADDRESS \
  --e-pool-helper E_POOL_HELPER_ADDRESS \
  --e-pool-periphery E_POOL_PERIPHERY_ADDRESS \
  --e-token E_TOKEN_ADDRESS \
  --amount E_TOKEN_AMOUNT \
  --max-input-amount-a MAX_INPUT_AMOUNT_A
```

Issue amount of EToken for max. TokenB via the periphery

```sh
$ yarn hardhat issueForMaxTokenB --network env_network \
  --e-pool E_POOL_ADDRESS \
  --e-pool-helper E_POOL_HELPER_ADDRESS \
  --e-pool-periphery E_POOL_PERIPHERY_ADDRESS \
  --e-token E_TOKEN_ADDRESS \
  --amount E_TOKEN_AMOUNT \
  --max-input-amount-b MAX_INPUT_AMOUNT_B
```

Rebalance a EPool tranche via flash swap

```sh
$ yarn hardhat rebalanceWithFlashSwap --network env_network \
  --e-pool E_POOL_ADDRESS \
  --e-pool-helper E_POOL_HELPER_ADDRESS \
  --e-pool-periphery E_POOL_PERIPHERY_ADDRESS
```

Redeem amount of EToken for min. TokenA via the periphery

```sh
$ yarn hardhat redeemForMinTokenA --network env_network \
  --e-pool E_POOL_ADDRESS \
  --e-pool-helper E_POOL_HELPER_ADDRESS \
  --e-pool-periphery E_POOL_PERIPHERY_ADDRESS \
  --e-token E_TOKEN_ADDRESS \
  --amount E_TOKEN_AMOUNT \
  --min-output-amount-a MIN_OUTPUT_AMOUNT_A
```

Redeem amount of EToken for min. TokenB via the periphery

```sh
$ yarn hardhat redeemForMinTokenB --network env_network \
  --e-pool E_POOL_ADDRESS \
  --e-pool-helper E_POOL_HELPER_ADDRESS \
  --e-pool-periphery E_POOL_PERIPHERY_ADDRESS \
  --e-token E_TOKEN_ADDRESS \
  --amount E_TOKEN_AMOUNT \
  --min-output-amount-b MIN_OUTPUT_AMOUNT_B
```

### KeeperNetworkAdapter

Update min. deltaA required for keepers to perform rebalancing
```sh
$ yarn hardhat setKeeperMinRDiv --network env_network \
  --keeper-network-adapter KEEPER_NETWORK_ADAPTER \
  --min-r-div MIN_R_DIV
```

Update interval required for keepers to perform rebalancing
```sh
$ yarn hardhat setKeeperRebalanceInterval --network env_network \
  --keeper-network-adapter KEEPER_NETWORK_ADAPTER \
  --interval REBALANCE_INTERVAL
```

### KeeperSubsidyPool
Add subsidy to compensate keepers for pot. losses caused
by price deviation between oracle and exchange prices
```sh
$ yarn hardhat addSubsidy --network env_network \
  --keeper-subsidy-pool KEEPER_SUBSIDY_POOL \
  --token TOKEN \
  --amount AMOUNT
```
### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```sh
$ yarn clean
```

## Discussion
For any concerns with the platform, open an issue on GitHub or visit us on [Discord](https://discord.gg/9TTQNUzg) to discuss.
For security concerns, please email info@barnbridge.com.

Copyright 2021 BarnBridge DAO
