//
// Sample http server using node.js
//   It works for "index.htm, simple.html, simple.css, simple.js, umemura.jpg, and
//   video : './20180310-rehearsal.mp4.
//
//
const http = require('http'); 
const fs = require('fs'); 
const url = require('url');

const htmlData = fs.readFileSync('./chat.html', 'UTF-8');
const cssData =  fs.readFileSync('./chat.css', 'UTF-8');
const jsData =  fs.readFileSync('./chat.js', 'UTF-8');
const jpegData = fs.readFileSync('./umemura.jpg');


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
    case '/chat.html':
	response.writeHead(200, {'Content-Type' : 'text/html'});
	response.write(htmlData);
	response.end(); 
	break;
    case '/chat.css':
	response.writeHead(200, {'Content-Type' : 'text/css'});
	response.write(cssData);
	response.end(); 
	break;
    case '/chat.js':
	response.writeHead(200, {'Content-Type' : 'text/javascript'});
	response.write(jsData);
	response.end(); 
	break;
    default:
	response.writeHead(200, {'Content-Type' : 'text/plain'});
	response.write('your path-name is '+urlInformation.pathname);
	response.end();
    }
}
		
const httpServer = http.createServer(serviceClient);
httpServer.listen(3000);
console.log('Http server at 3000');

const webSocketServer = require('ws').Server;
const chatServer  = new webSocketServer({port:3001});

console.log('WebSocket server at 3001');

chatServer.on('connection',function(ws){

    ws.on('message',function(message){
        console.log("Received: "+message);

        chatServer.clients.forEach(function(client){
		client.send(message);
        });
    });

    ws.on('close',function(){
        console.log('I lost a client');
    });

});
