import { TradeModal, TokenModal, LogModal } from './utils/db'
import { getCurrentPrice, timer } from './utils/helpers'
import { sendMessage } from './utils/notification'
import { buyToken } from './trading/buy'
import { sellToken } from './trading/sell'

const startTheBot = async () => {
    const trades = await TradeModal.find()

    for await (let trade of trades) {
        // Wait for 10 seconds and proceed.
        await timer(1000 * 10)
        // Skip success trades..
        if (trade.status === 'COMPLETED' || trade.status === 'ERROR') continue

        const coin = await TokenModal.findOne({ _id: trade.tokenId })

        try {
            const { currentPrice, currentPriceConversion } =
                await getCurrentPrice(coin)

            const tokenAmount = parseFloat(trade.amount)
            const swapAmount = parseFloat(trade.amount * currentPriceConversion)

            if (
                trade.status === 'BUYING' &&
                trade.buyLimit > 0 &&
                currentPrice < trade.buyLimit
            ) {
                console.log(
                    `Start buying ${tokenAmount} ${coin.name} (${swapAmount} ${coin.base}) `
                )
                await buyToken(trade, coin, tokenAmount, currentPrice)
            } else if (
                trade.status === 'SELLING' &&
                ((trade.sellLimit > 0 && currentPrice > trade.sellLimit) ||
                    (trade.stopLossLimit > 0 &&
                        currentPrice < trade.stopLossLimit))
            ) {
                console.log(
                    `Start selling ${tokenAmount} ${coin.name} (${swapAmount} ${coin.base}) `
                )
                await sellToken(trade, coin, tokenAmount, currentPrice)
            }
        } catch (e) {
            const errStr = e.toString()
            if (errStr.includes('getReserves()')) {
                const msg = `No token pair found for ${coin.name}.`
                await sendMessage(
                    `Error on ${coin.name}-${coin.base} pair`,
                    `Error on ${coin.name}-${coin.base} pair`
                )
                const newLog = new LogModal({
                    message: msg,
                    details: e.toString(),
                })
                newLog.save()

                console.log(msg, e)

                const tradeInDB = await TradeModal.findOne({ _id: trade.id })
                tradeInDB.status = 'ERROR'
                await tradeInDB.save()
            }
        }
    }
}

module.exports = { startTheBot }
