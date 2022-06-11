import { makeExecutableSchema } from '@graphql-tools/schema'
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge'
import { loadFilesSync } from '@graphql-tools/load-files'

import * as path from 'path'

export const getSchema = () => {
    const typesArray = loadFilesSync(
        path.join(__dirname, '../graphql/**/*.graphql'),
        { recursive: true }
    )
    const resolversArray = loadFilesSync(
        path.join(__dirname, '../graphql/**/*.resolver.*'),
        {
            recursive: true,
        }
    )

    const typeDefs = mergeTypeDefs(typesArray)
    const resolvers = mergeResolvers(resolversArray)

    const executableSchema = makeExecutableSchema({
        typeDefs,
        resolvers,
    })

    return executableSchema
}
