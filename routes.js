'use strict';
var path = require('path');
var express = require('express');
var config = require('./config');

var comboController = require('./controller/comboController');
var loginController = require('./controller/loginController');
var weixinController = require('./controller/weixinController');
var adminController = require('./controller/adminController');
var userController = require('./controller/userController');
var starController = require('./controller/starController');
var faceController = require('./controller/faceController');
var facesetController = require('./controller/facesetController');
var nodetectController = require('./controller/nodetectController');
var uploadController = require('./controller/uploadController');
var logController = require('./controller/logController');


module.exports = function(app){
  
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/upload', express.static(path.join(__dirname, 'upload')));
  app.use('/templates', express.static(path.join(__dirname, 'templates')));
  require('nunjucks/src/globals').basepath = "";
  
  app.get(['/combo', /\/combo.*/], comboController.combo);
  
  
  app.get('/admin/error', function(req, res){
    res.render('admin/error.html', {
      info: req.flash('info'),
      backurl: req.flash('backurl')
    });
  });

  
  app.get(['/', '/index.htm', '/index.html'], function(req, res){
    res.render('index.html');
  });
  
  app.get('/show/:msgid', weixinController.show);
  
  app.get('/favicon.ico', function(req, res) {
    res.redirect(301, '/public/favicon.ico');
  });
  
  app.use(function(req, res, next){
    next();
  })
  
  app.get('/admin/login', loginController.index);
  app.all('/admin/logout', loginController.logout);
  app.post('/admin/login', loginController.login);
  app.all('/admin/upload', uploadController.upload);
  
  app.all(['/admin', '/admin/*'], function(req, res, next) {
    if(req.session.admin){
      require('nunjucks/src/globals').admin = req.session.admin;
      return next();
    }
    res.redirect('/admin/login');
  });
  
  
  app.get(['/admin', '/admin/index.html'], function(req, res, next){
    res.redirect('/admin/user');
  });
  
  app.get('/admin/user', userController.index);

  app.get('/admin/star', starController.index);
  app.get('/admin/star/add', starController.add);
  app.post('/admin/star/action', starController.action);
  app.post('/admin/star/batch', starController.batch);
  app.post('/admin/star/delete', starController.delete);
  
  app.get('/admin/face', faceController.index);
  app.get('/admin/face/item/:id', faceController.face);
  app.post('/admin/face/delete', faceController.delete);
  
  app.get('/admin/faceset', facesetController.index);
  app.get('/admin/faceset/item/:id', facesetController.faceset);
  
  app.post('/admin/faceset/add', facesetController.add);
  app.post('/admin/faceset/delete', facesetController.delete);
  app.post('/admin/faceset/train', facesetController.train);
  app.post('/admin/faceset/face/delete', facesetController.deleteFace);
  app.post('/admin/faceset/face/delete-all', facesetController.deleteAll);
  
  app.get('/admin/nodetect', nodetectController.index);
  app.post('/admin/nodetect/delete', nodetectController.delete);
  
  app.get('/admin/admin', adminController.index);
  
  app.get('/admin/log', logController.index);
  app.get('/admin/log/file/:file', logController.file);
    
  app.all('*', function(req, res) {
    res.redirect('/admin/error');
  });
  
};