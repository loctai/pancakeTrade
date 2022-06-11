import { TradeModal, TokenModal } from '../../utils/db'
import { getTokenPriceAndBalance } from '../../utils/helpers'

export default {
    Query: {
        getTrades: async (_, args, ctx) => {
            const { token } = args

            try {
                const trades = await TradeModal.find().sort({ updatedAt: -1 })

                if (token === 1) {
                    await Promise.all(
                        trades.map(async (trade) => {
                            const token = await TokenModal.findOne({
                                _id: trade.tokenId,
                            })
                            trade.token = token
                            return trade
                        })
                    )
                }

                return { result: trades }
            } catch (e) {
                return { error: `No trades found.` }
            }
        },
    },
}
