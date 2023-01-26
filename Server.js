var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
const cors = require('cors');
var allowCrossDomain = function (req, res) {

    res.setHeader('Access-Control-Allow-Origin', "*")

}
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

var userName = mongoose.model('userName', {
    name: String
})

var Message = mongoose.model('Message', {
    message: String,
    nameId: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userName"
        }
    ]

})
var ContactUs = mongoose.model('ContactUs', {
    name: String,
    email: String,
    service: String,
    message: String
})
var dbUrl = 'mongodb://localhost:27017/chat'

app.get('/user', (req, res) => {
    userName.find({}, (err, userName) => {
        res.send(userName);
    })
})
app.post('/user', async (req, res) => {

    try {
        var user = new userName(req.body);

        var savedMessage = await user.save()
        console.log('saved');
        res.sendStatus(200);

    }
    catch (error) {
        console.log(error);
        return res.status(400).json({
            message: "Error",
            error: error,
        });
    }
})

app.get('/messages', (req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages);
    })
})


app.get('/messages/:user', (req, res) => {
    var user = req.params.user
    Message.find({ name: user }, (err, messages) => {
        res.send(messages);
    })
})


app.post('/messages', async (req, res) => {
    try {
        const message = await Message.create({
            message: req.body.message,

            nameId: [req.body.nameId]
        });


        var savedMessage = await message.save()
        console.log('saved');

        var censored = await Message.findOne({ message: 'badword' });
        if (censored)
            await Message.remove({ _id: censored.id })
        else
            io.emit('message', req.body);
        res.sendStatus(200);
    }
    catch (error) {
        res.sendStatus(500);
        return console.log('error', error);
    }
    finally {
        console.log('Message Posted')
    }

})

app.get('/contactUs', (req, res) => {
    ContactUs.find({}, (err, ContactUs) => {
        res.send(ContactUs);
    })
})

app.post('/contactUs', async (req, res) => {
    try {
        var contactUs = new ContactUs(req.body);
        console.log(req.body)
        var savedMessage = await contactUs.save()
        console.log('saved');
        res.sendStatus(200);
    }
    catch (error) {
        res.sendStatus(500);
        return console.log('error', error);
    }
    finally {
        console.log('Message Posted')
    }

})


io.on('connection', () => {
    console.log('a user is connected')
})

mongoose.connect(dbUrl, (err) => {
    console.log('mongodb connected', err);
})

var server = http.listen(3000, () => {
    console.log('server is running on port', server.address().port);
});