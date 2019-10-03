let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let Filter = require('bad-words'),
let filter = new Filter();

let messages = [];

app.use(express.static('res'));

app.all('/', (req, res)=>{
	res.sendFile(__dirname + "/index.html");
});

const chatSpace = io.of('/chat');
const readers = io.of('/readers');

let participants = new Map();
let keyData = [];

let updateDelay = 30;
let decay = 1000;
let maxQueueLength = 10; 

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
		console.log("MESSAGE");
		
		let timeSinceLast = (new Date).getTime() - participants.get(socket.id);	
		if(timeSinceLast > updateDelay){
			participants.set(socket.id, (new Date).getTime());
			let keyLetter = (""+message.body).trim().toLowerCase().charAt(0);
			if(keyData.length >= maxQueueLength){
				keyData.shift();
			}
			keyData.push(keyLetter);
			console.log(keyData);
			chatSpace.emit("message_received", `${fliter.clean(message.username)}: ${filter.clean(message.body)}`);
		}
	});
});

http.listen( (process.env.PORT || 8080), ()=>{
	console.log("Main page working");
});
