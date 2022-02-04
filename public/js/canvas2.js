/**
 * 変数宣言
 */

//コンテキスト
let pdfContext;
let redFlameContext;
let blueFlameContext;
let surfaceContext;
//canvas
let pdfCanvas;
let redFlameCanvas;
let blueFlameCanvas;
let surfaceCanvas;

//マグネット
let magnet;
let magnetContext;
let magnetCoords = [0, 0];
let magnetIsVisible = false;
/******************************/
/*PDFレンダリング関係
 */
//取得したpdfのページ
let pdfPage;
//pdfのレンダリング情報
let viewportParametors;
//render for pdf text
let renderContext;
//大きかった時の補正用拡大率
let defaultScale = 1.0;
let scale = 1.0;

let isZoomed = false;
/******************************/
/*Socket
 */
const ENTER_EVENT = "ENTER_EVENT";
const DROP_EVENT = "DROP_EVENT";
const ZOOM_EVENT = "ZOOM_EVENT";
const SYNC_EVENT = "SYNC_EVENT";
const MAGNET_EVENT = "MAGNET_EVENT";
const PLAY_EVENT = "PLAY_EVENT";
const QUESTION_EVENT = "QUESTION_EVENT";

const socket = io();
/******************************/
/*拡大座標データ:テキストボックスから取得
  /*書式は『<フェーズ数>:(<左上x>,<左上y>),(<右下x>,<右下y>)
  */
let shared = {
  isLocal: false,
  init: true,
  changeInZoom: false,
  lx: 0,
  ly: 0,
  rx: 0,
  ry: 0,
};

let local = {
  isLocal: true,
  init: true,
  lx: 0,
  ly: 0,
  rx: 0,
  ry: 0,
};

let absolute = {
  isLocal: true,
  lx: 0,
  ly: 0,
  rx: 0,
  ry: 0,
};

let selectSwitch; //好きに見るボタン
/******************************/

/**
 * 初期化
 */
window.onload = function () {
  pdfCanvas = document.getElementById("pdf_canvas");
  if (!pdfCanvas || !pdfCanvas.getContext) {
    return false;
  }
  pdfContext = pdfCanvas.getContext("2d");
  selectSwitch = document.getElementById("selectButton");

  drawMagnet(30);
};
/**
 * 枠表示
 */
function showFlame(coords) {
  let flame = {
    lx: coords.lx,
    ly: coords.ly,
    rx: coords.rx,
    ry: coords.ry,
  };

  //console.log({coords},{isZoomed},{absolute},{surface},{flame});
  if (isZoomed) {
    //拡大写像

    scale =
      pdfCanvas.width / (absolute.rx - absolute.lx) <
      pdfCanvas.height / (absolute.ry - absolute.ly)
        ? pdfCanvas.width / (absolute.rx - absolute.lx)
        : pdfCanvas.height / (absolute.ry - absolute.ly);

    flame.rx = (-absolute.lx + coords.rx) * scale;
    flame.ry = (-absolute.ly + coords.ry) * scale;
    flame.lx = (coords.lx - absolute.lx) * scale;
    flame.ly = (coords.ly - absolute.ly) * scale;

    console.log("after:", { flame }, { coords }, { isZoomed }, { absolute });
  }

  if (coords.isLocal) {
    redFlameContext.clearRect(
      0,
      0,
      redFlameCanvas.width,
      redFlameCanvas.height
    );
    blueFlameContext.clearRect(
      0,
      0,
      blueFlameCanvas.width,
      blueFlameCanvas.height
    );
    blueFlameContext.strokeStyle = "#00f";
    blueFlameContext.strokeRect(
      flame.lx,
      flame.ly,
      flame.rx - flame.lx,
      flame.ry - flame.ly
    );
  } else {
    blueFlameContext.clearRect(
      0,
      0,
      blueFlameCanvas.width,
      blueFlameCanvas.height
    );
    redFlameContext.clearRect(
      0,
      0,
      redFlameCanvas.width,
      redFlameCanvas.height
    );
    redFlameContext.strokeStyle = "#f00";
    redFlameContext.strokeRect(
      flame.lx,
      flame.ly,
      flame.rx - flame.lx,
      flame.ry - flame.ly
    );
  }
}

/**
 * Socket通信
 */
