require('dotenv').config()
import { formatEther, formatUnits } from '@ethersproject/units'
import { Route, Token, Fetcher, WETH } from '@pancakeswap/sdk'
import { ethers } from 'ethers'
import tokenABI from './abi/token.json'
import { wallet, chainID, provider, BUSD } from './wallet'

const getTokenPriceAndBalance = async (token) => {
    const tokenContract = new ethers.Contract(token.address, tokenABI, wallet)

    const bnbContract = new ethers.Contract(
        WETH[chainID].address,
        tokenABI,
        wallet
    )
    const bnbBalance = await bnbContract.balanceOf(wallet.address)

    const busdContract = new ethers.Contract(BUSD.address, tokenABI, wallet)
    const busdBalance = await busdContract.balanceOf(wallet.address)

    const balance = await tokenContract.balanceOf(wallet.address)
    const pairBUSD = await Fetcher.fetchPairData(BUSD, WETH[chainID], provider)
    const routeBUSD = new Route([pairBUSD], WETH[chainID])
    const bnbInUsd = routeBUSD.midPrice.toSignificant(6)

    let price = 0
    if (token.name !== 'BNB') {
        const TOKEN = new Token(
            chainID,
            token.address,
            token.decimal,
            token.name
        )

        const pairBNB = await Fetcher.fetchPairData(
            WETH[chainID],
            TOKEN,
            provider
        )
        const routeBNB = new Route([pairBNB], TOKEN)
        const currentPrice = routeBNB.midPrice.toSignificant(6)
        price = currentPrice * bnbInUsd
    } else {
        price = bnbInUsd
    }
    return {
        balance: parseFloat(formatUnits(balance, token.decimal)),
        price: parseFloat(price),
        bnbPrice: parseFloat(bnbInUsd),
        bnbBalance: parseFloat(formatEther(bnbBalance)),
        busdBalance: parseFloat(formatEther(busdBalance)),
    }
}

// ********************************************
// Get Current Price
// ********************************************
const getCurrentPrice = async (coin) => {
    const TOKEN = new Token(chainID, coin.address, coin.decimal, coin.name)
    let currentPrice = 0

    // GET BNB to TOKEN Price
    if (coin.name !== 'BNB') {
        const pairBNB = await Fetcher.fetchPairData(
            WETH[chainID],
            TOKEN,
            provider
        )
        const routeBNB = new Route([pairBNB], TOKEN)
        const currentPriceBNB = routeBNB.midPrice.toSignificant(6)

        // GET BNB to BUSD Price
        const pairBUSD = await Fetcher.fetchPairData(
            BUSD,
            WETH[chainID],
            provider
        )
        const routeBUSD = new Route([pairBUSD], WETH[chainID])
        const currentPriceBUSD = routeBUSD.midPrice.toSignificant(6)

        currentPrice = currentPriceBNB * currentPriceBUSD
    } else {
        // GET BNB to BUSD Price
        const pairBUSD = await Fetcher.fetchPairData(
            BUSD,
            WETH[chainID],
            provider
        )
        const routeBUSD = new Route([pairBUSD], WETH[chainID])
        const currentPriceBUSD = routeBUSD.midPrice.toSignificant(6)

        currentPrice = currentPriceBUSD
    }

    // GET BUSD to TOKEN Price
    let currentPriceConversion = 0
    if (coin.base === 'BUSD') {
        const pairTokenBUSD = await Fetcher.fetchPairData(BUSD, TOKEN, provider)
        const routeTokenBUSD = new Route([pairTokenBUSD], TOKEN)
        const currentPriceTokenBUSD = routeTokenBUSD.midPrice.toSignificant(6)
        currentPriceConversion = currentPriceTokenBUSD
    } else {
        const pairBNB = await Fetcher.fetchPairData(
            WETH[chainID],
            TOKEN,
            provider
        )
        const routeBNB = new Route([pairBNB], TOKEN)
        const currentPriceBNB = routeBNB.midPrice.toSignificant(6)
        currentPriceConversion = currentPriceBNB
    }
    return { currentPrice, currentPriceConversion }
}

const timer = (ms) => new Promise((res) => setTimeout(res, ms))

export { getTokenPriceAndBalance, getCurrentPrice, timer }
