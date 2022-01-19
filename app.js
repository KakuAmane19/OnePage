const path = require('path');
const bodyParser = require('body-parser');
const logger = require('morgan');
const rfs = require('rotating-file-stream');
const express = require('express');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const http = require('http').createServer(app);

const indexRouter = require('./index');
const oldIndexRouter = require('./old_index');
const recorderRouter = require('./recorder');


const accessLogStream = rfs.createStream('access.log', {
    size: '10MB',
    interval: '30d',
    compress: 'gzip',
    path: __dirname
});

require('./modules/socket')(http);
const port = process.env.PORT || 3000;


app.use(logger(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]', {
    stream: accessLogStream
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/old_index', oldIndexRouter);
app.use('/recorder', recorderRouter);

http.listen(port, () => {
    console.log(`server start: http://localhost:${port}`);
});

http.on('error', err => {
    throw err;
});

app.use((req, res, next) => {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
if (app.get('env') === 'development') {
    app.use((err, req, res, next) => {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});