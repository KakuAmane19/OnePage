/******************************/
  /**
  * OnePageRecorder仕様
  * ブロードキャストされた座標を保持しておく　箱に表示
  * Recordボタンを押すと、番号をつけて座標を保存
  * Playボタンで番号の座標を送信。指定せずに送ると番号はインクリメントされる
  */

/******************************/
/*Socket*/
 const ENTER_EVENT = 'ENTER_EVENT';
 const DROP_EVENT = 'DROP_EVENT';
 const ZOOM_EVENT = 'ZOOM_EVENT';
 const MAGNET_EVENT = 'MAGNET_EVENT';
 const PLAY_EVENT = 'PLAY_EVENT';

 const socket = io();
/******************************/
let isZoomed = "";

let shared = {
  isLocal:false,
  init:true,
  changeInZoom:false,
  lx:0,
  ly:0,
  rx:0,
  ry:0
}

let absolute = {
  isLocal:true,
  lx:0,
  ly:0,
  rx:0,
  ry:0
}

let cnt=0;//登録した座標番号

let magnetCoords = [0,0];
let magnetIsVisible = true;

/**
 * Socket通信
 */
(async () => {

    if(Object.isExtensible(socket)){
      
      /*入室確認*/
      socket.emit(ENTER_EVENT,{
        message: "Hello! fromRecorder"
      });
    }

      /*受信*/
      socket.on(DROP_EVENT,msg=>{
        shared.lx = Math.round(msg.coords[0]);
        shared.ly = Math.round(msg.coords[1]);
        shared.rx = Math.round(msg.coords[2]);
        shared.ry = Math.round(msg.coords[3]);
        console.log({msg},{shared});

        absolute.lx = Math.round(msg.absolute[0]);
        absolute.ly = Math.round(msg.absolute[1]);
        absolute.rx = Math.round(msg.absolute[2]);
        absolute.ry = Math.round(msg.absolute[3]);

        isZoomed = (msg.isZoomed)?"Expansion":"Shrink";

        //反転チェック
        if(shared.rx < shared.lx) {var temp = shared.rx; shared.rx = shared.lx; shared.lx = temp;}
        if(shared.ry < shared.ly) {var temp = shared.ry; shared.ry = shared.ly; shared.ly = temp;}
  
        if(shared.rx-shared.lx < 10 || shared.ry-shared.ly < 10 )return;
  
        //ボックス更新
        const buffer = document.getElementById("nowCoord");
        buffer.setAttribute("value",
                            "shared:("+shared.lx+","+shared.ly+"),("+shared.rx+","+shared.ry+");"+ "isZoomed:("+isZoomed+");"+
                            "absolute:("+absolute.lx+","+absolute.ly+"),("+absolute.rx+","+absolute.ry+");"+
                            "magnetIsVisible:("+magnetIsVisible+");"+
                            "magnetCoords:("+magnetCoords[0]+","+magnetCoords[1]+");");
        
      });

      socket.on(ZOOM_EVENT,msg=>{
        absolute.lx = Math.round(msg.absolute[0]);
        absolute.ly = Math.round(msg.absolute[1]);
        absolute.rx = Math.round(msg.absolute[2]);
        absolute.ry = Math.round(msg.absolute[3]);

        isZoomed = (msg.command == "Expansion")?"Expansion":"Shrink";

        magnetIsVisible = msg.magnetIsVisible;
  
        //ボックス更新
        const buffer = document.getElementById("nowCoord");
        buffer.setAttribute("value",
                            "shared:("+shared.lx+","+shared.ly+"),("+shared.rx+","+shared.ry+");"+ "isZoomed:("+isZoomed+");"+
                            "absolute:("+absolute.lx+","+absolute.ly+"),("+absolute.rx+","+absolute.ry+");"+
                            "magnetIsVisible:("+magnetIsVisible+");"+
                            "magnetCoords:("+magnetCoords[0]+","+magnetCoords[1]+");");
        
      });

      socket.on(MAGNET_EVENT,msg=>{
        magnetCoords[0] = Math.round(msg.magnetCoords[0]);
        magnetCoords[1] = Math.round(msg.magnetCoords[1]); 
        magnetIsVisible = msg.magnetIsVisible;
  
        //ボックス更新
        const buffer = document.getElementById("nowCoord");
        buffer.setAttribute("value",
                            "shared:("+shared.lx+","+shared.ly+"),("+shared.rx+","+shared.ry+");"+ "isZoomed:("+isZoomed+");"+
                            "absolute:("+absolute.lx+","+absolute.ly+"),("+absolute.rx+","+absolute.ry+");"+
                            "magnetIsVisible:("+magnetIsVisible+");"+
                            "magnetCoords:("+magnetCoords[0]+","+magnetCoords[1]+");");
        
      });
      
  
})();
  

function getArea(e){
    //nowCoordから座標を取得
    const buffer = document.getElementById("nowCoord");
    coord = buffer.getAttribute("value");
    //番号を付ける
    let coordList = document.getElementById("coordList").value; 
    coordList = coordList + ++cnt +":" + coord + "\r\n";
    //テキストボックスにしまう
    document.getElementById("coordList").value = coordList;
}

function setArea(e){

  //インデックスの座標を取得
  const index = document.getElementById("targetNumber").value;
  let coordList = document.getElementById("coordList").value; 
  
  let buf = coordList.split(/\n/g);
  let buf2 =[];
  buf.forEach(element => {
      buf2.push(element.split(/(\d+):shared:\((\d+),(\d+)\),\((\d+),(\d+)\);isZoomed:\((.+)\);absolute:\((\d+),(\d+)\),\((\d+),(\d+)\);magnetIsVisible:\((.+)\);magnetCoords:\((\d+),(\d+)\);/g));
      console.log({element},buf2);
  });
  //送信 TODO:実際に動かして変数の様子を確認した後にいい感じに送信
  for(let i = 0; i<buf2.length; i++){
      if(index == buf2[i][1])
          socket.emit(PLAY_EVENT,{
              coords: [parseInt(buf2[i][2]), 
                      parseInt(buf2[i][3]),
                      parseInt(buf2[i][4]), 
                      parseInt(buf2[i][5])],
              isZoomed: (buf2[i][6]=="Expansion")?true:false,
              absolute: [parseInt(buf2[i][7]), 
                      parseInt(buf2[i][8]),
                      parseInt(buf2[i][9]), 
                      parseInt(buf2[i][10])],
              magnetIsVisible:(buf2[i][11]=="true")?true:false,
              magnetCoords:[parseInt(buf2[i][12]), parseInt(buf2[i][13])]
          });
  }

  
  //targetNumberをインクリメント
  if((parseInt(index))<cnt)document.getElementById("targetNumber").value = (parseInt(index) + 1) + "";
  else document.getElementById("targetNumber").value = (parseInt(index)) + "";
}
