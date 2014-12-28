/**
@author hk1k
**/
var monitor = require('pomelo-monitor');
var database = require('../model/database');
var logger = require('../lib/logger');



/**
使用用户名密码登陆
@method login
@param username {String} 用户名
@param password {String} 密码
@param callback {Function} 回调函数
@param sid {String|null} 登录token
**/
exports.login = function(username, password, callback, sid){
  if(!username || !password){
    return callback('username or passowrd should not be null');
  }
  database.Admin.findByUsername(username, function(err, data){
    if(err){
      return callback(err);
    }
    if(!data.length){
      return callback('login error');
    }
    var admin = data[0];
    if(admin.password != password){
      return callback('login error');
    }
    database.Admin.update(data[0].id, {
      loginTime: Date.now(),
      sid: sid
    },function(){
      callback(null, data[0]);
    });
  });
}

/**
使用用户名和cookie登陆
@method loginByToken
@param username {String} 用户名
@param sid {String} 登陆token(从cookie中取得)
**/
exports.loginByToken = function(username, sid, callback){
  if(!username || !sid){
    return callback('login error');
  }
  database.Admin.findByUsername(username, function(err, data){
    if(err || !data || !data.length){
       return callback('login error');
    }
    var admin = data[0];
    if(admin.sid != sid){
      return callback('sid is not corrent');
    }
    var loginTime = admin.loginTime;
    var diff = Date.now() - loginTime;
    if(diff < 7 * 24 * 60 * 60 * 1000){
      return callback(null, admin);
    }
    return callback('login timeout');
  });
}

/**
admin主页渲染
@method index
@param req {HttpRequest} http请求
@param res {HttpResponse} http响应
**/
exports.index = function(req, res){
  database.Admin.findAll(function(err, data){
    if(err){
      res.redirect('/admin/error');
    }
    var param = {
      pid: process.pid,
      serverId: 'node-server'
    };

    monitor.psmonitor.getPsInfo(param, function(err, sys) {
      res.render('admin/admin.html', {
        users: data,
        sys: sys,
        addInfo: req.flash('addInfo'),
        info: req.flash('info')
      });
    });
  });
}