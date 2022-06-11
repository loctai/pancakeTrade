import { HistoryModal } from '../../utils/db'

export default {
    Query: {
        getHistories: async (_, args, ctx) => {
            try {
                const histories = await HistoryModal.find().sort({
                    updatedAt: -1,
                })
                return { result: histories }
            } catch (e) {
                return { error: `No histories found.` }
            }
        },
    },
}
