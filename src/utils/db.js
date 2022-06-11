import mongoose from 'mongoose'
require('dotenv').config()

const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASSWORD

const startDB = async () => {
    try {
        await mongoose.connect(
            `mongodb+srv://${dbUser}:${dbPassword}@bot.bpetg.mongodb.net/botv2?retryWrites=true&w=majority`,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: false,
                useCreateIndex: true,
                keepAlive: 1,
            }
        )

        mongoose.connection.on('error', (err) => {
            console.log(err)
        })

        const connected = mongoose.connection.readyState
        if (connected === 1) {
            console.log('Connected to Database.')
        } else if (connected === 2) {
            console.log('Connecting to Database.')
        }
    } catch (e) {
        console.log(e.toString())
    }
}

const Schema = mongoose.Schema

const tradeSchema = new Schema(
    {
        status: {
            type: String,
            enum: ['BUYING', 'SELLING', 'COMPLETED', 'ERROR'],
            default: 'BUYING',
        },
        tokenId: {
            type: String,
            required: true,
        },
        amount: Number,
        buyLimit: Number,
        sellLimit: Number,
        stopLossLimit: Number,
    },
    {
        timestamps: true,
    }
)

const TradeModal = mongoose.model('Trade', tradeSchema)

const tokenSchema = new Schema(
    {
        name: {
            type: String,
            unique: true,
        },
        address: String,
        decimal: {
            type: Number,
            default: 18,
        },
        slug: String,
        base: {
            type: String,
            enum: ['BNB', 'BUSD'],
            default: 'BNB',
        },
    },
    {
        timestamps: true,
    }
)

const TokenModal = mongoose.model('Token', tokenSchema)

const historySchema = new Schema(
    {
        tradeId: {
            type: String,
            required: true,
        },
        bought: Number,
        sold: Number,
        profit: Number,
    },
    {
        timestamps: true,
    }
)

const HistoryModal = mongoose.model('History', historySchema)

const logSchema = new Schema(
    {
        message: String,
        details: String,
    },
    {
        timestamps: true,
    }
)

const LogModal = mongoose.model('Log', logSchema)

const deviceSchema = new Schema(
    {
        token: String,
    },
    {
        timestamps: true,
    }
)

const DeviceModal = mongoose.model('Device', deviceSchema)

module.exports = {
    TradeModal,
    TokenModal,
    LogModal,
    startDB,
    DeviceModal,
    HistoryModal,
}
