'use strict';
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const Promise = require('bluebird');
const helmet = require('helmet');
const Limiter = require('express-rate-limit');
const middleware = require('./middleware');

// const dbURI = 'mongodb://social:qwerty_123@ds111319.mlab.com:11319/social';
const dbURI = 'mongodb://127.0.0.1:27017/social';

mongoose.connect(dbURI)
	.then(() => {console.log('You have been successfully connected to the database.')})
	.catch((err) => console.error(`connection error: ${err}`));
const db = mongoose.connection;
db.on('error', (err) => console.error(`connection error: ${err}`));

const app = express();
const [HOST, PORT] = ['127.0.0.1', process.env.PORT || 3000];

const accessLogStream = fs.createWriteStream(
	path.join(__dirname, '../localData/logStream.log'),
	{flags: 'a'}
);
app.use(logger('dev', {stream: accessLogStream}));
app.use(logger('dev'));

app.use(bodyParser.json());
app.use(helmet());

app.use(middleware.cors);

app.use(new Limiter({
	windowMs: 5 * 60 * 1000, // 5 minutes
	max: 200, // limit each IP to 100 requests per windowMs
	delayMs: 2 * 1000, // disable delaying - full speed until the max limit is reached
	delayAfter: 5
}));

app.use('/', require('./routes'));
app.use('/users', middleware.verifyToken, require('./routes/userRoutes'));
app.use('/admins', middleware.verifyToken, middleware.isAdmin, require('./routes/adminRoutes'));

app.use((req, res, next) => {
	const err = new Error('The requested page cannot be found.');
	err.status = 404;
	next(err);
});

app.use((err, req, res, next) => {
	console.error(err);
	res
		.status(err.status || 500)
		.json({
			error: {message: err.message}
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