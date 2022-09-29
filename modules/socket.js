const fs = require('fs');

const {
  ENTER_EVENT,
  DROP_EVENT,
  ERROR_EVENT,
  SYNC_EVENT,
  ZOOM_EVENT,
  MAGNET_EVENT,
  PLAY_EVENT,
  QUESTION_EVENT,
  LOGING_EVENT
} = require("./events");


function makelogdir(){
  if (fs.existsSync('logs')) {
    console.log('logs directory is already exist.');
  } else {
    console.log('logs directory is not exist.');
    fs.mkdir('logs', (err) => {
      if (err) { throw err; }
      console.log('logs directory is made.');
    });
  }
}

function makelogFile(filename){
  fs.open('logs/' + filename, 'w' ,function (err) {
    if (err) { throw err; }
    console.log(filename+ 'is made');
  });
}

function appendlog(filename,message){

  let log = message + "\n";

  fs.appendFile('logs/' + filename, log, function (err) {
    if (err) {
        throw err;
    }
    console.log(message);
  });
}

module.exports = (http) => {
  let changeInZoom = false;
  let serverCoords = [0, 0, 0, 0];
  let isZoomed = false;
  let magnetCoords = [1, 1];
  let magnetIsVisible = true;
  let init = true;
  let absolute = [0, 0, 0, 0];
  let pdfWidth = -1;
  let pdfHeight = -1;
  let id = "";

  const io = require("socket.io")(http);


  makelogdir();

  const dt = new Date(Date.now() + 3600000 * 9);
  let datetime = dt.toISOString();
  datetime = datetime.replace('T', '_').replace(/\.\d{1,3}Z$/, '').replace(/\D/g,'');
  const logfile_name = datetime + '.log';
  //const logfile_name = "test.log";

  makelogFile(logfile_name);
  
  io.on("connection", (socket) => {
    console.log(`OnePageStart`);

    socket.on(ENTER_EVENT, (msg) => {
      //確認用入室イベント

      if (!Object.isExtensible(msg)) {
        console.error(`error connection`);
        socket.emit(ERROR_EVENT, "error connection");
        return;
      }

      appendlog(logfile_name,`accept new user `+ socket.id);
    });

    socket.on(DROP_EVENT, (msg) => {
      console.log(DROP_EVENT,{msg})
      //誰かが座標登録した
      let i = 0;
      for (var value of msg.coords) {
        // オブジェクトの中のプロパティ名を取り出す
        serverCoords[i] = value;
        i++;
      }

      init = false;
      i = 0;
      for (var value of msg.absolute) {
        // オブジェクトの中のプロパティ名を取り出す。
        absolute[i] = value;
        i++;
      }
      isZoomed = msg.isZoomed;
      socket.broadcast.emit(DROP_EVENT, {
        coords: msg.coords,
        isZoomed: isZoomed,
        absolute: msg.absolute,
      });
    });

    socket.on(ZOOM_EVENT, (msg) => {
      console.log(ZOOM_EVENT,{msg})
      isZoomed = msg.command == "Expansion" ? true : false;
      let i = 0;
      try{
        for (var value of msg.absolute) {
          // オブジェクトの中のプロパティ名を取り出す。
          absolute[i] = value;
          i++;
        }
      }catch(error){

        console.log(error,msg.absolute);
        return;
      }

      if (!isZoomed) {
        absolute[0] = 0;
        absolute[1] = 0;
        absolute[2] = pdfWidth;
        absolute[3] = pdfHeight;
      }
      socket.emit(ZOOM_EVENT, {
        command: msg.command,
        absolute: msg.absolute,
        magnetCoords: magnetCoords,
        magnetIsVisible: magnetIsVisible,
      });
      socket.broadcast.emit(ZOOM_EVENT, {
        command: msg.command,
        absolute: msg.absolute,
        magnetCoords: magnetCoords,
        magnetIsVisible: magnetIsVisible,
      });
      console.log(ZOOM_EVENT, {
        command: msg.command,
        absolute: msg.absolute,
        magnetCoords: magnetCoords,
        magnetIsVisible: magnetIsVisible,
      });
    });

    socket.on(SYNC_EVENT, (msg) => {
      console.log(SYNC_EVENT,{msg})
      if (pdfWidth == -1 && pdfHeight == -1) {
        absolute[2] = msg[2];
        absolute[3] = msg[3];
        pdfWidth = absolute[2];
        pdfHeight = absolute[3];
      }

      socket.emit(SYNC_EVENT, {
        coords: serverCoords,
        isZoomed: isZoomed,
        changeInZoom: changeInZoom,
        magnetCoords: magnetCoords,
        magnetIsVisible: magnetIsVisible,
        absolute: absolute,
        init: init,
      });
      console.log(
        "SYNC_EVENT",
        {
          coords: serverCoords,
          isZoomed: isZoomed,
          changeInZoom: changeInZoom,
          magnetCoords: magnetCoords,
          magnetIsVisible: magnetIsVisible,
          absolute: absolute,
          init: init,
        }
      );
    });

    socket.on(MAGNET_EVENT, (msg) => {
      console.log(MAGNET_EVENT,{msg})
      let i = 0;
      for (var value of msg.magnetCoords) {
        // オブジェクトの中のプロパティ名を取り出す。
        magnetCoords[i] = value;
        i++;
      }
      magnetIsVisible = msg.magnetIsVisible;
      socket.broadcast.emit(MAGNET_EVENT, {
        magnetCoords: magnetCoords,
        magnetIsVisible: magnetIsVisible,
      });
      
      console.log("MAGNET_EVENT", {
        magnetCoords: magnetCoords,
        magnetIsVisible: magnetIsVisible,
        row: msg.row,
      });
    });

    socket.on(QUESTION_EVENT, (msg) => {
      console.log(QUESTION_EVENT,{msg})
      socket.broadcast.emit(QUESTION_EVENT);
      socket.emit(QUESTION_EVENT);
    });

    socket.on(PLAY_EVENT, (msg) => {
      console.log(PLAY_EVENT,{msg})
      init = false;

      serverCoords = msg.coords;
      isZoomed = msg.isZoomed;
      absolute = msg.absolute;
      magnetIsVisible = msg.magnetIsVisible;
      magnetCoords = msg.magnetCoords;

      socket.broadcast.emit(PLAY_EVENT, {
        coords: serverCoords,
        isZoomed: isZoomed,
        absolute: absolute,
        magnetIsVisible: magnetIsVisible,
        magnetCoords: magnetCoords,
      });
      console.log(
        "PLAY_EVENT",
        {
          coords: serverCoords,
          isZoomed: isZoomed,
          absolute: absolute,
          magnetCoords: magnetCoords,
          magnetIsVisible: magnetIsVisible,
        }
      );
    });

    socket.on(LOGING_EVENT,(msg)=>{
      const message = JSON.stringify(msg);

      logmessage = msg.date + "," + msg.socketID + "," + msg.explicitID + "," + msg.command + "," + "["+msg.coords.lx + "," +msg.coords.ly + "," +msg.coords.rx + "," + msg.coords.ry + "]";

      appendlog(logfile_name,logmessage);
    });

    socket.on("disconnect", (reason) => {
      console.info({ reason });
      coords = [];
      console.log("byebye");
    });

    socket.on("error", (err) => {
      console.error({ err });
    });
  });
};
