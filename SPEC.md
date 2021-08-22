# SmartExposure System Description Document

SmartExposure is a DeFi product tranching the price fluctuations of an underlying token pair into various fixed exposure tokens thereby serving as a risk ramp for investors, treasurers and traders.

A SmartExposure pool, the `EPool`, manages a specific token pair, say WBTC/WETH, and all associated fixed exposure tranches. Each tranche offers a fixed exposure to the price fluctuations of the underlying token pair, say 70/30 or 70% exposure to WBTC measured in ETH, and is represented by an ERC-20 token - the fixed exposure token `EToken`.

Fixed exposure tokens can be issued and redeemed by anyone at any time. When the price of the underlying token pair changes the value of the fixed exposure token also changes according to the token’s fixed exposure. As an example, if the WBTC/WETH price changes by +10% the value of the 70/30 `EToken` moves +7%.

The naming scheme for the E-Token is the following:
`bb_ET_` + {{Token 1 symbol}} + {{Token 1 exposure}} + `/` + {{Token 2 symbol}} + {{Token 2 exposure}}
e.g. `bb_ET_WETH70/WBTC30`

Furthermore, the `EToken` is self-rebalancing guaranteeing that a token’s exposure automatically readjusts to it’s target.

![](https://user-images.githubusercontent.com/45110941/115087032-ba110180-9f0d-11eb-86b1-e17b3714a266.jpg)

## Actors

### Primary market buyer/seller

The primary market buyer/seller issues new `EToken` or redeems such tokens by interacting with the SmartExposure system. She typically interacts with the `EPoolPeriphery` but can also issue/redeem directly through the `EPool`.

### Secondary market buyer/seller

A secondary market buyer/seller buys or sells `EToken` on a secondary market. Because fixed exposure tokens are ERC-20 compatible and thus fungible tokens secondary markets, e.g. on Uniswap, SushiSwap, etc., may be created by anyone at anytime. The secondary market buyer/seller does not interact directly with the SmartExposure system but with a secondary market.
For example, buying an amount of `bb_ET_WETH70/WBTC30` token, gives the buyer immediate exposure to ETH (70%) and BTC (30%).

### Keeper

The keeper executes the `collectFee` and `rebalance` functions whenever there is an incentive to do so. Anyone can call these functions and take the role of a keeper. While `collectFee` can be executed at any time a successful `rebalance` call is only possible if the rebalance criteria is met.

### Aggregator

The aggregator feeds the `EPool` with a current market price of the underlying token pair. This data is required when rebalancing an `EPool` and its exposure tranches, respectively. In the current implementation a Chainlink oracle is used by the aggregator.

### Guardian

The Guardian is an Ethereum multisig account controlled by the BarnBridge operations team. The Guardian has no control over the user funds in the `EPool` and cannot update the the smart contracts. The Guardian has only control over a number of parameters that calibrate the SmartExposure system (for details see ‘Controller’ below).

### BarnBridge DAO

The BarnBridge DAO acts on behalf of the BOND token holders and governs the SmartExposure system. The DAO has no control over the user funds in the `EPool` and cannot update the the smart contracts. The DAO only has control over a number of parameters that calibrate the SmartExposure system (see ‘Controller’ below).

## EPool

The `EPool` is the main component of the SmartExposure system handling the treasury of the underlying token pair, the exposure tranches, `EToken` minting and burning, and rebalancing.

In the following we describe the functions of the `EPool` that are exposed to the public in detail.

### issueExact

This function mints `EToken` and deposits `TokenA` and `TokenB` in proportion to the current reserves in a tranche.

Parameter `amount` defines the desired amount of `EToken` to be minted. The necessary amounts of `TokenA` and `TokenB` that must be deposited to the treasury is calculated as follows

```
amountA = amount / eTokenTotalSupply * reserveA
amountB = amount / eTokenTotalSupply * reserveB
```

where `eTokenTotalSupply` is the total supply of `EToken` for a tranche.

The function will send

- `TokenA` and `TokenB` from `sender` to `EPool`
- `EToken` from `EPool` to `sender`

Hence, `sender` needs to make sure that she:

- owns the required amount of `TokenA` and `TokenB`
- has approved `EPool` as `spender` of her `TokenA` and `TokenB`

### redeemExact

This function burns `EToken` and withdraws `TokenA` and `TokenB` in proportion to the current reserves in a tranche.

Parameter `amount` defines the amount of `EToken` to be burned. The amount of  `TokenA` and `TokenB` withdrawn from `EPool` is calculated as follows

```
amountA = amount / eTokenTotalSupply * reserveA
amountB = amount / eTokenTotalSupply * reserveB
```

where `eTokenTotalSupply` is the total supply of `EToken` of a tranche.

A redemption fee is deducted from the withdrawal amounts of both tokens

```
feeA = amountA * feeRate
feeB = amountB * feeRate
```

Therewith, the final withdrawal amount is

```
amountA = amountA - feeA
amountB = amountB - feeB
```

### rebalance

Rebalances all tranches according to the current `aggregator` price.

The following steps are executed in a `rebalance`:

1. For each exposure tranche compute `deltaA` and `deltaB`, the amounts of `TokenA` and `TokenB` to be swapped such that the target exposure is again established according to the current `aggregator` price
2. Update `reserveA` and `reserveB` for each exposure tranche
3. Compute the total `deltaA` and `deltaB` that needs be swapped across all tranches
4. Swap `deltaA` for `deltaB` (or vice-versa) with `sender`

Thus, a `rebalance` essentially performs a swap of `TokenA` against `TokenB` (or vice-versa). As a result, `sender` needs to make sure that she:

- owns the required amount of tokens (either `deltaA` of `TokenA` or `deltaB` of `TokenB`)
- has approved `EPool` as `spender` of her tokens

### collectFee

Sends the accumulated fees in `TokenA` and `TokenB`, tracked in variables `cumulativeFeeA` and `cumulativeFeeB`, to the `feesOwner`.

## EPoolPeriphery

This is a peripheral contract exposing a number of functions making the interaction with `EPool` more convenient for users. This contract does not contain any core functionality.

### issueForMaxTokenA

Allows a user to issue a certain `amount` of `EToken` for a maximum amount of `TokenA`.

The function determines the amount of `TokenA` and `TokenB` required by `EPool`'s `issueExact` function. Then, it swaps the required `TokenA` for `TokenB` on Uniswap V2 and issues new `EToken` using `issueExact` on the `EPool`.

Parameter `maxInputAmountA` serves as slippage protection for the Uniswap V2 swap guaranteeing a maximal amount of `TokenA` used in the swap. Because of the Uniswap V2 swap the function can result in two outcomes:

- If `maxInputAmountA` is not sufficient to swap for the required amount of `TokenB` the transaction fails and is reverted.
- If `maxInputAmountA` is sufficient for the swap then `EToken` is issued and the unused amount of `TokenA` refunded to `sender`.

Furthermore, `sender` needs to make sure that she:

- owns `maxInputAmountA` of `TokenA`
- has approved `EPoolPeriphery` as `spender` of her `TokenA` tokens

### redeemForMinTokenA

Allows a user to redeem a certain `amount` of `EToken` for a minimum amount of `TokenA`.

The function performs a `redeemExact` on `EPool` (thereby burning `amount` of `sender`'s `EToken`), swaps the resulting `TokenB` for `TokenA` on Uniswap V2 and refunds the total amount of `TokenA` to `sender`.

Parameter `minOutputA` serves as slippage protection for the Uniswap V2 swap guaranteeing that the amount of `TokenB` received from the `redeemExact` swaps to a minimal amount of `TokenA`. Because of the Uniswap V2 swap the function can result in two outcomes:

- If `TokenB` swaps to an amount of `TokenA` smaller than `minOutputA` the transaction fails and is reverted.
- Else, `TokenA` is refunded to `sender`.

Furthermore, `sender` needs to make sure that she:

- owns `amount` of `EToken`
- has approved `EPoolPeriphery` as `spender` of her `EToken` tokens

### rebalanceWithFlashSwap

Rebalances all tranches according to the current `aggregator` price using a Uniswap V2 flash swap to obtain the required capital.

The function essentially performs the same steps as `EPool`'s `rebalance` function but executes a Uniswap V2 flash swap instead of swapping `TokenA` and `TokenB` with `sender` (see step 4 of `rebalance`).

There are two sources of potential slippage in this function:

- Between the `aggregator` price (used in `EPool`'s `rebalance`) and the Uniswap V2 price (used in the flash swap). The resulting delta is settled with the `KeeperSubsidyPool`.
- During the Uniswap V2 flash swap itself. Parameter `maxFlashSwapSlippage` serves as protection in this case.

The transaction fails if either `KeeperSubsidyPool` cannot cover a potential delta from the first source of slippage or if `maxFlashSwapSlippage` is exceeded during the Uniswap V2 flash swap.

## EPoolLibrary

This is a library contract which is inherited by `EPool` and `EPoolPeriphery` containing a number of pure utility functions.

## EToken

Each exposure tranche of an `EPool` is represented by an ERC-20 compatible token - the fixed exposure token `EToken`. The token serves as a user’s “proof of liquidity” in a certain exposure tranche of the `EPool` and can be redeemed against the its share of `TokenA` and `TokenB` reserves.

## Fees

A redemption fee applies to every `EToken`  redemption through function `redeemExact`.

The fee is calculated on the basis of `feeRate` and credited to `feesOwner`.

The `feeRate` has a hard cap of 0.5%.

## Controller

The controller contract defines the roles and access control modifiers of the SmartExposure system. Specifically, the SmartExposure system uses two access control modifiers

- `onlyDao`: used for functions that only the BarnBridge DAO has control over
- `onlyDaoOrGuardian`: used for functions that both the BarnBridge DAO and the Guardian have control over

The table below gives an overview of all functions in the SmartExposure system utilizing these modifiers.

Furthermore, the controller contract exposes a function `setPausedIssuance` that uses the `onlyDaoOrGuardian` modifier which allows the issuance of new `EToken` for all exposure tranches controlled by this controller contract to be paused. Note that only the the issuance of new `EToken` is paused and not the redemption of outstanding tokens such that users always have control over their funds.

| Contract             | Function                | Effect                                                                                                     | Modifier            |
| -------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------- |
| EPool                | addTranche              | Adds a new tranche to an existing `EPool`                                                                  | `onlyDao`           |
|                      | updateAggregator        | Sets a new `aggregator` providing `TokenA/TokenB` prices                                                   | `onlyDao`           |
|                      | setFees                 | Sets a new `feeRate` (in % scaled by 1e18)                                                                 | `onlyDao`           |
|                      | interval                | Sets the min. time period between any two `rebalance` calls (in seconds)                                   | `onlyDao`           |
|                      | minRDiv                 | Sets min. rel. change of deltaA between any two `rebalance` calls (in % scaled by 1e18)                    | `onlyDao`           |
| EPoolPeriphery       | updateEPoolApproval     | Sets the `EPool` approved for interactions                                                                 | `onlyDaoOrGuardian` |
|                      | setMaxFlashSwapSlippage | Sets `maxFlashSwapSlippage` used in Uniswap V2 flash swaps (in % scaled by 1e18, with 100% := no slippage) | `onlyDaoOrGuardian` |
| KeeperSubsidyPool    | setBeneficiary          | Sets the beneficiary of the funds in the `KeeperSubsidyPool`                                               | `onlyDaoOrGuardian` |
| KeeperNetworkAdapter | updateEPool             | Sets the `EPool` on which upkeep tasks are performed                                                       | `onlyDaoOrGuardian` |
|                      | updateEPoolPeriphery    | Sets the `EPoolPeriphery` on which `rebalanceWithFlashSwap` is performed                                   | `onlyDaoOrGuardian` |
|                      | updateMinRDiv           | Sets min. rel. change of deltaA between any two `rebalance` calls (in % scaled by 1e18)                    | `onlyDaoOrGuardian` |
| Controller           | setDao                  | Sets the DAO address                                                                                       | `onlyDao`           |
|                      | setGuardian             | Sets the Guardian address                                                                                  | `onlyDao`           |
|                      | setFeesOwner            | Sets the `feeOwner` address                                                                                | `onlyDao`           |
|                      | setPausedIssuance       | Pauses issuance of new `EToken`                                                                            | `onlyDaoOrGuardian` |

# Token Requirements
There are some requirements that two tokens to be used as the underlying token pair must fulfill.

  - A Chainlink price feed for the token pair
  - Direct Uniswap v2 market for the token pair
  - Precision between x and 18
  - No elastic supply
  - No algorithmic or non-standard balances
