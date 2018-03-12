'use strict';
const router = require('express').Router();
const Promise = require('bluebird');
const jwt = require('jsonwebtoken');
const resError = require('../respond-error');
const middleware = require('../middleware');
const User = require('../models/user');
const Post = require('../models/post');

let localTemp = {};

router.param('postID', (req, res, next, postID) => {
	return new Promise((resolve, reject) => {
		Post
		.findById(req.params.postID, (err, post) => {
			if(err) reject(err);
			resolve(post);
		});
	}).then((post) => {
		if(!post) resError(res, 404, 'The requested post cannot be found.');
		localTemp.post = post;
		return next();
	}).catch((err) => {
		return next(err);
	});
});
router.param('commentID', (req, res, next, commentID) => {
	return new Promise((resolve, reject) => {
		Post
		.findById(req.params.commentID, (err, comment) => {
			if(err) reject(err);
			resolve(comment);
		});
	}).then((comment) => {
		if(!comment) resError(res, 404, 'The requested comment cannot be found.');
		localTemp.post.comment = comment;
		return next();
	}).catch((err) => {
		return next(err);
	});
});

router.route('/')
.get((req, res, next) => {
	return new Promise((resolve, reject) => {
		Post
		.find({userID: req.userID})
		.sort({createdAt: -1})
		.exec((err, posts) => {
			if(err) reject(err);
			resolve(posts);
		});
	}).then((posts) => {
		if(!posts) resError(res, 404, 'The requested posts cannot be found.');
		return res.json(posts);
	}).catch((err) => {
		return next(err);
	});
})
.post((req, res, next) => {
	return new Promise((resolve, reject) => {
		req.body.userID = req.userID;
		new Post(req.body)
		.save((err, post) => {
			if(err) return reject(err);
			return resolve(post);
		});
	}).then((post) => {
		return res.status(201).json(post);
	}).catch((err) => {
		return next(err);
	});
});

router.route('/:postID')
.get((req, res, next) => {
	return res.status(200).json(localTemp.post);
})
.put(middleware.verifyUser, (req, res, next) => {
	return new Promise((resolve, reject) => {
		localTemp.post.comment
		.update(req.body, (err, comment) => {
			if(err) return reject(err);
			return resolve(comment);
		});
	}).then((comment) => {
		return res.json(comment);
	}).catch((err) => {
		return next(err);
	});
})
.delete(middleware.verifyUser, (req, res, next) => {
	return new Promise((resolve, reject) => {
		localTemp.post.comment
		.remove((err, comment) => {
			if(err) return reject(err);
			return resolve(comment);
		});
	}).then((comment) => {
		return res.json({"deleted": comment});
	}).catch((err) => {
		return next(err);
	});
});

router.route('/:postID/vote-:direction')
.post(middleware.validVote, (req, res, next) => {
	return new Promise((resolve, reject) => {
		localTemp.post
		.vote(req.params.direction, (err, post) => {
			if(err) return reject(err);
			return resolve(post);
		});
	}).then((post) => {
		return res.json(post);
	}).catch((err) => {
		return next(err);
	});
});

router.route('/:postID/comments')
.get((req, res, next) => {
	return new Promise((resolve, reject) => {
		console.dir({post: localTemp.post});
		Post
		.find({parentPostID: localTemp.post._id})
		.sort({createdAt: -1})
		.exec((err, posts) => {
			if(err) return reject(err);
			else return resolve(posts);
		})
	}).then((posts) => {
		return res.status(201).json(posts);
	}).catch((err) => {
		return next(err);
	});
})
.post((req, res, next) => {
	return new Promise((resolve, reject) => {
		req.body.userID = localTemp.post.userID;
		req.body.parentPostID = localTemp.post._id;
		new Post(req.body)
		.save((err, post) => {
			if(err) return reject(err);
			return resolve(post);
		});
	}).then((post) => {
		return res.status(201).json(post);
	}).catch((err) => {
		return next(err);
	});
});

router.route('/:postID/comments/:commentID')
.get((req, res, next) => {
	return res.json(localTemp.post.comment);
})
.put(middleware.verifyUser, (req, res, next) => {
	return new Promise((resolve, reject) => {
		localTemp.post.comment
		.update(req.body, (err, comment) => {
			if(err) return reject(err);
			return resolve(comment);
		});
	}).then((comment) => {
		return res.json(comment);
	}).catch((err) => {
		return next(err);
	});
})
.delete(middleware.verifyUser, (req, res, next) => {
	return new Promise((resolve, reject) => {
		localTemp.post.comment
		.remove((err, comment) => {
			if(err) return reject(err);
			return resolve(comment);
		});
	}).then((comment) => {
		return res.json({"deleted": comment});
	}).catch((err) => {
		return next(err);
	});
});

router.route('/:postID/comments/:commentID/vote-:direction')
.post(middleware.validVote, (req, res, next) => {
	return new Promise((resolve, reject) => {
		localTemp.post.comment
		.vote(req.params.direction, (err, comment) => {
			if(err) return reject(err);
			return resolve(comment);
		});
	}).then((comment) => {
		return res.json(comment);
	}).catch((err) => {
		return next(err);
	});
});

module.exports = router;