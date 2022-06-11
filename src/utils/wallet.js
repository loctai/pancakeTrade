import { ChainId, Token, Route, Fetcher } from '@pancakeswap/sdk'
import { ethers } from 'ethers'
require('dotenv').config()
import tokenABI from './abi/token.json'
import swapABI from './abi/swap.json'

// BINANCE SMART CHAIN
const provider = new ethers.providers.JsonRpcProvider(
    'https://bsc-dataseed.binance.org/',
    { name: 'Smart Chain', chainId: 56 }
)

const pancakeSwapContractAddress = '0x10ED43C718714eb63d5aA57B78B54704E256024E'

// ROPSTEN NETWORK
// const provider = ethers.getDefaultProvider(
//   "ropsten",
//   "GHG4E1DKJUKICUYJWQSYRM3385MDYRRDP1"
// );
// const pancakeSwapContractAddress = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

const pancakeSwapContract = new ethers.Contract(
    pancakeSwapContractAddress,
    swapABI,
    wallet
)

const chainID = ChainId.MAINNET

const slippage = 2

const maxAllowance = '1000000000000000000000000'

const gasLimit = 300000

const GWEI = 1000 * 1000 * 1000

const BUSD = new Token(
    chainID,
    '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    18,
    'BUSD',
    'BUSD'
)

module.exports = {
    provider,
    wallet,
    pancakeSwapContract,
    pancakeSwapContractAddress,
    chainID,
    maxAllowance,
    gasLimit,
    slippage,
    GWEI,
    BUSD,
}
