import { ethers } from 'hardhat';
import { assert, expect } from 'chai';

import ETokenArtifact from '../artifacts/contracts/EToken.sol/EToken.json';
import { EToken } from '../typechain';

import { environmentFixture, signersFixture } from './fixture';

const { utils: { parseUnits: toUnit } } = ethers;

describe('EPoolPeripheryV3 - Scenarios', function () {

  before(async function () {
    await signersFixture.bind(this)();
    await environmentFixture.bind(this)();
    if (!this.localRun) { this.skip(); }

    const scenarios = [
      {
        description: 'Issue and redeem for 2 users',
        initialRate: this.sFactorI.mul(1800),
        tranches: [
          { targetRatio: toUnit(String(30/70), this.decI), symbol: 'bb_ET_WETH30/DAI70', name: 'Barnbridge Exposure Token Wrapped-Ether 30% / DAI 70%' },
          { targetRatio: toUnit(String(50/50), this.decI), symbol: 'bb_ET_WETH50/DAI50', name: 'Barnbridge Exposure Token Wrapped-Ether 50% / DAI 50%' },
          { targetRatio: toUnit(String(70/30), this.decI), symbol: 'bb_ET_WETH70/DAI30', name: 'Barnbridge Exposure Token Wrapped-Ether 70% / DAI 30%' }
        ],
        actions: [
          { method: 'issueForMaxTokenA', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'setAnswer', rate: this.sFactorI.mul(1850), signer: this.signers.admin },
          { method: 'setRate', rate: this.sFactorI.mul(1850), signer: this.signers.admin },
          { method: 'issueForMaxTokenB', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 },
          { method: 'setAnswer', rate: this.sFactorI.mul(1830), signer: this.signers.admin },
          { method: 'setRate', rate: this.sFactorI.mul(1830), signer: this.signers.admin },
          { method: 'rebalance', deltaFrac: toUnit('1', this.decI), signer: this.signers.admin },
          { method: 'redeemForMinTokenA', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'redeemForMinTokenB', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 }
        ]
      },
      {
        description: 'Issue and redeem from multiple tranches',
        feeRate: toUnit('0.0', this.decI),
        initialRate: this.sFactorI.mul(1800),
        tranches: [
          { targetRatio: toUnit(String(30/70), this.decI), symbol: 'bb_ET_WETH30/DAI70', name: 'Barnbridge Exposure Token Wrapped-Ether 30% / DAI 70%' },
          { targetRatio: toUnit(String(50/50), this.decI), symbol: 'bb_ET_WETH50/DAI50', name: 'Barnbridge Exposure Token Wrapped-Ether 50% / DAI 50%' },
          { targetRatio: toUnit(String(70/30), this.decI), symbol: 'bb_ET_WETH70/DAI30', name: 'Barnbridge Exposure Token Wrapped-Ether 70% / DAI 30%' }
        ],
        actions: [
          { method: 'issueForMaxTokenA', trancheIndex: 1, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'issueForMaxTokenA', trancheIndex: 0, eTokenAmount: toUnit('0.5', this.decE), signer: this.signers.user },
          { method: 'issueForMaxTokenA', trancheIndex: 0, eTokenAmount: toUnit('0.5', this.decE), signer: this.signers.user },
          { method: 'setAnswer', rate: this.sFactorI.mul(1750), signer: this.signers.admin },
          { method: 'setRate', rate: this.sFactorI.mul(1750), signer: this.signers.admin },
          { method: 'issueForMaxTokenA', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 },
          { method: 'setAnswer', rate: this.sFactorI.mul(1400), signer: this.signers.admin },
          { method: 'setRate', rate: this.sFactorI.mul(1400), signer: this.signers.admin },
          { method: 'redeemForMinTokenA', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'rebalance', deltaFrac: toUnit('1', this.decI), signer: this.signers.admin },
          { method: 'issueForMaxTokenA', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'redeemForMinTokenA', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'redeemForMinTokenA', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 },
          { method: 'redeemForMinTokenA', trancheIndex: 1, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user }
        ]
      },
      {
        description: 'Investing into rising price, redeeming after fall',
        feeRate: toUnit('0.0', this.decI),
        initialRate: this.sFactorI.mul(100),
        tranches: [
          { targetRatio: toUnit(String(25/75), this.decI), symbol: 'bb_ET_WETH25/DAI75', name: 'Barnbridge Exposure Token Wrapped-Ether 25% / DAI 75%' },
          { targetRatio: toUnit(String(50/50), this.decI), symbol: 'bb_ET_WETH50/DAI50', name: 'Barnbridge Exposure Token Wrapped-Ether 50% / DAI 50%' },
          { targetRatio: toUnit(String(75/25), this.decI), symbol: 'bb_ET_WETH75/DAI25', name: 'Barnbridge Exposure Token Wrapped-Ether 75% / DAI 25%' }
        ],
        actions: [
          { method: 'issueForMaxTokenA', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'setAnswer', rate: this.sFactorI.mul(2000), signer: this.signers.admin },
          { method: 'setRate', rate: this.sFactorI.mul(2000), signer: this.signers.admin },
          { method: 'rebalance', deltaFrac: toUnit('1', this.decI), signer: this.signers.admin },
          { method: 'issueForMaxTokenA', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 },
          { method: 'setAnswer', rate: this.sFactorI.mul(500), signer: this.signers.admin },
          { method: 'setRate', rate: this.sFactorI.mul(500), signer: this.signers.admin },
          { method: 'rebalance', deltaFrac: toUnit('1', this.decI), signer: this.signers.admin },
          { method: 'redeemExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'redeemExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 }
        ]
      },
      {
        description: 'Investing into falling price, redeeming after rise',
        feeRate: toUnit('0.0', this.decI),
        initialRate: this.sFactorI.mul(1000),
        tranches: [
          { targetRatio: toUnit(String(25/75), this.decI), symbol: 'bb_ET_WETH25/DAI75', name: 'Barnbridge Exposure Token Wrapped-Ether 25% / DAI 75%' },
          { targetRatio: toUnit(String(50/50), this.decI), symbol: 'bb_ET_WETH50/DAI50', name: 'Barnbridge Exposure Token Wrapped-Ether 50% / DAI 50%' },
          { targetRatio: toUnit(String(75/25), this.decI), symbol: 'bb_ET_WETH75/DAI25', name: 'Barnbridge Exposure Token Wrapped-Ether 75% / DAI 25%' }
        ],
        actions: [
          { method: 'rebalance', deltaFrac: toUnit('1', this.decI), signer: this.signers.admin },
          { method: 'issueForMaxTokenA', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'setAnswer', rate: this.sFactorI.mul(100), signer: this.signers.admin },
          { method: 'setRate', rate: this.sFactorI.mul(100), signer: this.signers.admin },
          { method: 'rebalance', deltaFrac: toUnit('1', this.decI), signer: this. signers.admin },
          { method: 'issueForMaxTokenA', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 },
          { method: 'setAnswer', rate: this.sFactorI.mul(500), signer: this.signers.admin },
          { method: 'setRate', rate: this.sFactorI.mul(500), signer: this.signers.admin },
          { method: 'redeemExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'redeemExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 }
        ]
      },
      {
        description: 'Redeeming before and after rebalance, falling price',
        feeRate: toUnit('0.0', this.decI),
        initialRate: this.sFactorI.mul(1000),
        tranches: [
          { targetRatio: toUnit(String(25/75), this.decI), symbol: 'bb_ET_WETH25/DAI75', name: 'Barnbridge Exposure Token Wrapped-Ether 25% / DAI 75%' },
          { targetRatio: toUnit(String(50/50), this.decI), symbol: 'bb_ET_WETH50/DAI50', name: 'Barnbridge Exposure Token Wrapped-Ether 50% / DAI 50%' },
          { targetRatio: toUnit(String(75/25), this.decI), symbol: 'bb_ET_WETH75/DAI25', name: 'Barnbridge Exposure Token Wrapped-Ether 75% / DAI 25%' }
        ],
        actions: [
          { method: 'issueForMaxTokenA', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'issueForMaxTokenA', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 },
          { method: 'setAnswer', rate: this.sFactorI.mul(100), signer: this.signers.admin },
          { method: 'setRate', rate: this.sFactorI.mul(100), signer: this.signers.admin },
          { method: 'redeemExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'rebalance', deltaFrac: toUnit('1', this.decI), signer: this.signers.admin },
          { method: 'redeemExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 },
          { method: 'rebalance', deltaFrac: toUnit('1', this.decI), signer: this.signers.admin }
        ]
      },
      {
        description: 'Redeeming before and after rebalance, rising price',
        feeRate: toUnit('0.0', this.decI),
        initialRate: this.sFactorI.mul(100),
        tranches: [
          { targetRatio: toUnit(String(25/75), this.decI), symbol: 'bb_ET_WETH25/DAI75', name: 'Barnbridge Exposure Token Wrapped-Ether 25% / DAI 75%' },
          { targetRatio: toUnit(String(50/50), this.decI), symbol: 'bb_ET_WETH50/DAI50', name: 'Barnbridge Exposure Token Wrapped-Ether 50% / DAI 50%' },
          { targetRatio: toUnit(String(75/25), this.decI), symbol: 'bb_ET_WETH75/DAI25', name: 'Barnbridge Exposure Token Wrapped-Ether 75% / DAI 25%' }
        ],
        actions: [
          { method: 'issueForMaxTokenA', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'issueForMaxTokenA', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 },
          { method: 'setAnswer', rate: this.sFactorI.mul(2000), signer: this.signers.admin },
          { method: 'setRate', rate: this.sFactorI.mul(2000), signer: this.signers.admin },
          { method: 'redeemExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user },
          { method: 'rebalance', deltaFrac: toUnit('1', this.decI), signer: this.signers.admin },
          { method: 'redeemExact', trancheIndex: 0, eTokenAmount: toUnit('1', this.decE), signer: this.signers.user2 },
          { method: 'rebalance', deltaFrac: toUnit('1', this.decI), signer: this.signers.admin }
        ]
      }
    ];

    scenarios.forEach((scenario: any, index: number) => {
      describe('Scenario #' + index + ': ' + scenario.description, function () {
        before(async function () {
          await signersFixture.bind(this)();
          await environmentFixture.bind(this)();

          await Promise.all([
            this.tokenA.connect(this.signers.admin).mint(this.accounts.admin, this.sFactorA.mul(100000)),
            this.tokenB.connect(this.signers.admin).mint(this.accounts.admin, this.sFactorB.mul(100000)),
            this.tokenA.connect(this.signers.admin).approve(this.ep.address, this.sFactorA.mul(100000)),
            this.tokenB.connect(this.signers.admin).approve(this.ep.address, this.sFactorB.mul(100000)),

            this.tokenA.connect(this.signers.admin).mint(this.accounts.user, this.sFactorA.mul(100000)),
            this.tokenB.connect(this.signers.admin).mint(this.accounts.user, this.sFactorB.mul(100000)),
            this.tokenA.connect(this.signers.user).approve(this.eppV3.address, this.sFactorA.mul(100000)),
            this.tokenB.connect(this.signers.user).approve(this.eppV3.address, this.sFactorB.mul(100000)),

            this.tokenA.connect(this.signers.admin).mint(this.accounts.user2, this.sFactorA.mul(100000)),
            this.tokenB.connect(this.signers.admin).mint(this.accounts.user2, this.sFactorB.mul(100000)),
            this.tokenA.connect(this.signers.user2).approve(this.eppV3.address, this.sFactorA.mul(100000)),
            this.tokenB.connect(this.signers.user2).approve(this.eppV3.address, this.sFactorB.mul(100000)),

            this.tokenA.connect(this.signers.admin).mint(this.routerV3.address, this.sFactorA.mul(100000)),
            this.tokenB.connect(this.signers.admin).mint(this.routerV3.address, this.sFactorB.mul(100000)),

            // initial exchange rate
            this.aggregator.connect(this.signers.admin).setAnswer(scenario.initialRate),
            this.routerV3.connect(this.signers.admin).setRate(scenario.initialRate),
            // set controller
            this.controller.connect(this.signers.admin).setFeesOwner(this.accounts.feesOwner)
          ]);

          await Promise.all(scenario.tranches.map(async (tranche: any) => {
            await this.ep.connect(this.signers.admin).addTranche(tranche.targetRatio, tranche.name, tranche.symbol);
          }));
        });

        describe('#setEPoolApproval', function () {
          it('should approve all tranches', async function () {
            await this.eppV3.connect(this.signers.admin).setEPoolApproval(this.ep.address, true);
            expect(await this.eppV3.connect(this.signers.admin).ePools(this.ep.address)).to.equal(true);
          });
        });

        describe('should execute all actions', function () {
          scenario.actions.forEach((action: any) => {
            it('#' + action.method, async function () {
              switch (action.method) {
                case 'issueForMaxTokenA': {
                  const tranche = (await this.ep.connect(action.signer).getTranches())[action.trancheIndex];
                  const eToken = new ethers.Contract(tranche.eToken, ETokenArtifact.abi) as EToken;
                  const [amountA, amountB] = await this.eph.connect(action.signer).tokenATokenBForEToken(this.ep.address, eToken.address, action.eTokenAmount);
                  const rate = await this.ep.connect(action.signer).getRate();
                  const _totalA = amountA.add(amountB.mul(this.sFactorI).div(rate).mul(this.sFactorA).div(this.sFactorB));
                  const totalA = await this.eph.connect(action.signer).totalA(this.ep.address, amountA, amountB);
                  assert(_totalA.eq(totalA));
                  const eTokenAmount = await this.eppV3.connect(this.signers.user).eTokenForMinInputAmountA_Unsafe(this.ep.address, tranche.eToken, totalA);
                  assert(this.roundEqual(eTokenAmount, action.eTokenAmount));
                  const balanceOf = await eToken.connect(action.signer).balanceOf(await action.signer.getAddress());
                  const deadline = (await ethers.provider.getBlock('latest')).timestamp + 600;
                  const receipt = await (await this.eppV3.connect(action.signer).issueForMaxTokenA(
                    this.ep.address, eToken.address, action.eTokenAmount, totalA, deadline
                  )).wait();
                  const IssuanceEvent = new ethers.utils.Interface([this.eppV3.interface.getEvent('IssuedEToken')]);
                  const event = receipt.events?.find((event: any) => {
                    try { IssuanceEvent.parseLog(event); return true; } catch(error) { return false; }
                  });
                  if (event === undefined) { return assert(false); }
                  const result = IssuanceEvent.parseLog(event);
                  assert(
                    result.args.ePool === this.ep.address
                    && result.args.eToken === tranche.eToken
                    && result.args.amount.eq(action.eTokenAmount)
                    && result.args.user === await action.signer.getAddress()
                  );
                  const _balanceOf = await eToken.connect(action.signer).balanceOf(await action.signer.getAddress());
                  assert(action.eTokenAmount.eq(_balanceOf.sub(balanceOf)));
                  break;
                }
                case 'issueForMaxTokenB': {
                  const tranche = (await this.ep.connect(action.signer).getTranches())[action.trancheIndex];
                  const eToken = new ethers.Contract(tranche.eToken, ETokenArtifact.abi) as EToken;
                  const [amountA, amountB] = await this.eph.connect(action.signer).tokenATokenBForEToken(this.ep.address, eToken.address, action.eTokenAmount);
                  const rate = await this.ep.connect(action.signer).getRate();
                  const _totalB = amountB.add(amountA.mul(rate).div(this.sFactorI).mul(this.sFactorB).div(this.sFactorA));
                  const totalB = await this.eph.connect(action.signer).totalB(this.ep.address, amountA, amountB);
                  assert(_totalB.eq(totalB));
                  const eTokenAmount = await this.eppV3.connect(this.signers.user).eTokenForMinInputAmountB_Unsafe(this.ep.address, tranche.eToken, totalB);
                  assert(this.roundEqual(eTokenAmount, action.eTokenAmount));
                  const balanceOf = await eToken.connect(action.signer).balanceOf(await action.signer.getAddress());
                  const deadline = (await ethers.provider.getBlock('latest')).timestamp + 600;
                  const receipt = await (await this.eppV3.connect(action.signer).issueForMaxTokenB(
                    this.ep.address, eToken.address, action.eTokenAmount, totalB, deadline
                  )).wait();
                  const IssuanceEvent = new ethers.utils.Interface([this.eppV3.interface.getEvent('IssuedEToken')]);
                  const event = receipt.events?.find((event: any) => {
                    try { IssuanceEvent.parseLog(event); return true; } catch(error) { return false; }
                  });
                  if (event === undefined) { return assert(false); }
                  const result = IssuanceEvent.parseLog(event);
                  assert(
                    result.args.ePool === this.ep.address
                    && result.args.eToken === tranche.eToken
                    && result.args.amount.eq(action.eTokenAmount)
                    && result.args.user === await action.signer.getAddress()
                  );
                  const _balanceOf = await eToken.connect(action.signer).balanceOf(await action.signer.getAddress());
                  assert(action.eTokenAmount.eq(_balanceOf.sub(balanceOf)));
                  break;
                }
                case 'rebalance': {
                  const tranches = await this.ep.connect(action.signer).getTranches();
                  assert(await tranches.find(async (t) => {
                    const eToken = new ethers.Contract(t.eToken, ETokenArtifact.abi) as EToken;
                    const ratio = await this.eph.connect(action.signer).currentRatio(this.ep.address, eToken.address);
                    return !this.roundEqual(ratio, t.targetRatio);
                  }));
                  await this.ep.connect(action.signer).rebalance(action.deltaFrac);
                  for (const t of tranches) {
                    const eToken = new ethers.Contract(t.eToken, ETokenArtifact.abi) as EToken;
                    const ratio = await this.eph.connect(action.signer).currentRatio(this.ep.address, eToken.address);
                    assert(this.roundEqual(ratio, t.targetRatio));
                  }
                  break;
                }
                case 'redeemForMinTokenA': {
                  const tranche = (await this.ep.connect(action.signer).getTranches())[action.trancheIndex];
                  const eToken = new ethers.Contract(tranche.eToken, ETokenArtifact.abi) as EToken;
                  const [amountA, amountB] = await this.eph.connect(action.signer).tokenATokenBForEToken(
                    this.ep.address, eToken.address, action.eTokenAmount
                  );
                  const rate = (await this.ep.connect(action.signer).getRate());
                  const totalA = amountA.add(amountB.mul(this.sFactorI).div(rate).mul(this.sFactorA).div(this.sFactorB));
                  const balanceOf = await eToken.connect(action.signer).balanceOf(await action.signer.getAddress());
                  await eToken.connect(action.signer).approve(this.eppV3.address, action.eTokenAmount );
                  const deadline = (await ethers.provider.getBlock('latest')).timestamp + 600;
                  const receipt = await (await this.eppV3.connect(action.signer).redeemForMinTokenA(
                    this.ep.address, eToken.address, action.eTokenAmount, totalA, deadline
                  )).wait();
                  const RedemptionEvent = new ethers.utils.Interface([this.eppV3.interface.getEvent('RedeemedEToken')]);
                  const event = receipt.events?.find((event: any) => {
                    try { RedemptionEvent.parseLog(event); return true; } catch(error) { return false; }
                  });
                  if (event === undefined) { return assert(false); }
                  const result = RedemptionEvent.parseLog(event);
                  assert(
                    result.args.ePool === this.ep.address
                    && result.args.eToken === tranche.eToken
                    && result.args.amount.eq(action.eTokenAmount)
                    && result.args.user === await action.signer.getAddress()
                  );
                  const _balanceOf = await eToken.connect(action.signer).balanceOf(await action.signer.getAddress());
                  assert(action.eTokenAmount.eq(balanceOf.sub(_balanceOf)));
                  break;
                }
                case 'redeemForMinTokenB': {
                  const tranche = (await this.ep.connect(action.signer).getTranches())[action.trancheIndex];
                  const eToken = new ethers.Contract(tranche.eToken, ETokenArtifact.abi) as EToken;
                  const [amountA, amountB] = await this.eph.connect(action.signer).tokenATokenBForEToken(
                    this.ep.address, eToken.address, action.eTokenAmount
                  );
                  const rate = (await this.ep.connect(action.signer).getRate());
                  const totalB = amountB.add(amountA.mul(rate).div(this.sFactorI).mul(this.sFactorB).div(this.sFactorA));
                  const balanceOf = await eToken.connect(action.signer).balanceOf(await action.signer.getAddress());
                  await eToken.connect(action.signer).approve(this.eppV3.address, action.eTokenAmount );
                  const deadline = (await ethers.provider.getBlock('latest')).timestamp + 600;
                  const receipt = await (await this.eppV3.connect(action.signer).redeemForMinTokenB(
                    this.ep.address, eToken.address, action.eTokenAmount, totalB, deadline
                  )).wait();
                  const RedemptionEvent = new ethers.utils.Interface([this.eppV3.interface.getEvent('RedeemedEToken')]);
                  const event = receipt.events?.find((event: any) => {
                    try { RedemptionEvent.parseLog(event); return true; } catch(error) { return false; }
                  });
                  if (event === undefined) { return assert(false); }
                  const result = RedemptionEvent.parseLog(event);
                  assert(
                    result.args.ePool === this.ep.address
                    && result.args.eToken === tranche.eToken
                    && result.args.amount.eq(action.eTokenAmount)
                    && result.args.user === await action.signer.getAddress()
                  );
                  const _balanceOf = await eToken.connect(action.signer).balanceOf(await action.signer.getAddress());
                  assert(action.eTokenAmount.eq(balanceOf.sub(_balanceOf)));
                  break;
                }
                case 'setAnswer': {
                  await this.aggregator.connect(action.signer).setAnswer(action.rate);
                  break;
                }
                case 'setRate': {
                  await this.routerV3.connect(this.signers.admin).setRate(action.rate);
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