(async () => {
  if (Object.isExtensible(socket)) {
    /*入室確認*/
    socket.emit(ENTER_EVENT, {
      message: "Hello! from OnePage_Ver2",
    });
  }

  /*座標・拡大状況受信*/
  socket.on(DROP_EVENT, (msg) => {
    console.log(DROP_EVENT, { msg });

    shared.lx = msg.coords[0];
    shared.ly = msg.coords[1];
    shared.rx = msg.coords[2];
    shared.ry = msg.coords[3];

    if (!isZoomed && msg.isZoomed) socket.emit(ZOOM_EVENT, "Expansion");

    //反転チェック
    if (shared.rx < shared.lx) return;
    if (shared.ry < shared.ly) return;

    if (shared.rx - shared.lx < 10 || shared.ry - shared.ly < 10) return;

    if (!selectSwitch.checked) showFlame(shared);
  });

  /*拡大縮小*/
  socket.on(ZOOM_EVENT, (msg) => {
    //誰かがZOOM押したとき
    console.log(ZOOM_EVENT, { msg });

    if (selectSwitch.checked) return;
    let square = {
      sx: 0,
      sy: 0,
      sw: 0,
      sh: 0,
    };

    let magnetX = msg.magnetCoords[0];
    let magnetY = msg.magnetCoords[1];

    if (msg.command == "Expansion") {
      square.sx = shared.lx;
      square.sy = shared.ly;
      square.sw = shared.rx - shared.lx;
      square.sh = shared.ry - shared.ly;

      absolute.lx = msg.absolute[0];
      absolute.ly = msg.absolute[1];
      absolute.rx = msg.absolute[2];
      absolute.ry = msg.absolute[3];
      absolute.isLocal = shared.isLocal;

      //ボタンのテキストの張り替え
      document.getElementById("zoominout").textContent = "縮小";
      isZoomed = true;

      //描画
      pdfContext.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
      redFlameContext.clearRect(
        0,
        0,
        redFlameCanvas.width,
        redFlameCanvas.height
      );
      blueFlameContext.clearRect(
        0,
        0,
        blueFlameCanvas.width,
        blueFlameCanvas.height
      );

      let scale =
        pdfCanvas.width / square.sw < pdfCanvas.height / square.sh
          ? pdfCanvas.width / square.sw
          : pdfCanvas.height / square.sh;

      viewportParametors = {
        scale: scale * defaultScale,
        rotation: 0.0,
        offsetX: -square.sx * scale,
        offsetY: -square.sy * scale,
        dontFlip: false,
      };
      var viewport = pdfPage.getViewport(viewportParametors);
      var renderContext = {
        canvasContext: pdfContext,
        viewport: viewport,
      };
      pdfPage.render(renderContext).promise.then(function () {
        redFlameContext.strokeStyle = "#f00";
        redFlameContext.strokeRect(0, 0, square.sw * scale, square.sh * scale);

        //マグネット処
        if (
          shared.lx <= magnetX &&
          shared.ly <= magnetY &&
          magnetX + magnet.width <= shared.rx &&
          magnetY + magnet.height <= shared.ry
        ) {
          //見かけの拡大表
          magnet.style.left = parseInt((magnetX - absolute.lx) * scale) + "px";
          magnet.style.top = parseInt((magnetY - absolute.ly) * scale) + "px";

          /*socket.emit(MAGNET_EVENT, {
            magnetCoords: magnetCoords,
            magnetIsVisible: true,
            row: 277,
          });*/
          magnetCoords = msg.magnetCoords;
          
          drawMagnet(parseInt(30 * scale));
          console.log(
            magnet.style.left + ":" + magnet.style.top,
            "scale" + scale
          );
        } else {
          let magnetState = document.getElementById("magnet").classList;
          magnetState.add("invisible");
          /*socket.emit(MAGNET_EVENT, {
            magnetCoords: magnetCoords,
            magnetIsVisible: false,
            row: 291,
          });*/
          console.log("magnet become invisible");
        }
      });
    } else {
      //ボタンのテキストの張り替え
      document.getElementById("zoominout").textContent = "拡大";
      isZoomed = false;

      //pdf再描画
      pdfContext.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
      redFlameContext.clearRect(
        0,
        0,
        redFlameCanvas.width,
        redFlameCanvas.height
      );
      blueFlameContext.clearRect(
        0,
        0,
        blueFlameCanvas.width,
        blueFlameCanvas.height
      );
      viewportParametors = {
        scale: defaultScale,
        rotation: 0.0,
        offsetX: 0,
        offsetY: 0,
        dontFlip: false,
      };
      var viewport = pdfPage.getViewport(viewportParametors);
      var renderContext = {
        canvasContext: pdfContext,
        viewport: viewport,
      };

      pdfPage.render(renderContext).promise.then(function () {
        scale =
          pdfCanvas.width / (absolute.rx - absolute.lx) <
          pdfCanvas.height / (absolute.ry - absolute.ly)
            ? pdfCanvas.width / (absolute.rx - absolute.lx)
            : pdfCanvas.height / (absolute.ry - absolute.ly);

        let magnetState = document.getElementById("magnet").classList;
        if (magnetState.contains("invisible")) {
          magnetState.remove("invisible");
          magnet.style.left = magnetX + "px";
          magnet.style.top = magnetY + "px";
        } else {
          console.log(
            magnet.style.left,
            magnet.style.top,
            scale,
            magnet.getBoundingClientRect().x,
            magnet.getBoundingClientRect().y,
            pdfCanvas.getBoundingClientRect().y
          );
          tempX = magnet.getBoundingClientRect().x;
          tempY =
            magnet.getBoundingClientRect().y -
            pdfCanvas.getBoundingClientRect().y;
          magnet.style.left = tempX / scale + absolute.lx + "px";
          magnet.style.top = tempY / scale + absolute.ly + "px";
        }

        /*socket.emit(MAGNET_EVENT, {
          magnetCoords: magnetCoords,
          magnetIsVisible: true,
          row: 359,
        });*/
        
        magnetCoords = msg.magnetCoords;

        drawMagnet(30);

        absolute.lx = 0;
        absolute.ly = 0;
        absolute.rx = pdfCanvas.width;
        absolute.ry = pdfCanvas.height;
        absolute.isLocal = shared.isLocal;

        showFlame(shared);
      });
    }
  });

  socket.on(SYNC_EVENT, (msg) => {
    //local=>sharedの切り替え

    console.log({ msg });

    shared.init = msg.init;
    if (!shared.init) document.getElementById("zoominout").disabled = false;

    shared.lx = msg.coords[0];
    shared.ly = msg.coords[1];
    shared.rx = msg.coords[2];
    shared.ry = msg.coords[3];

    absolute.lx = msg.absolute[0];
    absolute.ly = msg.absolute[1];
    absolute.rx = msg.absolute[2];
    absolute.ry = msg.absolute[3];
    absolute.isLocal = false;

    let square = {
      sx: 0,
      sy: 0,
      sw: 0,
      sh: 0,
    };

    if (msg.isZoomed) {
      square.sx = msg.absolute[0];
      square.sy = msg.absolute[1];
      square.sw = msg.absolute[2] - msg.absolute[0];
      square.sh = msg.absolute[3] - msg.absolute[1];

      //ボタンのテキストの張り替え
      document.getElementById("zoominout").textContent = "縮小";
      isZoomed = true;

      //描画
      pdfContext.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
      redFlameContext.clearRect(
        0,
        0,
        redFlameCanvas.width,
        redFlameCanvas.height
      );
      blueFlameContext.clearRect(
        0,
        0,
        blueFlameCanvas.width,
        blueFlameCanvas.height
      );

      let scale =
        pdfCanvas.width / square.sw < pdfCanvas.height / square.sh
          ? pdfCanvas.width / square.sw
          : pdfCanvas.height / square.sh;

      viewportParametors = {
        scale: scale * defaultScale,
        rotation: 0.0,
        offsetX: -square.sx * scale,
        offsetY: -square.sy * scale,
        dontFlip: false,
      };
      viewport = pdfPage.getViewport(viewportParametors);
      renderContext = {
        canvasContext: pdfContext,
        viewport: viewport,
      };
      pdfPage.render(renderContext).promise.then(function () {
        /*
          redFlameContext.strokeStyle = '#f00';
          redFlameContext.strokeRect(0,0,(shared.rx - shared.lx)*scale,(shared.ry - shared.ly)*scale);
          */
        showFlame(shared);

        //マグネット処理
        let magnetX = msg.magnetCoords[0];
        let magnetY = msg.magnetCoords[1];
        let magnetState = document.getElementById("magnet").classList;

        if (msg.magnetIsVisible) {
          //見かけの拡大表
          magnetState.remove("invisible");
          drawMagnet(parseInt(30 * scale));
          magnetCoords[0] = magnetX;
          magnetCoords[1] = magnetY;
          magnet.style.left = (magnetX - absolute.lx) * scale + "px";
          magnet.style.top = (magnetY - absolute.ly) * scale + "px";

        } else {
          magnetCoords[0] = magnetX;
          magnetCoords[1] = magnetY;
          magnet.style.left = magnetCoords[0] + "px";
          magnet.style.top = magnetCoords[1] + "px";
          magnetState.add("invisible");
        }
      });
    } else {
      //ボタンのテキストの張り替え
      document.getElementById("zoominout").textContent = "拡大";
      isZoomed = false;

      //pdf再描画
      pdfContext.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
      redFlameContext.clearRect(
        0,
        0,
        redFlameCanvas.width,
        redFlameCanvas.height
      );
      blueFlameContext.clearRect(
        0,
        0,
        blueFlameCanvas.width,
        blueFlameCanvas.height
      );
      viewportParametors = {
        scale: defaultScale,
        rotation: 0.0,
        offsetX: 0,
        offsetY: 0,
        dontFlip: false,
      };
      var viewport = pdfPage.getViewport(viewportParametors);
      var renderContext = {
        canvasContext: pdfContext,
        viewport: viewport,
      };

      pdfPage.render(renderContext).promise.then(function () {
        drawMagnet(30);
        magnet.style.left = msg.magnetCoords[0] + "px";
        magnet.style.top = msg.magnetCoords[1] + "px";

        //枠の描画
        showFlame(shared);
      });
    }
  });

  socket.on(MAGNET_EVENT, (msg) => {
    //マグネットの表示同期

    let magnetState = document.getElementById("magnet").classList;

    if (msg.magnetIsVisible) magnetState.remove("invisible");
    else magnetState.add("invisible");

    magnetCoords = msg.magnetCoords;

    if (isZoomed) {
      let scale =
        pdfCanvas.width / (absolute.rx - absolute.lx) <
        pdfCanvas.height / (absolute.ry - absolute.ly)
          ? pdfCanvas.width / (absolute.rx - absolute.lx)
          : pdfCanvas.height / (absolute.ry - absolute.ly);
      magnet.style.left = (magnetCoords[0] - absolute.lx) * scale + "px";
      magnet.style.top = (magnetCoords[1] - absolute.ly) * scale + "px";
    } else {
      magnet.style.left = magnetCoords[0] + "px";
      magnet.style.top = magnetCoords[1] + "px";
    }

    console.log("MAGNET:", { msg });
  });

  socket.on(QUESTION_EVENT, (msg) => {
    //マグネットの表示同期
    let magnetState = document.getElementById("magnet").classList;

    if (magnetState.contains("blink")) magnetState.remove("blink");
    else magnetState.add("blink");
  });

  socket.on(PLAY_EVENT, (msg) => {
    //Recorderからの受信
    console.log(PLAY_EVENT, { msg });

    if (selectSwitch.checked) return;

    shared.lx = msg.coords[0];
    shared.ly = msg.coords[1];
    shared.rx = msg.coords[2];
    shared.ry = msg.coords[3];

    absolute.lx = msg.absolute[0];
    absolute.ly = msg.absolute[1];
    absolute.rx = msg.absolute[2];
    absolute.ry = msg.absolute[3];
    absolute.isLocal = false;

    let square = {
      sx: 0,
      sy: 0,
      sw: 0,
      sh: 0,
    };

    if (msg.isZoomed) {
      square.sx = msg.absolute[0];
      square.sy = msg.absolute[1];
      square.sw = msg.absolute[2] - msg.absolute[0];
      square.sh = msg.absolute[3] - msg.absolute[1];

      //ボタンのテキストの張り替え
      document.getElementById("zoominout").textContent = "縮小";
      isZoomed = true;

      //描画
      pdfContext.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
      redFlameContext.clearRect(
        0,
        0,
        redFlameCanvas.width,
        redFlameCanvas.height
      );
      blueFlameContext.clearRect(
        0,
        0,
        blueFlameCanvas.width,
        blueFlameCanvas.height
      );

      let scale =
        pdfCanvas.width / square.sw < pdfCanvas.height / square.sh
          ? pdfCanvas.width / square.sw
          : pdfCanvas.height / square.sh;

      viewportParametors = {
        scale: scale * defaultScale,
        rotation: 0.0,
        offsetX: -square.sx * scale,
        offsetY: -square.sy * scale,
        dontFlip: false,
      };
      viewport = pdfPage.getViewport(viewportParametors);
      renderContext = {
        canvasContext: pdfContext,
        viewport: viewport,
      };
      pdfPage.render(renderContext).promise.then(function () {
        /*
          redFlameContext.strokeStyle = '#f00';
          redFlameContext.strokeRect(0,0,(shared.rx - shared.lx)*scale,(shared.ry - shared.ly)*scale);
          */
        showFlame(shared);

        //マグネット処理
        let magnetX = msg.magnetCoords[0];
        let magnetY = msg.magnetCoords[1];
        let magnetState = document.getElementById("magnet").classList;

        if (msg.magnetIsVisible) {
          magnetState.remove("invisible");
          drawMagnet(parseInt(30 * scale));
          magnetCoords[0] = magnetX;
          magnetCoords[1] = magnetY;
          magnet.style.left = (magnetX - absolute.lx) * scale + "px";
          magnet.style.top = (magnetY - absolute.ly) * scale + "px";
        } else {
          magnetCoords[0] = magnetX;
          magnetCoords[1] = magnetY;
          magnet.style.left = magnetCoords[0] + "px";
          magnet.style.top = magnetCoords[1] + "px";
          magnetState.add("invisible");
        }
      });
    } else {
      //ボタンのテキストの張り替え
      document.getElementById("zoominout").textContent = "拡大";
      isZoomed = false;

      //pdf再描画
      pdfContext.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
      redFlameContext.clearRect(
        0,
        0,
        redFlameCanvas.width,
        redFlameCanvas.height
      );
      blueFlameContext.clearRect(
        0,
        0,
        blueFlameCanvas.width,
        blueFlameCanvas.height
      );
      viewportParametors = {
        scale: defaultScale,
        rotation: 0.0,
        offsetX: 0,
        offsetY: 0,
        dontFlip: false,
      };
      var viewport = pdfPage.getViewport(viewportParametors);
      var renderContext = {
        canvasContext: pdfContext,
        viewport: viewport,
      };

      pdfPage.render(renderContext).promise.then(function () {
        drawMagnet(30);
        magnet.style.left = msg.magnetCoords[0] + "px";
        magnet.style.top = msg.magnetCoords[1] + "px";

        //枠の描画
        showFlame(shared);
      });
    }
  });
})();

