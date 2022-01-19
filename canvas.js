//拡大　True:拡大中　False:原寸
var isZoomed = false;

//コンテキスト
var context;  
var rectCanvasContext ;
//canvas
var canvas;
var rectCanvas;

/******************************/
/*拡大座標データ:テキストボックスから取得
/*書式は『<フェーズ数>:(<左上x>,<左上y>),(<右下x>,<右下y>)
 */

var coord = []; 
//現在の番号
var currentCoord = 0;
var lx;//左上のX"""
var ly;//左上のy
var rx;//右下のX
var ry;//右下のy
var startx;//D&D開始点を保持する一時的なx
var starty;//D&D開始点を保持する一時的なy

/******************************/
/*ドラッグ&ドロップで座標取得
*/

var x, y, relX, relY;
var dragging = false;

/******************************/
/*PDFレンダリング関係
*/
//取得したpdfのページ
var pdfPage; 
//pdfのレンダリング情報
var viewportParametors;
//render for pdf text
var renderContext; 
//大きかった時の補正用拡大率
var defaultScale = 1.0;

/******************************/

window.onload = function(){
    canvas = document.getElementById('pdf_canvas');
    if (!canvas || !canvas.getContext) {
        return false;
    }
    context = canvas.getContext('2d');
    
};

/*拡大/縮小ボタン処理 */
function doZoom(e){

    var sx;
    var sy;
    var sw;
    var sh;

    var beforeButton = document.getElementById("before");
    var nextButton = document.getElementById("next");

    if(!isZoomed){//拡大していないなら

        //拡大
        sx = lx;
        sy = ly;
        sw = rx-lx;
        sh = ry-ly;
        console.log("("+lx+","+ly+"),("+rx+","+ry+") "+"sw:" + sw + "sh:" + sh);

        //ボタンのテキストの張り替え
        document.getElementById("zoominout").textContent = "縮小";
        isZoomed = true;

        //他ボタンの無効化
        beforeButton.disabled = "disabled";
        nextButton.disabled = "disabled";

        //描画
        context.clearRect(0, 0, canvas.width, canvas.height);
        rectCanvasContext.clearRect(0, 0, rectCanvas.width, rectCanvas.height);

        var scale = (canvas.width/sw < canvas.height/sh)?canvas.width/sw : canvas.height/sh;

        viewportParametors = {
          scale:scale*defaultScale,
          rotation:0.0,
          offsetX:-lx*scale,
          offsetY:-ly*scale,
          dontFlip: false
        };
        var viewport = pdfPage.getViewport(viewportParametors);
        var renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        pdfPage.render(renderContext).promise.then(function(){
          rectCanvasContext.strokeStyle = '#f00';
          rectCanvasContext.strokeRect(0,0,(rx-lx)*scale,(ry-ly)*scale);
        });
    }else{

        //縮小
        sx = 0;
        sy = 0;
        sw = canvas.width;
        sh = canvas.height;
        console.log("sw:" + sw + "sh:" + sh);

        //ボタンのテキストの張り替え
        document.getElementById("zoominout").textContent = "拡大";
        isZoomed = false;

        //有効にする
        beforeButton.disabled = "";
        nextButton.disabled = "";

        //再描画
        context.clearRect(0, 0, canvas.width, canvas.height);
        rectCanvasContext.clearRect(0, 0, rectCanvas.width, rectCanvas.height);
        viewportParametors = {
          scale:defaultScale,
          rotation:0.0,
          offsetX:0,
          offsetY:0,
          dontFlip: false
        };
        var viewport = pdfPage.getViewport(viewportParametors);
        var renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        pdfPage.render(renderContext).promise.then(function(){
          rectCanvasContext.strokeStyle = '#f00';
          rectCanvasContext.strokeRect(lx,ly,rx-lx,ry-ly);
        });
        
    }
}

/*座標データをテキストボックスから取得*/
function getCoordText(e){
    const buffer = document.getElementById("coord").children;
    console.log(buffer[0].textContent.split(/\(|\,|\)\,\(|\)/));
    
    //coord = buffer.split(/\)\n/);
    for(var i=0; i<buffer.length; i++){
      coord[i] = buffer[i].textContent.split(/\(|\,|\)\,\(|\)/);
        //coord[i] = coord[i].split(/:\(|\,|\)\,\(/);
    }

    for(var i=0; i<coord.length; i++){
      for(var j=0; j<coord[i].length; j++) coord[i][j] =parseInt(coord[i][j]);
    }
    console.log(coord);

    //1番目のデータをセット
    if(0 < coord.length){
        lx = coord[0][1];
        ly = coord[0][2];
        rx = coord[0][3];
        ry = coord[0][4];
        currentCoord = 0;
    }else{
        lx = 0;
        ly = 0;
        rx = canvas.width;
        ry = canvas.height;
        currentCoord = 0;
    }

    update();
    
    document.getElementById("allPhase").setAttribute("value",coord.length);//下の全体ページ数の表示
    document.getElementById("currentPhase").setAttribute("value",1);//下の全体ページ数の表示
    
}

