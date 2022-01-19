

function normalFib(n){
    if(n<2) return 1;
    return normalFib(n-1)+normalFib(n-2);
}

function yieldPromise() {
     return new Promise(function(r) { setTimeout(r, 0); } );
}
    

async function asyncFib(n) {
    if(n<30) return normalFib(n);
    await yieldPromise();
    return await asyncFib(n-1) + await asyncFib(n-2);
}


function doNormalFib() {
	    const inputField = document.getElementById('myInput');
	    const outputField = document.getElementById('myOutput');
	    outputField.value = normalFib(Number(inputField.value));
}

async function doAsyncFib() {
	    const inputField = document.getElementById('myInput');
	    const outputField = document.getElementById('myOutput');
	    await yieldPromise();
	    outputField.value = await asyncFib(Number(inputField.value));
}
					   
		       		       
