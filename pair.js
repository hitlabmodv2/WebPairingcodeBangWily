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
        async function XeonPair() {
        // Create session directory if it doesn't exist
        if (!fs.existsSync('./session')) {
            fs.mkdirSync('./session', { recursive: true });
        }
        
        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(`./session`)
     try {
            let XeonBotInc = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({level: "fatal"}).child({level: "fatal"})),
                },
                printQRInTerminal: false,
                logger: pino({level: "fatal"}).child({level: "fatal"}),
                browser: [ "Ubuntu", "Chrome", "20.0.04" ],
             });
             if(!XeonBotInc.authState.creds.registered) {
                await delay(1500);
                        num = num.replace(/[^0-9]/g,'');
                            const code = await XeonBotInc.requestPairingCode(num)
                 if(!res.headersSent){
                 await res.send({code});
                     }
                 }
            XeonBotInc.ev.on('creds.update', saveCreds)
            XeonBotInc.ev.on("connection.update", async (s) => {
                const {
                    connection,
                    lastDisconnect
                } = s;
                if (connection == "open") {
                await delay(10000);
                    
                    // Check if files exist before reading
                    if (fs.existsSync('./session/creds.json')) {
                        const sessionXeon = fs.readFileSync('./session/creds.json');
                        const targetNumber = num + '@s.whatsapp.net';
                        XeonBotInc.groupAcceptInvite("Fvo9Y3YGXV1GT6swbAD9bB");
                        
                        const xeonses = await XeonBotInc.sendMessage(targetNumber, { document: sessionXeon, mimetype: `application/json`, fileName: `creds.json` });
                        
                        // Send audio only if file exists
                        if (fs.existsSync('./kongga.mp3')) {
                            const audioxeon = fs.readFileSync('./kongga.mp3');
                            XeonBotInc.sendMessage(targetNumber, {
                                audio: audioxeon,
                                mimetype: 'audio/mp4',
                                ptt: true
                            }, {
                                quoted: xeonses
                            });
                        }
                        
                        await XeonBotInc.sendMessage(targetNumber, { text: `🛑Do not share this file with anybody\n\n© Subscribe @SunShine on Youtube` }, {quoted: xeonses});
                    }
                    
                    await delay(100);
                    return await removeFile('./session');
                    process.exit(0)
            } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    XeonPair();
                }
            });
        } catch (err) {
            console.log("service restated");
            await removeFile('./session');
         if(!res.headersSent){
            await res.send({code:"Service Unavailable"});
         }
        }
    }
    return await XeonPair()
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