/*Nextボタン処理 */
function goNext(e){
    if(currentCoord < coord.length)currentCoord++; //E! "0: Unable to get property '1' of undefined or null reference"
    //二回Beforeを入力しないと前状態に戻れない。

    lx = coord[currentCoord][1];
    ly = coord[currentCoord][2];
    rx = coord[currentCoord][3];
    ry = coord[currentCoord][4];

    update();
    document.getElementById("currentPhase").setAttribute("value",currentCoord);//下の全体ページ数の表示
}

/*Beforeボタン処理 */
function goBefore(e){
    if(0 < currentCoord)currentCoord--;
    console.log("" + currentCoord);
    lx = coord[currentCoord][1];
    ly = coord[currentCoord][2];
    rx = coord[currentCoord][3];
    ry = coord[currentCoord][4];

    update();

    document.getElementById("currentPhase").setAttribute("value",coord[currentCoord][0]);//下の全体ページ数の表示
}


/*D&Dで座標取得*/
function onDown(e) {
  // キャンバスの左上端の座標を取得
  var offsetX = canvas.getBoundingClientRect().left;
  var offsetY = canvas.getBoundingClientRect().top;

  
  // マウスが押された座標を取得
  var x = e.clientX - offsetX;
  var y = e.clientY - offsetY;

  if(0 <= x && 0 <= y && x <= rectCanvas.width && y <= rectCanvas.height){

    rectCanvasContext.clearRect(0, 0, rectCanvas.width, rectCanvas.height);

    startx=x;
    starty=y;

    console.log("lx:"+startx+" ly:"+starty);
    dragging = true;
    //update();
  }
}

function onMove(e) {
  // キャンバスの左上端の座標を取得
  var offsetX = canvas.getBoundingClientRect().left;
  var offsetY = canvas.getBoundingClientRect().top;

  // マウスが移動した先の座標を取得
  var x = e.clientX - offsetX;
  var y = e.clientY - offsetY;

    // ドラッグが開始されていればオブジェクトの座標を更新して再描画
  if(0 <= x && 0 <= y && x <= rectCanvas.width && y <= rectCanvas.height && dragging){

    lx=startx;
    ly=starty;
    rx=x;
    ry=y;

    update();
  }
}

function onUp(e) {

  // キャンバスの左上端の座標を取得
  var offsetX = canvas.getBoundingClientRect().left;
  var offsetY = canvas.getBoundingClientRect().top;

  // マウスが移動した先の座標を取得
  var x = e.clientX - offsetX;
  var y = e.clientY - offsetY;


  if(0 <= x && 0 <= y && x <= rectCanvas.width && y <= rectCanvas.height && dragging){

    lx=startx;
    ly=starty;
    rx=x;
    ry=y;

    dragging = false

    addCoord();
  }
  console.log("lx:"+lx+" ly:"+ly+" rx:"+rx+" ry:"+ry);
}

window.addEventListener('mousedown', onDown,false);
window.addEventListener('mousemove', onMove,false);
window.addEventListener('mouseup', onUp,false);

/*PDFレンダリング再描画*/
function update(){
  rectCanvasContext.clearRect(0, 0, rectCanvas.width, rectCanvas.height);
  rectCanvasContext.strokeStyle = '#f00';
  rectCanvasContext.strokeRect(lx,ly,rx-lx,ry-ly);
}

/*座標追加*/
function addCoord() {

  //反転チェック
  if(rx < lx) {var temp = rx; rx = lx; lx = temp;}
  if(ry < ly) {var temp = ry; ry = ly; ly = temp;}

  if(rx-lx < 10 || ry-ly < 10 )return;

  var buffer = document.getElementById('coord').children;

  var newCoord = document.createElement("li");
  newCoord.innerHTML = "<a id=" + buffer.length + ">("+ lx + "," + ly +"),("+ rx + "," + ry + ")</a>";
  document.getElementById('coord').appendChild(newCoord);
}
// URL of PDF document
var url = "http://localhost:8080/hironaka-poster-socinfo2019.pdf";

// Asynchronous download PDF
pdfjsLib.getDocument(url)
  .promise.then(function(pdf) {
    return pdf.getPage(1);
  })
  .then(function(page) {
    // Set scale (zoom) level
    
    viewportParametors = {
      scale:1.0,
      rotation:0.0,
      offsetX:0,
      offsetY:0,
      dontFlip: false
    };

    // Get viewport (dimensions)
    var viewport = page.getViewport(viewportParametors);

    // Set dimensions to Canvas
if(viewport.width > 1000){
  //n = vw/1000
  canvas.height = viewport.height*(1000/viewport.width);
  canvas.width = 1000;

  viewportParametors.scale = 1000/viewport.width;
  defaultScale = 1000/viewport.width;
  viewport = page.getViewport(viewportParametors);
}else{
  canvas.height = viewport.height;
  canvas.width = viewport.width;
}


    // Prepare object needed by render method
    var renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    console.log({viewport});

    // Render PDF page
    page.render(renderContext);

    pdfPage = page;

    //pdfの大きさをrectCanvasに適応
    rectCanvas = document.getElementById('red_rect');
    if (!rectCanvas || !rectCanvas.getContext) {
      return false;
    }
    rectCanvas.setAttribute('width', canvas.width);
    rectCanvas.setAttribute('height', canvas.height);
    rectCanvasContext = rectCanvas.getContext('2d');
    
  });