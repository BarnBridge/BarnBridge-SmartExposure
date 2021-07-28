// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.1;
pragma experimental ABIEncoderV2;

import "../EPoolLibrary.sol";

contract TestEPoolLibrary {
    function currentRatio(
        IEPool.Tranche memory t,
        uint256 rate,
        uint256 sFactorA,
        uint256 sFactorB
    ) external pure returns(uint256) {
        return EPoolLibrary.currentRatio(t, rate, sFactorA, sFactorB);
    }

    function trancheDelta(
        IEPool.Tranche memory t,
        uint256 rate,
        uint256 sFactorA,
        uint256 sFactorB
    ) external pure returns (uint256 deltaA, uint256 deltaB, uint256 rChange, uint256 rDiv) {
        return EPoolLibrary.trancheDelta(t, rate, sFactorA, sFactorB);
    }

    function delta(
        IEPool.Tranche[] memory ts,
        uint256 rate,
        uint256 sFactorA,
        uint256 sFactorB
    ) external pure returns (uint256 deltaA, uint256 deltaB, uint256 rChange) {
        return EPoolLibrary.delta(ts, rate, sFactorA, sFactorB);
    }

    function eTokenForTokenATokenB(
        IEPool.Tranche memory t,
        uint256 amountA,
        uint256 amountB,
        uint256 rate,
        uint256 sFactorA,
        uint256 sFactorB
    ) external view returns (uint256) {
        return EPoolLibrary.eTokenForTokenATokenB(t, amountA, amountB, rate, sFactorA, sFactorB);
    }

    function tokenATokenBForEToken(
        IEPool.Tranche memory t,
        uint256 amount,
        uint256 rate,
        uint256 sFactorA,
        uint256 sFactorB
    ) external view returns (uint256 amountA, uint256 amountB) {
        return EPoolLibrary.tokenATokenBForEToken(t, amount, rate, sFactorA, sFactorB);
    }

    function tokenAForTokenB(
        uint256 amountB,
        uint256 ratio,
        uint256 rate,
        uint256 sFactorA,
        uint256 sFactorB
    ) external pure returns(uint256) {
        return EPoolLibrary.tokenAForTokenB(amountB, ratio, rate, sFactorA, sFactorB);
    }

    function tokenBForTokenA(
        uint256 amountA,
        uint256 ratio,
        uint256 rate,
        uint256 sFactorA,
        uint256 sFactorB
    ) external pure returns(uint256) {
        return EPoolLibrary.tokenBForTokenA(amountA, ratio, rate, sFactorA, sFactorB);
    }

    function tokenATokenBForTokenA(
        uint256 _totalA,
        uint256 ratio,
        uint256 rate,
        uint256 sFactorA,
        uint256 sFactorB
    ) external pure returns (uint256 amountA, uint256 amountB) {
        return EPoolLibrary.tokenATokenBForTokenA(_totalA, ratio, rate, sFactorA, sFactorB);
    }

    function tokenATokenBForTokenB(
        uint256 _totalB,
        uint256 ratio,
        uint256 rate,
        uint256 sFactorA,
        uint256 sFactorB
    ) external pure returns (uint256 amountA, uint256 amountB) {
        return EPoolLibrary.tokenATokenBForTokenB(_totalB, ratio, rate, sFactorA, sFactorB);
    }

    function totalA(
        uint256 amountA,
        uint256 amountB,
        uint256 rate,
        uint256 sFactorA,
        uint256 sFactorB
    ) external pure returns (uint256) {
        return EPoolLibrary.totalA(amountA, amountB, rate, sFactorA, sFactorB);
    }

    function totalB(
        uint256 amountA,
        uint256 amountB,
        uint256 rate,
        uint256 sFactorA,
        uint256 sFactorB
    ) external pure returns (uint256) {
        return EPoolLibrary.totalB(amountA, amountB, rate, sFactorA, sFactorB);
    }

    function feeAFeeBForTokenATokenB(
        uint256 amountA,
        uint256 amountB,
        uint256 feeRate
    ) external pure returns (uint256 feeA, uint256 feeB) {
        return EPoolLibrary.feeAFeeBForTokenATokenB(amountA, amountB, feeRate);
    }
}
