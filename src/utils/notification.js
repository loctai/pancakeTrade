import gcm from 'node-gcm'
import { DeviceModal } from './db'
require('dotenv').config()
// Set up the sender with your GCM/FCM API key (declare this once for multiple messages)
const sender = new gcm.Sender(process.env.FB_KEY)

const sendMessage = async (title, body) => {
    const message = new gcm.Message({
        notification: {
            title: title,
            icon: 'ic_launcher',
            body: body,
        },
    })

    const devices = await DeviceModal.find()
    const registeredDevices = []

    for (let device of devices) {
        registeredDevices.push(device.token)
    }
    // Send the message
    sender.send(
        message,
        { registrationTokens: registeredDevices },
        function (err, response) {
            if (err) console.error(err)
            else console.log('Notification sent.')
        }
    )
}

module.exports = { sendMessage }
