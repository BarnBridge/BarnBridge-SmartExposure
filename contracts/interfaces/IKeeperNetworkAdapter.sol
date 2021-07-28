// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.1;

import "./IEPool.sol";
import "./IEPoolHelper.sol";
import "./IEPoolPeriphery.sol";
import "./IKeeperCompatibleInterface.sol";

interface IKeeperNetworkAdapter is KeeperCompatibleInterface {

    function getController() external view returns (address);

    function setController(address _controller) external returns (bool);

    function ePool() external returns (IEPool);

    function ePoolHelper() external returns (IEPoolHelper);

    function ePoolPeriphery() external returns (IEPoolPeriphery);

    function keeperRebalanceInterval() external returns(uint256);

    function lastKeeperRebalance() external returns(uint256);

    function setEPool(IEPool _ePool) external returns (bool);

    function setEPoolHelper(IEPoolHelper _ePoolHelper) external returns (bool);

    function setEPoolPeriphery(IEPoolPeriphery _ePoolPeriphery) external returns (bool);

    function setKeeperRebalanceInterval(uint256 interval) external returns (bool);
}