/**
 * Pdf初期レンダリング
 */
// URL of PDF document
let url = "../pdf/upload.pdf";

// Asynchronous download PDF
pdfjsLib
  .getDocument(url)
  .promise.then(function (pdf) {
    return pdf.getPage(1);
  })
  .then(function (page) {
    // Set scale (zoom) level

    viewportParametors = {
      scale: 1.0,
      rotation: 0.0,
      offsetX: 0,
      offsetY: 0,
      dontFlip: false,
    };

    // Get viewport (dimensions)
    let viewport = page.getViewport(viewportParametors);

    // Set dimensions to Canvas
    //if(viewport.width > 1000){
    //n = vw/1000
    pdfCanvas.height = viewport.height * (1000 / viewport.width);
    pdfCanvas.width = 1000;

    viewportParametors.scale = 1000 / viewport.width;
    defaultScale = 1000 / viewport.width;
    viewport = page.getViewport(viewportParametors);
    //}else{
    //pdfCanvas.height = viewport.height;
    //pdfCanvas.width = viewport.width;
    //}

    // Prepare object needed by render method
    var renderContext = {
      canvasContext: pdfContext,
      viewport: viewport,
    };

    // Render PDF page
    page.render(renderContext);
    pdfPage = page;

    //pdfの大きさを赤枠(Shared)
    redFlameCanvas = document.getElementById("red_rect");
    if (!redFlameCanvas || !redFlameCanvas.getContext) {
      return false;
    }
    redFlameCanvas.setAttribute("width", pdfCanvas.width);
    redFlameCanvas.setAttribute("height", pdfCanvas.height);
    redFlameContext = redFlameCanvas.getContext("2d");

    //pdfの大きさを赤枠(local)
    blueFlameCanvas = document.getElementById("blue_rect");
    if (!blueFlameCanvas || !blueFlameCanvas.getContext) {
      return false;
    }
    blueFlameCanvas.setAttribute("width", pdfCanvas.width);
    blueFlameCanvas.setAttribute("height", pdfCanvas.height);
    blueFlameContext = blueFlameCanvas.getContext("2d");

    absolute.lx = 0;
    absolute.ly = 0;
    absolute.rx = pdfCanvas.width;
    absolute.ry = pdfCanvas.height;

    prepareSurface();
  });

