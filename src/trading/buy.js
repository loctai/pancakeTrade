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

import { BigNumber, ethers } from 'ethers'
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

const buyToken = async (trade, coin, tokenAmount, currentPrice) => {
    try {
        // Get the SWAP token
        let SWAPTOKEN = WETH[chainID]
        if (coin.base === 'BUSD') {
            SWAPTOKEN = BUSD
        }

        const tokenContract = new ethers.Contract(
            SWAPTOKEN.address,
            tokenABI,
            wallet
        )

        // Get amountOut
        const amountOut = ethers.utils.parseUnits(
            tokenAmount.toString(),
            coin.decimal
        )

        const TOKEN = new Token(chainID, coin.address, coin.decimal, coin.name)

        const pair = await Fetcher.fetchPairData(SWAPTOKEN, TOKEN, provider)

        const route = new Route([pair], SWAPTOKEN, TOKEN)

        const tradeData = new Trade(
            route,
            new TokenAmount(TOKEN, amountOut),
            TradeType.EXACT_OUTPUT
        )

        const slippageTolerance = new Percent(slippage.toString(), '100')

        const amountInMax = tradeData.maximumAmountIn(slippageTolerance).raw
        const amountInMaxFinal = new ethers.BigNumber.from(String(amountInMax))

        const path = []

        for (let px of route.path) {
            path.push(px.address)
        }

        const deadline = Math.floor(Date.now() / 1000) + 60 * 10

        const value = String(tradeData.outputAmount.raw)
        const amountOutFinal = new ethers.BigNumber.from(String(value))

        /**********************************
         * Pre-check before SWAP
         ***********************************
         */
        // Check allowance
        const allowance = await tokenContract.allowance(
            wallet.address,
            pancakeSwapContractAddress
        )
        if (allowance.lt(amountInMaxFinal)) {
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
        // Check balance
        const balance = await tokenContract.balanceOf(wallet.address)
        if (balance.lt(amountInMaxFinal)) {
            const msg = `Low balance ${formatUnits(
                balance,
                coin.decimal
            )} < ${formatUnits(amountInMaxFinal, coin.decimal)} while buying ${
                coin.name
            }`
            await updateErrorStatus(trade, coin, msg)
            return
        }

        /**********************************
         * Buy token
         ***********************************
         */

        const bought = await pancakeSwapContract.swapTokensForExactTokens(
            amountOutFinal,
            amountInMaxFinal,
            path,
            wallet.address,
            deadline,
            {
                gasLimit: gasLimit,
                gasPrice: 5 * GWEI,
            }
        )

        await bought.wait()
        await updateBoughtStatus(trade, coin, tokenAmount, currentPrice)
    } catch (e) {
        const msg = `Error on token buy! ${tokenAmount} ${coin.name} at ${currentPrice} ${coin.name}`
        await updateErrorStatus(trade, coin, msg, e)
    }
}

const updateBoughtStatus = async (trade, coin, tokenAmount, currentPrice) => {
    const tradeInDB = await TradeModal.findOne({ _id: trade._id })
    tradeInDB.status = 'SELLING'
    await tradeInDB.save()

    // Save in history
    const history = new HistoryModal({
        tradeId: trade._id,
        bought: currentPrice,
    })
    history.save()

    const msg = `Bought ${tokenAmount} ${coin.name} at ${currentPrice} ${coin.name}`
    console.log(msg)
    await sendMessage(`${coin.name} bought`, msg)
}

const updateErrorStatus = async (trade, coin, msg, e = '') => {
    const newLog = new LogModal({ message: msg, details: e.toString() })
    newLog.save()
    console.log(msg, e)

    // Update status and send notification
    const tradeInDB = await TradeModal.findOne({ _id: trade._id })
    tradeInDB.status = 'ERROR'
    await tradeInDB.save()
    await sendMessage(`Error on buying ${coin.name}`, msg)
}

module.exports = { buyToken }
