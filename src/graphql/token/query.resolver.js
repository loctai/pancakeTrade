import { TokenModal } from '../../utils/db'
import { getTokenPriceAndBalance } from '../../utils/helpers'

export default {
    Query: {
        getTokens: async (_, args, ctx) => {
            const { info } = args
            try {
                const tokens = await TokenModal.find().sort({ updatedAt: -1 })
                if (info === 1) {
                    try {
                        await Promise.all(
                            tokens.map(async (token) => {
                                const {
                                    balance,
                                    price,
                                    bnbBalance,
                                    bnbPrice,
                                    busdBalance,
                                } = await getTokenPriceAndBalance(token)

                                const info = {
                                    token: token.name,
                                    address: token.address,
                                    balance,
                                    bnbBalance,
                                    busdBalance,
                                    price,
                                    bnbPrice,
                                }
                                token.info = info
                                return token
                            })
                        )
                    } catch (e) {
                        console.error('Token info error.')
                    }
                }
                return { result: tokens }
            } catch (e) {
                return { error: `No tokens found.` }
            }
        },
    },
}