/******************************/

let surface = {
  lx: 0,
  ly: 0,
  rx: 0,
  ry: 0,
};

function prepareSurface() {
  //面キャンバス(Shared)
  surfaceCanvas = document.getElementById("surface_rect");
  if (!surfaceCanvas || !surfaceCanvas.getContext) {
    return false;
  }
  surfaceCanvas.setAttribute("width", pdfCanvas.width);
  surfaceCanvas.setAttribute("height", pdfCanvas.height);
  surfaceContext = surfaceCanvas.getContext("2d");
  surfaceContext.globalAlpha = 0.5;
}

function drawSurface() {
  surfaceContext.clearRect(0, 0, surfaceCanvas.width, surfaceCanvas.height);
  surfaceContext.fillStyle = "#0f0";
  surfaceContext.fillRect(
    surface.lx,
    surface.ly,
    surface.rx - surface.lx,
    surface.ry - surface.ly
  );
}

/**
 * 範囲選択
 */
let startx, starty; //面開始地点の座標
let dragging, gripping; //ドラッグ中か否か

function onClick(e) {
  var offsetX = pdfCanvas.getBoundingClientRect().x;
  var offsetY = pdfCanvas.getBoundingClientRect().y;

  var magnetX = magnet.getBoundingClientRect().left;
  var magnetY = magnet.getBoundingClientRect().top;

  var x = e.clientX - offsetX;
  var y = e.clientY - offsetY;

  if (
    gripping ||
    (magnetX - offsetX <= x &&
      magnetY - offsetY <= y &&
      x <= magnetX - offsetX + magnet.width &&
      y <= magnetY - offsetY + magnet.height)
  ) {
    console.log("click magnet");

    if (gripping) {
      gripping = false;

      //移動処理

      magnet.style.top = y - magnet.height / 2 + "px";
      magnet.style.left = x - magnet.width / 2 + "px";

      var scale =
        pdfCanvas.width / (absolute.rx - absolute.lx) <
        pdfCanvas.height / (absolute.rx - absolute.ly)
          ? pdfCanvas.width / (absolute.rx - absolute.lx)
          : pdfCanvas.height / (absolute.rx - absolute.ly);

      if (isZoomed) {
        magnetCoords[0] = parseInt(
          (x - magnet.width / 2) / scale + absolute.lx
        );
        magnetCoords[1] = parseInt(
          (y - magnet.height / 2) / scale + absolute.ly
        );
      } else {
        magnetCoords[0] = x - magnet.width / 2;
        magnetCoords[1] = y - magnet.height / 2;
      }

      socket.emit(MAGNET_EVENT, {
        magnetCoords: magnetCoords,
        magnetIsVisible: true,
        row: 850,
      });
      drawMagnet(30 * scale);
    } else {
      var scale =
        pdfCanvas.width / (absolute.rx - absolute.lx) <
        pdfCanvas.height / (absolute.rx - absolute.ly)
          ? pdfCanvas.width / (absolute.rx - absolute.lx)
          : pdfCanvas.height / (absolute.rx - absolute.ly);

      gripping = true;
      //マグネット移動開始点登録
      startx = x;
      starty = y;
      drawMagnet(30 * scale);
    }
  } else if (
    0 <= x &&
    0 <= y &&
    x <= pdfCanvas.width &&
    y <= pdfCanvas.height
  ) {
    console.log("click Canvas");
    surfaceContext.clearRect(0, 0, surfaceCanvas.width, surfaceCanvas.height);

    if (dragging) {
      //選択完了処理
      dragging = false;
      window.removeEventListener("mousemove", onMove, false);

      //反転チェック
      if (x + 10 < startx || y + 10 < starty) return;

      surface.lx = parseInt(startx);
      surface.ly = parseInt(starty);
      surface.rx = parseInt(x);
      surface.ry = parseInt(y);

      console.log("bedoreDROP", { surface }, { absolute });

      if (isZoomed) {
        scale =
          pdfCanvas.width / (absolute.rx - absolute.lx) <
          pdfCanvas.height / (absolute.ry - absolute.ly)
            ? pdfCanvas.width / (absolute.rx - absolute.lx)
            : pdfCanvas.height / (absolute.ry - absolute.ly);

        if (selectSwitch.checked) {
          absolute.isLocal = local.isLocal;

          //枠の写像
          local.rx = absolute.lx + surface.rx / scale;
          local.ry = absolute.ly + surface.ry / scale;

          local.lx = surface.lx / scale + absolute.lx;
          local.ly = surface.ly / scale + absolute.ly;
        } else {
          absolute.isLocal = shared.isLocal;

          //枠の写像
          shared.rx = absolute.lx + surface.rx / scale;
          shared.ry = absolute.ly + surface.ry / scale;

          shared.lx = surface.lx / scale + absolute.lx;
          shared.ly = surface.ly / scale + absolute.ly;
        }
      } else {
        if (selectSwitch.checked) {
          absolute.isLocal = local.isLocal;
          local.lx = surface.lx;
          local.ly = surface.ly;
          local.rx = surface.rx;
          local.ry = surface.ry;
        } else {
          absolute.isLocal = shared.isLocal;
          shared.lx = surface.lx;
          shared.ly = surface.ly;
          shared.rx = surface.rx;
          shared.ry = surface.ry;
        }

        absolute.lx = 0;
        absolute.ly = 0;
        absolute.rx = pdfCanvas.width;
        absolute.ry = pdfCanvas.height;
      }

      if (selectSwitch.checked) {
        if (local.init) {
          document.getElementById("zoominout").disabled = false;
          local.init = false;
        }

        showFlame(local);
      } else {
        socket.emit(DROP_EVENT, {
          coords: [shared.lx, shared.ly, shared.rx, shared.ry],
          isZoomed: isZoomed,
          absolute: [absolute.lx, absolute.ly, absolute.rx, absolute.ry],
        });
        if (shared.init) {
          document.getElementById("zoominout").disabled = false;
          shared.init = false;
        }
        showFlame(shared);
      }
      surfaceContext.clearRect(0, 0, surfaceCanvas.width, surfaceCanvas.height);
    } else {
      dragging = true;
      //選択開始処理
      startx = x;
      starty = y;
      window.addEventListener("mousemove", onMove, false);
    }
  }
}

