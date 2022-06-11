import { LogModal } from '../../utils/db'
export default {
    Mutation: {
        removeLog: async (_, args) => {
            const { _id } = args

            try {
                const logDb = await LogModal.findOne({ _id })
                if (logDb !== null) {
                    await LogModal.deleteOne({ _id })
                    return { message: `Log removed`, result: logDb }
                }
                return { error: `Error on log remove.` }
            } catch (e) {
                return { error: `Error on log remove.` }
            }
        },
    },
}
