/**
@author hk1k
**/
var mysql = require('mysql2');
var logger = require('../lib/logger');

var databaseConfig = require('../config/database.config.json');
var connection = mysql.createConnection({ user: databaseConfig.user, password: databaseConfig.password, database: '32like.face'});

exports.Admin = {
  findAll: function(callback){
    connection.query('select * from admin', function(err, rows) {
      if(err || !rows || !rows.length){
        return callback(err || {});
      }
      callback(null, rows);
    });
  },
  findByUsername: function(username, callback){
    connection.query("select * from `admin` where username = ?", [username], function(err, rows) {
      if(err || !rows || !rows.length){
        return callback(err || {});
      }
      callback(null, rows);
    });
  },
  update: function(id, options, callback){
    var query = connection.query('update `admin` set ?', options, function(err, rows) {
      if(err || !rows || !rows.length){
        return callback(err || {});
      }
      callback(null);
    });
    console.log(query.sql);
  }
}

exports.User = {
  find: function(page, size, callback){
    if(page == undefined || page < 1){
      page = 1;
    }
    if(size == undefined || size <= 0){
      size = 20;
    }
    connection.query('select * from user limit ?,?', [(page - 1) * size, size], function(err, rows){
      if(err){
        return callback(err);
      }
      return callback(null, rows);
    });
  },
  getCount: function(callback){
    connection.query('select count(*) as total from user', function(err, rows) {
      if(err || !rows || !rows.length){
        return callback(err || {});
      }
      callback(null, rows[0].total);
    });
  },
  byId: function(id, callback){
    connection.query("select * from `user` where id = ?", [id], function(err, rows) {
      if(err){
        return callback(err);
      }
      if(!rows || !rows.length){
        return callback(null, null);
      }
      callback(null, rows[0]);
    });
  },
  byOpenId: function(openid, callback){
    connection.query("select * from `user` where openid = ?", [opeid], function(err, rows) {
      if(err){
        return callback(err);
      }
      if(!rows || !rows.length){
        return callback(null, null);
      }
      callback(null, rows[0]);
    });
  },
}