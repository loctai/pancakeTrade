import { TradeModal, TokenModal } from '../../utils/db'

export default {
    Mutation: {
        removeTrade: async (_, args) => {
            const { _id } = args
            try {
                const tradeInDB = await TradeModal.findOne({ _id })
                if (tradeInDB !== null) {
                    await TradeModal.deleteOne({ _id })
                    return { result: tradeInDB, message: 'Trade removed.' }
                }
                return { error: `Error on trade remove.` }
            } catch (e) {
                return { error: `Error on trade remove.` }
            }
        },
        addTrade: async (_, args) => {
            const tokenId = args.tokenId
            const amount = args.amount && parseFloat(args.amount)
            const buyLimit = args.buyLimit && parseFloat(args.buyLimit)
            const sellLimit = args.sellLimit && parseFloat(args.sellLimit)
            const stopLossLimit =
                args.stopLossLimit && parseFloat(args.stopLossLimit)
            const status = args.status || 'BUYING'

            try {
                const tokenDb = await TokenModal.findOne({ _id: tokenId })
                if (tokenDb !== null) {
                    const newTrade = TradeModal({
                        tokenId,
                        amount,
                        buyLimit,
                        sellLimit,
                        stopLossLimit,
                        status,
                    })
                    newTrade.save()
                    return {
                        result: newTrade,
                        message: `Trade added.`,
                    }
                } else {
                    return { error: 'Set the coin first.' }
                }
            } catch (e) {
                return { error: 'Error on token add.' }
            }
        },
        updateTrade: async (_, args) => {
            const _id = args._id
            const tokenId = args.tokenId
            const amount = args.amount && parseFloat(args.amount)
            const buyLimit = args.buyLimit && parseFloat(args.buyLimit)
            const sellLimit = args.sellLimit && parseFloat(args.sellLimit)
            const stopLossLimit =
                args.stopLossLimit && parseFloat(args.stopLossLimit)
            const status = args.status

            try {
                const tokenDb = await TokenModal.findOne({ _id: tokenId })
                if (!tokenId || tokenDb !== null) {
                    const tradeDb = await TradeModal.findOne({ _id })

                    if (amount) tradeDb.amount = amount
                    if (buyLimit) tradeDb.buyLimit = buyLimit
                    if (sellLimit) tradeDb.sellLimit = sellLimit
                    if (stopLossLimit) tradeDb.stopLossLimit = stopLossLimit
                    if (status) tradeDb.status = status
                    if (tokenId) tradeDb.tokenId = tokenId

                    const updated = await tradeDb.save()
                    return {
                        message: `trade updated.`,
                        result: updated,
                    }
                }
                return { error: 'Set the coin first.' }
            } catch (e) {
                return { error: '`Error on trade update.' }
            }
        },
    },
}
