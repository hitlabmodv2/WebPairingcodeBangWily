const express = require('express');
const fs = require('fs');
let router = express.Router()
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");

function removeFile(FilePath){
    if(!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true })
 };
router.get('/', async (req, res) => {
    let num = req.query.number;
    
    // Set timeout for Vercel compatibility (max 10 seconds for free plan)
    const timeoutId = setTimeout(() => {
        if (!res.headersSent) {
            res.status(408).send({code: "Request Timeout"});
        }
    }, 8000);
    
    try {
        // Validate phone number
        if (!num || num.length < 10) {
            clearTimeout(timeoutId);
            return res.status(400).send({code: "Invalid Phone Number"});
        }
        
        num = num.replace(/[^0-9]/g,'');
        
        // Create session directory in tmp for Vercel
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
            connectTimeoutMs: 5000,
            defaultQueryTimeoutMs: 5000,
        });
        
        if (!XeonBotInc.authState.creds.registered) {
            await delay(500); // Reduced delay for Vercel
            const code = await XeonBotInc.requestPairingCode(num);
            
            clearTimeout(timeoutId);
            if (!res.headersSent) {
                res.send({code});
            }
            
            // Clean up session after sending code
            setTimeout(() => {
                removeFile(sessionPath);
                if (XeonBotInc && XeonBotInc.end) {
                    XeonBotInc.end();
                }
            }, 1000);
            
        } else {
            clearTimeout(timeoutId);
            if (!res.headersSent) {
                res.send({code: "Already Registered"});
            }
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
