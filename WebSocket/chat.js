function myUpdateDisplay() {
    const field = document.getElementById('myTarget');
    const localText = localStorage.getItem('myText');
    if(localText) 
	{ field.value = localText; }
    else 
	{ field.value = ''; }
}

function myStartGet(url, callback) {
    const request = new XMLHttpRequest();
    request.open("GET", url);
    request.onreadystatechange = function() {
	  if(request.readyState == 4 && request.status == 200) {
	    callback(request.responseText);
	  }
    };
    request.send(null);
}

function myAssignTarget(text) {
    if(text) {
	const field = document.getElementById('myTarget');
	field.value = text;
    }
}

function myUpdate() {
    const field = document.getElementById('myTarget');
    const localText = field.value;
    localStorage.setItem('myText', localText);
    myUpdateDisplay();
}


function myClear() {
    const confirmation = confirm('Text will be cleared.');
    if(confirmation) {
	localStorage.clear();
	myUpdateDisplay();
    }
}

var webSocket;

function mySend() {
	    const field = document.getElementById('myTarget');
	    console.log(field.value);
	    webSocket.send(field.value);
}



function mySetup() {
        webSocket = new WebSocket('ws://127.0.0.1:3001');

        // connecting to webSocket Server
        webSocket.addEventListener('open',function(e){
            console.log('Socket Established');
        });

        // サーバーからデータを受け取る
        webSocket.addEventListener('message',function(e){
		console.log('data = ', e.data);
		const field = document.getElementById('myShareSpace');
		field.value = e.data;
        });


	myUpdateDisplay();
}

window.onload = mySetup;


