import { ethers } from 'hardhat';
import { expect } from 'chai';
import { constants, Wallet, BigNumberish } from 'ethers';
import { formatEther, parseUnits, randomBytes } from 'ethers/lib/utils'
import { deployContract, signPermission, signPermitEIP2612, increaseTime } from './utils'
const bn = require('bignumber.js');

function encodePriceSqrt(reserve1: BigNumberish, reserve0: BigNumberish) {
  return new bn(reserve1.toString())
              .div(reserve0.toString())
              .sqrt()
              .multipliedBy(new bn(2).pow(96))
              .integerValue(3)
              .toString()
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
    let uniswapFactory = await ethers.getContractAt('IUniswapV3Factory', _uniswapFactory.address);
    await uniswapFactory.createPool(token0.address, token1.address, '3000');
    const uniswapPoolAddress = await uniswapFactory.getPool(token0.address, token1.address, '3000');
    let uniswapPool = await ethers.getContractAt('IUniswapV3Pool', uniswapPoolAddress);
    await uniswapPool.initialize(encodePriceSqrt('1', '1'));

    const Supervisor = await ethers.getContractFactory("Supervisor");
    const supervisor = await Supervisor.deploy(token0.address, token1.address, '3000', uniswapFactory.address);
    expect(await supervisor.pool()).to.equal(uniswapPoolAddress);
  });
});
