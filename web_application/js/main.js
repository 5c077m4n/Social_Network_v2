'use strict';
const https = require('https');
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const express = require('express');
const Promise = require('bluebird');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const logger = require('morgan');
const Limiter = require('express-rate-limit');
const compress = require('compression');
const middleware = require('./middleware');

const app = express();
const [HOST, PORT] = ['127.0.0.1', process.env.PORT || 3001];

// const dbURI = 'mongodb://social:qwerty_123@ds211289.mlab.com:11289/sessions';
const dbURI = 'mongodb://127.0.0.1:27017/sessions';

mongoose.connect(dbURI)
	.then(() => {console.log('You have been successfully connected to the database.')})
	.catch((err) => console.error(`Connection error: ${err}`));
const db = mongoose.connection;
db.on('error', (err) => console.error(`Connection error: ${err}`));

app.use((req, res, next) => {
	req.connection.setNoDelay(true);
	next();
});

app.use(compress({
	filter: (req, res, next) => {
		// don't compress responses with this request header
		if (req.headers['x-no-compression']) return false;
		// fallback to standard filter function
		return compress.filter(req, res);
	  },
	  level: 6
}));

app.use(session({
	secret: crypto.randomBytes(32).toString('hex'),
	duration: 30 * 60 * 1000,
	activeDuration: 10 * 60 * 1000,
	resave: true,
	saveUninitialized: false,
	store: new MongoStore({
		mongooseConnection: db
	})
}));

app.use(new Limiter({
	windowMs: 5 * 60 * 1000, // 5 minutes
	max: 200, // limit each IP to 100 requests per windowMs
	delayMs: 2 * 1000, // disable delaying - full speed until the max limit is reached
	delayAfter: 5
}));

app.use(logger('dev', {
	stream: fs.createWriteStream(path.join(__dirname, '../localData/logStream.log'), {flags: 'a'})
}));
app.use(logger('dev'));

// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(express.static(__dirname + '/../public', {
	immutable: true,
	maxAge: 2 * 24 * 60 * 60 * 1000
}));

// view engine setup
app.set('view engine', 'pug');
app.set('views', __dirname + '/../views');

app.use('/', require('./routes'));
app.use('/user', middleware.requiresLogin, require('./routes/userRoutes'));
app.use('/admin', middleware.requiresLogin, middleware.isAdmin, require('./routes/adminRoutes'));

app.use((req, res, next) => {
	let err = new Error('File Not Found');
	err.status = 404;
	next(err);
});

app.use((err, req, res, next) => {
	res.status(err.status || 500);
	res.render('error', {
		message: `${err.status} - ${err.message}`
	});
});

http
	.createServer(app)
	.listen(PORT, () => console.log(`Express is now running on http://${HOST}:${PORT}`))
	.on('error', function(err) {
		console.error(`Connection error: ${err}`);
		this.close(() => {
			console.error(`The connection has been closed.`);
			process.exit(-2);
		});
	});
// https
// 	.createServer({
// 		key: fs.readFileSync(__dirname + '/serverOptions/privatekey.pem'),
// 		ca: fs.readFileSync(__dirname + '/serverOptions/certauthority.pem'),
// 		cert: fs.readFileSync(__dirname + '/serverOptions/certificate.pem')
// 	}, app)
// 	.listen(PORT+10, () => console.log(`Express is now running on https://${HOST}:${PORT+10}`))
// 	.on('error', function(err) {
// 		console.error(`connection error: ${err}`);
// 		this.close(() => {
// 			console.error(`The connection has been closed.`);
// 			process.exit(-2);
// 		});
// 	});