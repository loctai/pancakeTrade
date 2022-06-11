require('dotenv').config()
const express = require('express')

const { DeviceModal } = require('../utils/db')

const router = express.Router()

router.post('/devices', async (req, res) => {
    const token = req.body.token
    try {
        const deviceInDB = await DeviceModal.findOne({ token })
        if (deviceInDB === null) {
            const newDevice = new DeviceModal({ token })
            newDevice.save()
            res.json({ success: true, message: `Device added` })
        }
    } catch (e) {
        res.json({ success: false, message: `Error on device add.` })
    }
})

router.get('/devices/:token', async (req, res) => {
    const token = req.params.token
    try {
        const device = await DeviceModal.findOne({ token })
        res.json({ success: true, message: device })
    } catch (e) {
        res.json({ success: false, message: `Error on device fetch.` })
    }
})

module.exports = { router }
