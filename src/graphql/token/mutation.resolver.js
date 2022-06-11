import { TokenModal } from '../../utils/db'
export default {
    Mutation: {
        removeToken: async (_, args) => {
            const { _id } = args

            try {
                const tokenDb = await TokenModal.findOne({ _id })
                if (tokenDb !== null) {
                    await TokenModal.deleteOne({ _id })
                    return { message: `Token removed`, result: tokenDb }
                }
                return { error: `Error on token remove.` }
            } catch (e) {
                return { error: `Error on token remove.` }
            }
        },
        addToken: async (_, args) => {
            const { name, address, slug, base, decimal } = args

            if (address.length !== 42 || address.substr(0, 2) !== '0x') {
                return { error: `Address wrong.` }
            }
            try {
                const newToken = new TokenModal({
                    name,
                    address,
                    slug,
                    base,
                    decimal,
                })
                newToken.save()
                return { message: `Token added`, result: newToken }
            } catch (e) {
                return { error: `Error on token add.` }
            }
        },
        updateToken: async (_, args) => {
            const { _id, ...rest } = args

            if (
                rest.address &&
                (rest.address.length !== 42 ||
                    rest.address.substr(0, 2) !== '0x')
            ) {
                return { message: `Address wrong.` }
            }

            try {
                const tokenDb = await TokenModal.findOne({ _id })
                tokenDb.set({ ...rest })
                const updated = await tokenDb.save()
                return { message: `Token updated.`, result: updated }
            } catch (e) {
                return { error: `Error on token update.` }
            }
        },
    },
}
