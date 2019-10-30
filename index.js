let express = require('express'),
    app = express();
    http = require('http').Server(app),
    io = require('socket.io')(http),
    Filter = require('bad-words'),
    filter = new Filter();

let messages = [];

app.use(express.static('res'));

app.all('/', (req, res)=>{
	res.sendFile(__dirname + "/index.html");
});

const chatSpace = io.of('/chat'),
      readers = io.of('/readers');

let participants = new Map(),
    keyData = [],
    updateDelay = 30,
    decay = 1000,
    maxQueueLength = 30; 

readers.on('connection', (socket)=>{
	console.log('Reader connected');
	socket.on('disconnect', (socket)=>{
		console.log('Reader disconnected');	
	});
});

let update = setInterval( ()=>{
	readers.emit('key_data', keyData.join());
}, updateDelay);

let clearList = setInterval( ()=>{
	keyData.shift();
}, decay);

chatSpace.on('connection', (socket)=>{
	console.log('User connected');
	participants.set(socket.id, (new Date).getTime());
	socket.on('disconnect', (socket)=>{
		console.log('User disconnected');	
	});
	socket.on('message_sent', (message)=>{
		//console.log("MESSAGE");
		
		let timeSinceLast = (new Date).getTime() - participants.get(socket.id);	
		if(timeSinceLast > updateDelay){
			participants.set(socket.id, (new Date).getTime());
			let keyLetter = (""+message.body).trim().toLowerCase().charAt(0);
			if(keyData.length >= maxQueueLength){
				keyData.shift();
			}
			keyData.push(keyLetter);
		//	console.log(keyData);
			chatSpace.emit("message_received", `${filter.clean(message.username)}: ${filter.clean(message.body)}`);
		}
	});
});

http.listen( (process.env.PORT || 8080), ()=>{
	console.log("Main page working");
});
