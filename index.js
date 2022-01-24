const express = require('express');
const router = express.Router();

var multer = require('multer');
var storage = multer.diskStorage({
  //ファイルの保存先を指定(ここでは保存先は./public/images) 
  //Express4の仕様かなんかで画像staticなファイルを保存するときはpublic/以下のフォルダに置かないとダメらしい
  //詳しくは express.static public でググろう！
  destination: function(req, file, cb){
    cb(null, './public/pdf/')
  },
  //ファイル名を指定
  filename: function(req, file, cb){
    cb(null, 'upload.pdf')
  }
})

var upload = multer({storage: storage})
//*** 追加1 ここまで ***//

router.get('/', (req, res, next) => {
    res.render('index', {
        title: 'OnePage2_BETA',
        recorder : {href : '/recorder', text : 'OnePageRecorder'}
    }); 
});

//*** 追加2 ここから ***//
//ルート (/) に対する POST リクエスト
//name タグにfileを指定したもののみ受け付ける
router.post('/',upload.single('file'),function(req,res){
    res.redirect(302, '/');
    /*res.render("index", {
      title: "OnePage2_BETA",
      recorder: { href: "/recorder", text: "OnePageRecorder" },
    });*/
  });
  //*** 追加2　ここまで ***//




module.exports = router;