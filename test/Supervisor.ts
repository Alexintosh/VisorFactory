import { ethers } from 'hardhat';
import { expect } from 'chai';
import { constants, Wallet, BigNumberish, BigNumber } from 'ethers';
import { formatEther, parseUnits, randomBytes } from 'ethers/lib/utils'
import { deployContract, signPermission, signPermitEIP2612, increaseTime } from './utils'
const bn = require('bignumber.js');
/*
// Uniswap's version
function encodePriceSqrt(reserve1: BigNumberish, reserve0: BigNumberish): BigNumber {
  return BigNumber.from(
    new bn(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      .multipliedBy(new bn(2).pow(96))
      .integerValue(3)
      .toString()
  )
}
*/
function encodePriceSqrt(reserve1: BigNumberish, reserve0: BigNumberish) {
  return new bn(reserve1.toString())
              .div(reserve0.toString())
              .sqrt()
              .multipliedBy(new bn(2).pow(96))
}

describe("Supervisor", function() {
  it("Supervisor should find appropriate pool", async function() {
    const [owner] = await ethers.getSigners();

    // Deploy tokens for staking and rewards
    // TODO make this better
    const Token0 = await ethers.getContractFactory("StakingToken");
    const Token1 = await ethers.getContractFactory("RewardToken");

    const token0 = await Token0.deploy(owner.address);
    const token1 = await Token1.deploy(owner.address);

    const UniswapV3Factory = await ethers.getContractFactory('UniswapV3Factory');
    const _uniswapFactory = await UniswapV3Factory.deploy();
    let uniswapFactory = await ethers.getContractAt('UniswapV3Factory', _uniswapFactory.address);
    await uniswapFactory.createPool(token0.address, token1.address, '3000');
    const uniswapPoolAddress = await uniswapFactory.getPool(token0.address, token1.address, '3000');
    let uniswapPool = await ethers.getContractAt('UniswapV3Pool', uniswapPoolAddress);

    await uniswapPool.initialize((BigNumber.from(2)).pow(96));

    const Supervisor = await ethers.getContractFactory("Supervisor");
    console.log(token0.address, token1.address, '3000', uniswapFactory.address)

    const supervisor = await Supervisor.deploy(token0.address, token1.address, '3000', uniswapFactory.address);
    expect(await supervisor.pool()).to.equal(uniswapPoolAddress);

    await token0.transfer(supervisor.address, 100000000);
    await token1.transfer(supervisor.address, 100000000);

    // add liquidity to pool
    await uniswapPool.mint(owner.address, 10, 100, 1, supervisor.address)
  });
});
