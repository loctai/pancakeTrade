import { getSchema } from './utils/getSchema'
import { ApolloServer } from 'apollo-server-express'
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core'
import express from 'express'
import http from 'http'
import path from 'path'
import { startTheBot } from './bot'
import { startDB } from './utils/db'
import helmet from 'helmet'
import { router } from './api'
import { timer } from './utils/helpers'

const PAUSE = false

const PORT = process.env.PORT || 8000
const HOST = 'localhost'
const HEROKU = 'http://lanthu.herokuapp.com'
async function startApolloServer() {
    const app = express()

    app.use(express.json({ limit: '50mb' }))

    app.use(
        express.urlencoded({
            limit: '50mb',
            extended: false,
            parameterLimit: 50000,
        })
    )
    app.use(helmet())

    app.use('/', router)

    app.set('views', path.join(__dirname, './views'))
    app.set('view engine', 'pug')

    app.get('/', function (req, res) {
        res.render('index', { title: 'Lanthu Bot', message: 'Lanthu Bot' })
    })

    app.use('/images', express.static(path.join(__dirname, 'images')))

    // PING every 20 minutes
    setInterval(function () {
        http.get(HEROKU)
        console.log(HEROKU + ': PINGED!')
    }, 1500000)

    const httpServer = http.createServer(app)
    const corsOptions = {
        origin: `http://${HOST}:${PORT}`,
        credentials: true,
    }
    const server = new ApolloServer({
        schema: getSchema(),
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
        playground: true,
        introspection: true,
        cors: corsOptions,
    })

    await server.start()
    server.applyMiddleware({
        app,
        path: '/graphql',
    })

    // Modified server startup
    await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve))
    console.log(
        `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`
    )

    await startDB()
    if (!PAUSE) await runBot()
}

const runBot = async () => {
    while (1) {
        await startTheBot()
    }
}

startApolloServer()
