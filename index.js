const express = require('express');
const app = express();
__path = process.cwd()
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;
let code = require('./pair');
require('events').EventEmitter.defaultMaxListeners = 500;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/code', code);
app.use('/pair',async (req, res, next) => {
res.sendFile(__path + '/pair.html')
})
app.use('/',async (req, res, next) => {
res.sendFile(__path + '/main.html')
})
app.listen(PORT, '0.0.0.0', () => {
    console.log(`YoutTube: @SunShine\nTelegram: SunShine\nGitHub: @DickiAja\nInstsgram: SunShine\n\nServer running on http://0.0.0.0:` + PORT)
})

module.exports = app
