
const express = require('express');
const fs = require('fs');
let router = express.Router()
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    DisconnectReason
} = require("@whiskeysockets/baileys");

function removeFile(FilePath){
    if(!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true })
 };

router.get('/', async (req, res) => {
    let num = req.query.number;
    
    // Set timeout for better compatibility
    const timeoutId = setTimeout(() => {
        if (!res.headersSent) {
            res.status(408).send({code: "Request Timeout"});
        }
    }, 30000); // Increased to 30 seconds
    
    try {
        // Validate phone number
        if (!num || num.length < 10) {
            clearTimeout(timeoutId);
            return res.status(400).send({code: "Invalid Phone Number"});
        }
        
        num = num.replace(/[^0-9]/g,'');
        
        // Create session directory
        const sessionPath = '/tmp/session-' + Date.now();
        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, { recursive: true });
        }
        
        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(sessionPath);
        
        let XeonBotInc = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({level: "fatal"}).child({level: "fatal"})),
            },
            printQRInTerminal: false,
            logger: pino({level: "fatal"}).child({level: "fatal"}),
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            connectTimeoutMs: 10000,
            defaultQueryTimeoutMs: 10000,
        });
        
        // Handle connection updates
        XeonBotInc.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'open') {
                console.log('Connected successfully!');
                
                // Send creds.json file to the user's WhatsApp
                try {
                    const credsPath = sessionPath + '/creds.json';
                    if (fs.existsSync(credsPath)) {
                        const credsData = fs.readFileSync(credsPath);
                        
                        // Send file to user's WhatsApp
                        await XeonBotInc.sendMessage(num + '@s.whatsapp.net', {
                            document: credsData,
                            fileName: 'creds.json',
                            mimetype: 'application/json',
                            caption: '✅ File creds.json berhasil dibuat!\n\n📁 Simpan file ini dengan aman untuk session WhatsApp Bot Anda.\n\n🔒 Jangan bagikan file ini kepada siapa pun!'
                        });
                        
                        console.log('Creds.json sent successfully to', num);
                    }
                } catch (error) {
                    console.log('Error sending file:', error.message);
                }
                
                // Clean up after 5 seconds
                setTimeout(() => {
                    removeFile(sessionPath);
                    if (XeonBotInc && XeonBotInc.end) {
                        XeonBotInc.end();
                    }
                }, 5000);
            }
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                if (!shouldReconnect) {
                    removeFile(sessionPath);
                }
            }
        });
        
        // Handle credential updates
        XeonBotInc.ev.on('creds.update', saveCreds);
        
        if (!XeonBotInc.authState.creds.registered) {
            await delay(1000);
            const code = await XeonBotInc.requestPairingCode(num);
            
            clearTimeout(timeoutId);
            if (!res.headersSent) {
                res.send({
                    code,
                    message: "Masukkan kode ke WhatsApp Anda. File creds.json akan dikirim otomatis setelah berhasil tersambung."
                });
            }
            
        } else {
            clearTimeout(timeoutId);
            if (!res.headersSent) {
                res.send({code: "Already Registered"});
            }
            removeFile(sessionPath);
        }
        
    } catch (err) {
        console.log("Error:", err.message);
        clearTimeout(timeoutId);
        if (!res.headersSent) {
            res.status(500).send({code: "Service Error"});
        }
    }
});

process.on('uncaughtException', function (err) {
let e = String(err)
if (e.includes("conflict")) return
if (e.includes("Socket connection timeout")) return
if (e.includes("not-authorized")) return
if (e.includes("rate-overlimit")) return
if (e.includes("Connection Closed")) return
if (e.includes("Timed Out")) return
if (e.includes("Value not found")) return
console.log('Caught exception: ', err)
})

module.exports = router