function onMove(e) {
  var offsetX = pdfCanvas.getBoundingClientRect().x;
  var offsetY = pdfCanvas.getBoundingClientRect().y;

  var magnetX = magnet.getBoundingClientRect().left;
  var magnetY = magnet.getBoundingClientRect().top;

  var x = e.clientX - offsetX;
  var y = e.clientY - offsetY;

  //console.log({magnetX},{magnetY},{magnet},{x},{y});

  if (
    magnetX - offsetX <= x &&
    magnetY - offsetY <= y &&
    x <= magnetX - offsetX + magnet.width &&
    y <= magnetY - offsetY + magnet.height &&
    dragging
  ) {
    //magnet.getBoundingClientRect().x = x-(magnet.width/2);
    //magnet.getBoundingClientRect().y = y-(magnet.width/2);
  } else if (
    0 <= x &&
    0 <= y &&
    x <= pdfCanvas.width &&
    y <= pdfCanvas.height &&
    dragging
  ) {
    if (Math.abs(x - startx) < 10 || Math.abs(y - starty) < 10) return;

    surface.lx = startx;
    surface.ly = starty;
    surface.rx = x;
    surface.ry = y;

    drawSurface();
  }
}

window.addEventListener("click", onClick, false);

/******************************/

/**拡大ボタン */
function doZoom(e) {
  let square = {
    sx: 0,
    sy: 0,
    sw: 0,
    sh: 0,
  };

  if (!isZoomed) {
    //拡大

    if (!selectSwitch.checked) {
      absolute.lx = shared.lx;
      absolute.ly = shared.ly;
      absolute.rx = shared.rx;
      absolute.ry = shared.ry;

      socket.emit(ZOOM_EVENT, {
        command: "Expansion",
        absolute: [absolute.lx, absolute.ly, absolute.rx, absolute.ry],
      });
      return;
    }

    square.sx = local.lx;
    square.sy = local.ly;
    square.sw = local.rx - local.lx;
    square.sh = local.ry - local.ly;

    absolute.lx = local.lx;
    absolute.ly = local.ly;
    absolute.rx = local.rx;
    absolute.ry = local.ry;
    absolute.isLocal = local.isLocal;

    //ボタンのテキストの張り替え
    document.getElementById("zoominout").textContent = "縮小";
    isZoomed = true;

    //描画
    pdfContext.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
    redFlameContext.clearRect(
      0,
      0,
      redFlameCanvas.width,
      redFlameCanvas.height
    );
    blueFlameContext.clearRect(
      0,
      0,
      blueFlameCanvas.width,
      blueFlameCanvas.height
    );

    var scale =
      pdfCanvas.width / square.sw < pdfCanvas.height / square.sh
        ? pdfCanvas.width / square.sw
        : pdfCanvas.height / square.sh;

    viewportParametors = {
      scale: scale * defaultScale,
      rotation: 0.0,
      offsetX: -square.sx * scale,
      offsetY: -square.sy * scale,
      dontFlip: false,
    };
    var viewport = pdfPage.getViewport(viewportParametors);
    var renderContext = {
      canvasContext: pdfContext,
      viewport: viewport,
    };
    pdfPage.render(renderContext).promise.then(function () {
      if (selectSwitch.checked) redFlameContext.strokeStyle = "#00f";
      else redFlameContext.strokeStyle = "#f00";
      redFlameContext.strokeRect(0, 0, square.sw * scale, square.sh * scale);
    });
  } else {
    if (!selectSwitch.checked) {
      socket.emit(ZOOM_EVENT, {
        command: "Shrink",
        absolute: [absolute.lx, absolute.ly, absolute.rx, absolute.ry],
      });
      return;
    }

    square.sx = local.lx;
    square.sy = local.ly;
    square.sw = local.rx - local.lx;
    square.sh = local.ry - local.ly;

    absolute.lx = 0;
    absolute.ly = 0;
    absolute.rx = pdfCanvas.width;
    absolute.ry = pdfCanvas.height;
    absolute.isLocal = local.isLocal;

    //ボタンのテキストの張り替え
    document.getElementById("zoominout").textContent = "拡大";
    isZoomed = false;

    //pdf再描
    pdfContext.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
    redFlameContext.clearRect(
      0,
      0,
      redFlameCanvas.width,
      redFlameCanvas.height
    );
    blueFlameContext.clearRect(
      0,
      0,
      blueFlameCanvas.width,
      blueFlameCanvas.height
    );
    viewportParametors = {
      scale: defaultScale,
      rotation: 0.0,
      offsetX: 0,
      offsetY: 0,
      dontFlip: false,
    };
    var viewport = pdfPage.getViewport(viewportParametors);
    var renderContext = {
      canvasContext: pdfContext,
      viewport: viewport,
    };
    pdfPage.render(renderContext).promise.then(function () {
      showFlame(local);
    });
  }
}

