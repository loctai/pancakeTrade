import {
    Fetcher,
    Percent,
    Route,
    Token,
    TokenAmount,
    Trade,
    TradeType,
    WETH,
} from '@pancakeswap/sdk'

import { ethers } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import tokenABI from '../utils/abi/token.json'
import { TradeModal, LogModal, HistoryModal } from '../utils/db'
import { sendMessage } from '../utils/notification'

import {
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
} from '../utils/wallet'

const sellToken = async (trade, coin, tokenAmount, currentPrice) => {
    try {
        // Check the SWAP TOKEN
        let SWAPTOKEN = WETH[chainID]
        if (coin.base === 'BUSD') {
            SWAPTOKEN = BUSD
        }

        const tokenContract = new ethers.Contract(
            coin.address,
            tokenABI,
            wallet
        )

        // Get amount to sell
        const amountIn = ethers.utils.parseUnits(
            tokenAmount.toString(),
            coin.decimal
        )

        const TOKEN = new Token(chainID, coin.address, coin.decimal, coin.name)

        const pair = await Fetcher.fetchPairData(TOKEN, SWAPTOKEN, provider)

        const route = new Route([pair], TOKEN, SWAPTOKEN)

        const tradeData = new Trade(
            route,
            new TokenAmount(TOKEN, amountIn),
            TradeType.EXACT_INPUT
        )

        const slippageTolerance = new Percent(slippage.toString(), '100')

        const amountOutMin = tradeData.minimumAmountOut(slippageTolerance).raw
        const amountOutMinFinal = new ethers.BigNumber.from(
            String(amountOutMin)
        )

        const path = []

        for (let px of route.path) {
            path.push(px.address)
        }

        const deadline = Math.floor(Date.now() / 1000) + 60 * 10

        const value = tradeData.inputAmount.raw
        const amountInFinal = new ethers.BigNumber.from(String(value))

        /**********************************
         * Pre-check before SWAP
         ***********************************
         */
        // Check allowance
        const allowance = await tokenContract.allowance(
            wallet.address,
            pancakeSwapContractAddress
        )
        if (allowance.lt(amountIn)) {
            const approved = await tokenContract.approve(
                pancakeSwapContractAddress,
                new ethers.BigNumber.from(maxAllowance),
                {
                    gasLimit: gasLimit,
                    gasPrice: 5 * GWEI,
                }
            )
            await provider.once(approved.hash, () => {
                console.log('Approved...')
            })
        }

        // Check Balance
        const balance = await tokenContract.balanceOf(wallet.address)
        if (balance.lt(amountInFinal)) {
            const msg = `Low balance ${formatUnits(
                balance,
                coin.decimal
            )} < ${formatUnits(amountInFinal, coin.decimal)} while selling ${
                coin.name
            }`
            await updateErrorStatus(trade, coin, msg)
            return
        }

        /**********************************
         * Sell token
         ***********************************
         */

        const sold = await pancakeSwapContract.swapExactTokensForTokens(
            amountInFinal,
            amountOutMinFinal,
            path,
            wallet.address,
            deadline,
            {
                gasLimit: gasLimit,
                gasPrice: 5 * GWEI,
            }
        )

        await sold.wait()

        await updateSoldStatus(trade, coin, tokenAmount, currentPrice)
    } catch (e) {
        const msg = `Error on token sell! ${tokenAmount} ${coin.name} at ${currentPrice} ${coin.name}`
        await updateErrorStatus(trade, coin, msg, e)
    }
}

const updateSoldStatus = async (trade, coin, tokenAmount, currentPrice) => {
    const tradeInDB = await TradeModal.findOne({ _id: trade._id })
    tradeInDB.status = 'COMPLETED'
    await tradeInDB.save()

    // Update history
    const history = await HistoryModal.findOne({ tradeId: trade._id })
    if (history) {
        history.sold = currentPrice
        history.profit = currentPrice - history.bought
        history.save()
    }

    const msg = `Sold ${tokenAmount} ${coin.name} at ${currentPrice} ${coin.name}`
    console.log(msg)
    await sendMessage(`${coin.name} sold`, msg)
}

const updateErrorStatus = async (trade, coin, msg, e = '') => {
    const newLog = new LogModal({ message: msg, details: e.toString() })
    newLog.save()
    console.log(msg, e)

    // Update status and send notification
    const tradeInDB = await TradeModal.findOne({ _id: trade._id })
    tradeInDB.status = 'ERROR'
    await tradeInDB.save()
    await sendMessage(`Error on selling ${coin.name}`, msg)
}

module.exports = { sellToken }
