// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;
pragma abicoder v2;

import { IUniswapV3Pool } from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import { IUniswapV3Factory } from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";

import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {TransferHelper} from "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import { ERC20 } from "../ERC20.sol";

/// @title Supervisor
/// @notice Strategy Supervisor with auto-reinvest feature for uni-v3 lp'ing
contract Supervisor is ERC20, Ownable {
    using SafeMath for uint256;

    address public immutable token0;
    address public immutable token1;
    uint24 public uniswapFee;
    IUniswapV3Pool public pool;

    int24 public lowerTick;
    int24 public upperTick;

    constructor(
        address _token0,
        address _token1,
        uint24 _uniswapFee,
        address _uniswapFactory
    ) {
        token0 = _token0;
        token1 = _token1;
        uniswapFee = _uniswapFee;

        IUniswapV3Factory uniswapFactory = IUniswapV3Factory(_uniswapFactory);
        address uniswapPool = IUniswapV3Factory(_uniswapFactory).getPool(_token0, _token1, _uniswapFee);
        require(uniswapPool != address(0));
        pool = IUniswapV3Pool(uniswapPool);
    }
}