/**スイッチを付け替えた瞬間の表示枠変換 */
function changeFlame(isEnable) {
  console.log(isEnable);
  let magnetState = document.getElementById("magnet").classList;

  if (isEnable) {
    showFlame(local);
    magnetState.add("local-mode");
    if (isZoomed) doZoom();
    if (local.init) document.getElementById("zoominout").disabled = true;
  } else {
    magnetState.remove("local-mode");
    socket.emit(SYNC_EVENT, [
      absolute.lx,
      absolute.ly,
      absolute.rx,
      absolute.ry,
    ]);
    showFlame(shared);
  }
}
/******************************
 
/**magnet*/
function drawMagnet(magnetR) {
  magnet = document.getElementById("magnet");
  magnet.setAttribute("width", magnetR);
  magnet.setAttribute("height", magnetR);
  magnetContext = magnet.getContext("2d");

  magnetContext.beginPath();

  magnetContext.arc(
    magnetR / 2,
    magnetR / 2,
    magnetR / 2 - 2,
    (0 * Math.PI) / 180,
    (360 * Math.PI) / 180,
    false
  );
  if (gripping) magnetContext.fillStyle = "rgba(255,255,0,0.7)";
  else magnetContext.fillStyle = "rgba(255,0,0,0.7)";
  magnetContext.fill();

  if (gripping) magnetContext.strokeStyle = "rgba(155,155,10,0.7)";
  else magnetContext.strokeStyle = "rgba(155,0,10,0.8)";
  magnetContext.lineWidth = 1;
  magnetContext.stroke();
}

function blink() {
  socket.emit(QUESTION_EVENT);
}
