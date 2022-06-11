import { getTokenPriceAndBalance } from '../../utils/helpers'
import { TokenModal } from '../../utils/db'

export default {
    Query: {
        getTokenInfo: async (_, args, ctx) => {
            const { tokenId } = args

            try {
                const token = await TokenModal.findOne({ _id: tokenId })

                if (token !== null) {
                    const {
                        balance,
                        price,
                        bnbBalance,
                        bnbPrice,
                        busdBalance,
                    } = await getTokenPriceAndBalance(token)

                    const data = {
                        token: token.name,
                        address: token.address,
                        balance,
                        bnbBalance,
                        busdBalance,
                        price,
                        bnbPrice,
                    }

                    return { result: data }
                } else {
                    return { message: 'No token found.' }
                }
            } catch (e) {
                return { error: `Error on token fetch.` }
            }
        },
    },
}
