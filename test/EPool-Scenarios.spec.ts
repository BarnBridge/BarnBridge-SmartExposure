import { ethers } from 'hardhat';
import { assert, expect } from 'chai';

import ETokenArtifact from '../artifacts/contracts/EToken.sol/EToken.json';
import { EToken } from '../typechain';

import { environmentFixture, signersFixture } from './fixture';

const { utils: { parseUnits: toUnit } } = ethers;

describe('EPool - Scenarios', function () {

  before(async function () {
    await signersFixture.bind(this)();
    await environmentFixture.bind(this)();
    if (!this.localRun) { this.skip(); }

    const scenarios = [
      {
        description: 'Issue for 2 users',
        feeRate: toUnit('0.1', this.decI),
        initialRate: this.sFactorI.mul(1800),
        tranches: [
          { targetRatio: toUnit(String(30/70), this.decI), symbol: 'bb_ET_WETH30/DAI70', name: 'Barnbridge Exposure Token Wrapped-Ether 30% / DAI 70%' },
          { targetRatio: toUnit(String(50/50), this.decI), symbol: 'bb_ET_WETH50/DAI50', name: 'Barnbridge Exposure Token Wrapped-Ether 50% / DAI 50%' },
          { targetRatio: toUnit(String(70/30), this.decI), symbol: 'bb_ET_WETH70/DAI30', name: 'Barnbridge Exposure Token Wrapped-Ether 70% / DAI 30%' },
        ],
        actions: [
          { method: 'issueExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'setAnswer', rate: this.sFactorI.mul(1850), signer: this.signers.admin },
          { method: 'issueExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 },
          { method: 'setAnswer', rate: this.sFactorI.mul(1830), signer: this.signers.admin },
          { method: 'rebalance', signer: this.signers.admin },
          { method: 'redeemExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'collectFee', signer: this.signers.feesOwner },
          { method: 'redeemExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 },
          { method: 'collectFee', signer: this.signers.feesOwner },
          { method: 'collectFee', signer: this.signers.feesOwner }
        ]
      },
      {
        description: 'Issue from multiple tranches',
        feeRate: toUnit('0.0', this.decI),
        initialRate: this.sFactorI.mul(1800),
        tranches: [
          { targetRatio: toUnit(String(30/70), this.decI), symbol: 'bb_ET_WETH30/DAI70', name: 'Barnbridge Exposure Token Wrapped-Ether 30% / DAI 70%' },
          { targetRatio: toUnit(String(50/50), this.decI), symbol: 'bb_ET_WETH50/DAI50', name: 'Barnbridge Exposure Token Wrapped-Ether 50% / DAI 50%' },
          { targetRatio: toUnit(String(70/30), this.decI), symbol: 'bb_ET_WETH70/DAI30', name: 'Barnbridge Exposure Token Wrapped-Ether 70% / DAI 30%' },
        ],
        actions: [
          { method: 'issueExact', trancheIndex: 1, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'issueExact', trancheIndex: 0, eTokenAmount: toUnit('0.5', this.decE), signer: this.signers.user },
          { method: 'issueExact', trancheIndex: 0, eTokenAmount: toUnit('0.5', this.decE), signer: this.signers.user },
          { method: 'setAnswer', rate: this.sFactorI.mul(1750), signer: this.signers.admin },
          { method: 'issueExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 },
          { method: 'setAnswer', rate: this.sFactorI.mul(1400), signer: this.signers.admin },
          { method: 'redeemExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'rebalance', signer: this.signers.admin },
          { method: 'issueExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'redeemExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'redeemExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 },
          { method: 'redeemExact', trancheIndex: 1, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user }
        ]
      },
      {
        description: 'Investing into rising price, redeeming after fall',
        feeRate: toUnit('0.0', this.decI),
        initialRate: this.sFactorI.mul(100),
        tranches: [
          { targetRatio: toUnit(String(25/75), this.decI), symbol: 'bb_ET_WETH25/DAI75', name: 'Barnbridge Exposure Token Wrapped-Ether 25% / DAI 75%' },
          { targetRatio: toUnit(String(50/50), this.decI), symbol: 'bb_ET_WETH50/DAI50', name: 'Barnbridge Exposure Token Wrapped-Ether 50% / DAI 50%' },
          { targetRatio: toUnit(String(75/25), this.decI), symbol: 'bb_ET_WETH75/DAI25', name: 'Barnbridge Exposure Token Wrapped-Ether 75% / DAI 25%' },
        ],
        actions: [
          { method: 'issueExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'setAnswer', rate: this.sFactorI.mul(200), signer: this.signers.admin },
          { method: 'rebalance', signer: this.signers.admin },
          { method: 'issueExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 },
          { method: 'setAnswer', rate: this.sFactorI.mul(50), signer: this.signers.admin },
          { method: 'rebalance', signer: this.signers.admin },
          { method: 'redeemExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'redeemExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 }
        ]
      },
      {
        description: 'Investing into falling price, redeeming after rise',
        feeRate: toUnit('0.0', this.decI),
        initialRate: this.sFactorI.mul(100),
        tranches: [
          { targetRatio: toUnit(String(25/75), this.decI), symbol: 'bb_ET_WETH25/DAI75', name: 'Barnbridge Exposure Token Wrapped-Ether 25% / DAI 75%' },
          { targetRatio: toUnit(String(50/50), this.decI), symbol: 'bb_ET_WETH50/DAI50', name: 'Barnbridge Exposure Token Wrapped-Ether 50% / DAI 50%' },
          { targetRatio: toUnit(String(75/25), this.decI), symbol: 'bb_ET_WETH75/DAI25', name: 'Barnbridge Exposure Token Wrapped-Ether 75% / DAI 25%' },
        ],
        actions: [
          { method: 'issueExact', trancheIndex: 2, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'setAnswer', rate: this.sFactorI.mul(50), signer: this.signers.admin },
          { method: 'rebalance', signer: this.signers.admin },
          { method: 'issueExact', trancheIndex: 2, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 },
          { method: 'setAnswer', rate: this.sFactorI.mul(500), signer: this.signers.admin },
          { method: 'rebalance', signer: this.signers.admin },
          { method: 'redeemExact', trancheIndex: 2, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'redeemExact', trancheIndex: 2, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 }
        ]
      },
      {
        description: 'Redeeming before rebalance, falling price',
        feeRate: toUnit('0.0', this.decI),
        initialRate: this.sFactorI.mul(100),
        tranches: [
          { targetRatio: toUnit(String(25/75), this.decI), symbol: 'bb_ET_WETH25/DAI75', name: 'Barnbridge Exposure Token Wrapped-Ether 25% / DAI 75%' },
          { targetRatio: toUnit(String(50/50), this.decI), symbol: 'bb_ET_WETH50/DAI50', name: 'Barnbridge Exposure Token Wrapped-Ether 50% / DAI 50%' },
          { targetRatio: toUnit(String(75/25), this.decI), symbol: 'bb_ET_WETH75/DAI25', name: 'Barnbridge Exposure Token Wrapped-Ether 75% / DAI 25%' },
        ],
        actions: [
          { method: 'issueExact', trancheIndex: 2, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'issueExact', trancheIndex: 2, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 },
          { method: 'setAnswer', rate: this.sFactorI.mul(50), signer: this.signers.admin },
          { method: 'redeemExact', trancheIndex: 2, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'rebalance', signer: this.signers.admin },
          { method: 'redeemExact', trancheIndex: 2, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 }
        ]
      },
      {
        description: 'Redeeming before rebalance, rising price',
        feeRate: toUnit('0.0', this.decI),
        initialRate: this.sFactorI.mul(100),
        tranches: [
          { targetRatio: toUnit(String(25/75), this.decI), symbol: 'bb_ET_WETH25/DAI75', name: 'Barnbridge Exposure Token Wrapped-Ether 25% / DAI 75%' },
          { targetRatio: toUnit(String(50/50), this.decI), symbol: 'bb_ET_WETH50/DAI50', name: 'Barnbridge Exposure Token Wrapped-Ether 50% / DAI 50%' },
          { targetRatio: toUnit(String(75/25), this.decI), symbol: 'bb_ET_WETH75/DAI25', name: 'Barnbridge Exposure Token Wrapped-Ether 75% / DAI 25%' },
        ],
        actions: [
          { method: 'issueExact', trancheIndex: 2, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'issueExact', trancheIndex: 2, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 },
          { method: 'setAnswer', rate: this.sFactorI.mul(200), signer: this.signers.admin },
          { method: 'redeemExact', trancheIndex: 2, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'rebalance', signer: this.signers.admin },
          { method: 'redeemExact', trancheIndex: 2, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 }
        ]
      }
    ];

    scenarios.forEach((scenario: any, index: number) => {
      describe('Scenario #' + index + ': ' + scenario.description, function () {
        before(async function () {
          await signersFixture.bind(this)();
          await environmentFixture.bind(this)();

          // approve TokenA and TokenB for EPool
          await Promise.all([
            this.tokenA.connect(this.signers.admin).mint(this.accounts.admin, this.sFactorA.mul(100000)),
            this.tokenB.connect(this.signers.admin).mint(this.accounts.admin, this.sFactorB.mul(100000)),
            this.tokenA.connect(this.signers.admin).approve(this.ep.address, this.sFactorA.mul(100000)),
            this.tokenB.connect(this.signers.admin).approve(this.ep.address, this.sFactorB.mul(100000)),

            this.tokenA.connect(this.signers.admin).mint(this.accounts.user, this.sFactorA.mul(100000)),
            this.tokenB.connect(this.signers.admin).mint(this.accounts.user, this.sFactorB.mul(100000)),
            this.tokenA.connect(this.signers.user).approve(this.ep.address, this.sFactorA.mul(100000)),
            this.tokenB.connect(this.signers.user).approve(this.ep.address, this.sFactorB.mul(100000)),

            this.tokenA.connect(this.signers.admin).mint(this.accounts.user2, this.sFactorA.mul(100000)),
            this.tokenB.connect(this.signers.admin).mint(this.accounts.user2, this.sFactorB.mul(100000)),
            this.tokenA.connect(this.signers.user2).approve(this.ep.address, this.sFactorA.mul(100000)),
            this.tokenB.connect(this.signers.user2).approve(this.ep.address, this.sFactorB.mul(100000)),

            // initial exchange rate
            this.aggregator.connect(this.signers.admin).setAnswer(scenario.initialRate),
            // set controller
            this.controller.connect(this.signers.admin).setFeesOwner(this.accounts.feesOwner)
          ]);
        });

        describe('#setFeeRate', function () {
          it('should set the fee rate', async function () {
            await this.ep.connect(this.signers.admin).setFeeRate(scenario.feeRate);
            assert((await this.ep.connect(this.signers.admin).feeRate()).eq(scenario.feeRate));
          });
        });

        describe('#addTranche', function () {
          it('should create all tranches', async function () {
            await Promise.all(scenario.tranches.map(async (tranche: any, index: number) => {
              await this.ep.connect(this.signers.admin).addTranche(tranche.targetRatio, tranche.name, tranche.symbol);
              const eTokenAddr = await this.ep.connect(this.signers.admin).tranchesByIndex(index);
              const eToken = new ethers.Contract(eTokenAddr, ETokenArtifact.abi) as EToken;
              expect(await eToken.connect(this.signers.admin).ePool()).to.equal(this.ep.address);
            }));
          });
        });

        describe('should execute all actions', function () {
          scenario.actions.forEach((action: any) => {
            it('#' + action.method, async function () {
              switch (action.method) {
                case 'issueExact': {
                  const account = await action.signer.getAddress();
                  const tranche = (await this.ep.connect(action.signer).getTranches())[action.trancheIndex];
                  const eToken = new ethers.Contract(tranche.eToken, ETokenArtifact.abi) as EToken;
                  const [amountA, amountB] = await this.eph.connect(action.signer).tokenATokenBForEToken(
                    this.ep.address, eToken.address, action.eTokenAmount
                  );
                  const ratio = await this.eph.connect(action.signer).currentRatio(this.ep.address, eToken.address);
                  const balanceOfA = await this.tokenA.connect(action.signer).balanceOf(account);
                  const balanceOfB = await this.tokenB.connect(action.signer).balanceOf(account);
                  const balanceOfE = await eToken.connect(action.signer).balanceOf(account);
                  await this.ep.connect(action.signer).issueExact(eToken.address, action.eTokenAmount);
                  const _balanceOfA = await this.tokenA.connect(action.signer).balanceOf(account);
                  const _balanceOfB = await this.tokenB.connect(action.signer).balanceOf(account);
                  const _balanceOfE = await eToken.connect(action.signer).balanceOf(account);
                  const _ratio = await this.eph.connect(action.signer).currentRatio(this.ep.address, eToken.address);
                  const [_amountA, _amountB] = await this.eph.connect(action.signer).tokenATokenBForEToken(
                    this.ep.address, eToken.address, _balanceOfE
                  );
                  const eTokenAmount = await this.eph.connect(action.signer).eTokenForTokenATokenB(
                    this.ep.address, tranche.eToken, _amountA, _amountB
                  );
                  assert(this.roundEqual(ratio, _ratio));
                  assert(this.roundEqual(_balanceOfE, eTokenAmount));
                  assert(this.roundEqual(_balanceOfE.sub(balanceOfE), action.eTokenAmount));
                  assert(this.roundEqual(balanceOfA.sub(amountA), _balanceOfA));
                  assert(this.roundEqual(balanceOfB.sub(amountB), _balanceOfB));
                  break;
                }
                case 'rebalance': {
                  const tranches = await this.ep.connect(action.signer).getTranches();
                  assert(await tranches.find(async (t) => {
                    const eToken = new ethers.Contract(t.eToken, ETokenArtifact.abi) as EToken;
                    const ratio = await this.eph.connect(action.signer).currentRatio(this.ep.address, eToken.address);
                    return !this.roundEqual(ratio, t.targetRatio);
                  }));
                  await this.ep.connect(action.signer).rebalance();
                  for (const t of tranches) {
                    const eToken = new ethers.Contract(t.eToken, ETokenArtifact.abi) as EToken;
                    const ratio = await this.eph.connect(action.signer).currentRatio(this.ep.address, eToken.address);
                    assert(this.roundEqual(ratio, t.targetRatio));
                  }
                  break;
                }
                case 'redeemExact': {
                  const account = await action.signer.getAddress();
                  const tranche = (await this.ep.connect(action.signer).getTranches())[action.trancheIndex];
                  const eToken = new ethers.Contract(tranche.eToken, ETokenArtifact.abi) as EToken;
                  const ratio = await this.eph.connect(action.signer).currentRatio(this.ep.address, eToken.address);
                  const balanceOfA = await this.tokenA.connect(action.signer).balanceOf(account);
                  const balanceOfB = await this.tokenB.connect(action.signer).balanceOf(account);
                  const balanceOfE = await eToken.connect(action.signer).balanceOf(account);
                  const [amountA, amountB] = await this.eph.connect(action.signer).tokenATokenBForEToken(
                    this.ep.address, eToken.address, action.eTokenAmount
                  );
                  const [feeA, feeB] = await this.eph.connect(action.signer).feeAFeeBForEToken(this.ep.address, tranche.eToken, action.eTokenAmount);
                  const [amountANet, amountBNet] = [amountA.sub(feeA), amountB.sub(feeB)];
                  await expect(
                    this.ep.connect(action.signer).redeemExact(eToken.address, action.eTokenAmount)
                  ).to.emit(this.ep, 'RedeemedEToken').withArgs(eToken.address, action.eTokenAmount, amountANet, amountBNet, account);
                  const _ratio = await this.eph.connect(action.signer).currentRatio(this.ep.address, eToken.address);
                  const { reserveA, reserveB } = await this.ep.connect(action.signer).tranches(eToken.address);
                  const _balanceOfA = await this.tokenA.connect(action.signer).balanceOf(account);
                  const _balanceOfB = await this.tokenB.connect(action.signer).balanceOf(account);
                  const _balanceOfE = await eToken.connect(action.signer).balanceOf(account);
                  assert(this.roundEqual(ratio, _ratio));
                  assert(this.roundEqual(tranche.reserveA.sub(amountA), reserveA));
                  assert(this.roundEqual(tranche.reserveB.sub(amountB), reserveB));
                  assert(this.roundEqual(balanceOfA.add(amountANet), _balanceOfA));
                  assert(this.roundEqual(balanceOfB.add(amountBNet), _balanceOfB));
                  assert(this.roundEqual(balanceOfE.sub(action.eTokenAmount), _balanceOfE));
                  break;
                }
                case 'setAnswer': {
                  await this.aggregator.connect(action.signer).setAnswer(action.rate);
                  break;
                }
                case 'collectFee': {
                  const feesOwner = await action.signer.getAddress();
                  const cumulativeFeeA = await this.ep.connect(action.signer).cumulativeFeeA();
                  const cumulativeFeeB = await this.ep.connect(action.signer).cumulativeFeeB();
                  const balanceOfA = await this.tokenA.connect(action.signer).balanceOf(feesOwner);
                  const balanceOfB = await this.tokenB.connect(action.signer).balanceOf(feesOwner);
                  await expect(
                    this.ep.connect(action.signer).transferFees()
                  ).to.emit(this.ep, 'TransferFees').withArgs(feesOwner, cumulativeFeeA, cumulativeFeeB);
                  expect(await this.tokenA.connect(action.signer).balanceOf(feesOwner)).to.equal(cumulativeFeeA.add(balanceOfA));
                  expect(await this.tokenB.connect(action.signer).balanceOf(feesOwner)).to.equal(cumulativeFeeB.add(balanceOfB));
                  assert((await this.ep.connect(action.signer).cumulativeFeeA()).eq(0));
                  assert((await this.ep.connect(action.signer).cumulativeFeeB()).eq(0));
                  break;
                }
              }
            });
          });
        });
      });
    });
  });

  it('should run all scenarios successfully', function () { return });
});
