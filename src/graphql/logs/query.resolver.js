import { LogModal } from '../../utils/db'

export default {
    Query: {
        getLogs: async (_, args, ctx) => {
            try {
                const logs = await LogModal.find().sort({
                    updatedAt: -1,
                })
                return { result: logs }
            } catch (e) {
                return { error: `No logs found.` }
            }
        },
    },
}
