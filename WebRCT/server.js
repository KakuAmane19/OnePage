//
// Sample http server using node.js
//
//
const http = require('http'); 
const fs = require('fs'); 
const url = require('url');

const htmlData = fs.readFileSync('./WebRTC.html', 'UTF-8');
const cssData =  fs.readFileSync('./WebRTC.css', 'UTF-8');
const jsData =  fs.readFileSync('./WebRTC.js', 'UTF-8');

var jpegDATA ;
// const jpegData = fs.readFileSync('./umemura.jpg');

var lastMessage = "";


// Note that this service all ways response with 'index.html'
function serviceClient(request, response) {
    const urlInformation = url.parse(request.url);
    
    switch(urlInformation.pathname) {
    case '/':
	fs.readFile('./index.html', 'UTF-8',
		function(error, data) {
		    response.writeHead(200, {'Content-Type' : 'text/html'});
		    response.write(data);
		    response.end(); } );
	break;
    case '/WebRTC.html':
	response.writeHead(200, {'Content-Type' : 'text/html'});
	response.write(htmlData);
	response.end(); 
	break;
    case '/WebRTC.css':
	response.writeHead(200, {'Content-Type' : 'text/css'});
	response.write(cssData);
	response.end(); 
	break;
    case '/WebRTC.js':
	response.writeHead(200, {'Content-Type' : 'text/javascript'});
	response.write(jsData);
	response.end(); 
	break;
    case '/message.txt':
    default:
	response.writeHead(200, {'Content-Type' : 'text/plain'});
	response.write(lastMessage);
	response.end();
	break;
    }
}
		
const httpServer = http.createServer(serviceClient);
httpServer.listen(3003);
console.log('Http server at 3003');

const webSocketServer = require('ws').Server;
const chatServer  = new webSocketServer({port:3004});

console.log('WebSocket server at 3004');

chatServer.on('connection',function(ws){

    ws.on('message',function(message){
	    lastMessage = message;
	    // console.log("Received: "+message);

	    chatServer.clients.forEach(function(client){
		    client.send(message);
		});
	});

    ws.on('close',function(){
	    // console.log('I lost a client');
	});

});
