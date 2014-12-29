/**
@author hk1k
**/
var mysql = require('mysql2');
var fileutil = require('fileutil');
var logger = require('../lib/logger');

var databaseConfig = require('../config/database.config.json');
var connection = mysql.createConnection({ user: databaseConfig.user, password: databaseConfig.password, database: '32like.face'});

/**
Admin
**/
exports.Admin = {
  findAll: function(callback){
    connection.query('SELECT * FROM `admin`', function(err, rows) {
      if(err || !rows || !rows.length){
        return callback(err || {});
      }
      callback(null, rows);
    });
  },
  findByUsername: function(username, callback){
    connection.query("SELECT * FROM `admin` WHERE username = ?", [username], function(err, rows) {
      if(err || !rows || !rows.length){
        return callback(err || {});
      }
      callback(null, rows);
    });
  },
  update: function(id, options, callback){
    var query = connection.query('UPDATE `admin` SET ?', options, function(err, rows) {
      if(err || !rows || !rows.length){
        return callback(err || {});
      }
      callback(null);
    });
  }
}

/**
Face
**/
exports.Face = {
  list: function(page, size, callback){
    if(page == undefined || page < 1){
      page = 1;
    }
    if(size == undefined || size <= 0){
      size = 20;
    }
    connection.query('SELECT * FROM `face` LIMIT ?,?', [(page - 1) * size, size], function(err, rows){
      if(err){
        return callback(err);
      }
      return callback(null, rows);
    });
  },
  find: function(faceid, callback){
    connection.query('SELECT * FROM `face` WHERE faceid = ?', faceid, function(err, rows){
      if(err){
        callback(err);
      }else{
        callback(null, rows[0])
      }
    });
  },
  add: function(face, callback){
    connection.query('INSERT INTO `face` SET ?', face, callback);
  },
  getCount: function(callback){
    connection.query('SELECT count(*) AS total FROM `face`', function(err, rows) {
      if(err || !rows || !rows.length){
        return callback(err || {});
      }
      callback(null, rows[0].total);
    });
  },
  delete: function(id, callback){
    connection.query('DELETE FROM `face` WHERE id = ?', id, callback);
  },
  deleteByFaceid: function(faceid, callback){
    connection.query('DELETE FROM `face` WHERE faceid = ?', faceid, callback);
  }
}

var facesetFile = __dirname + '/../config/facesetid.txt';
var currentId;
exports.Faceset = {
  getCurrentId: function(){
    if(!currentId){
      currentId = fileutil.read(facesetFile);
    }
    return currentId;
  },
  setCurrentId: function(id){
    currentId = id;
    fileutil.write(facesetFile, currentId);
  }
}

if(!fileutil.exist(facesetFile)){
  fileutil.touch(facesetFile);
  exports.Faceset.setCurrentId('c8bc94894ab3eca18fcc1e84bf387ccb');
}
/**
User
**/
exports.User = {
  list: function(page, size, callback){
    if(page == undefined || page < 1){
      page = 1;
    }
    if(size == undefined || size <= 0){
      size = 20;
    }
    connection.query('SELECT u.id,u.openid,u.faceid,f.img,f.time,f.data FROM `user` AS u, `face` AS f WHERE u.faceid=f.faceid LIMIT ?,?', [(page - 1) * size, size], function(err, rows){
      if(err){
        return callback(err);
      }
      return callback(null, rows);
    });
  },
  add: function(user, callback){
     connection.query('INSERT INTO `user` SET ?', user, callback);
  },
  getCount: function(callback){
    connection.query('SELECT count(*) AS total FROM `user`', function(err, rows) {
      if(err || !rows || !rows.length){
        return callback(err || {});
      }
      callback(null, rows[0].total);
    });
  },
  findById: function(id, callback){
    connection.query("SELECT * FROM `user` WHERE id = ?", id, function(err, rows) {
      if(err){
        return callback(err);
      }
      if(!rows || !rows.length){
        return callback(null, null);
      }
      callback(null, rows[0]);
    });
  },
  setOpenId: function(openid, faceid, callback){
    var self = this;
    this.findByOpenId(openid, function(err, result){
      if(result){
        connection.query("UPDATE `user` SET faceid= ? WHERE openid = ?", [faceid, openid], callback)
      }else{
        self.add({openid: openid, faceid: faceid}, callback);
      }
    });
  },
  findByOpenId: function(openid, callback){
    connection.query("SELECT * FROM `user` WHERE openid = ?", openid, function(err, rows) {
      if(err){
        return callback(err);
      }
      if(!rows || !rows.length){
        return callback(null, null);
      }
      callback(null, rows[0]);
    });
  },
  findByFaceId: function(faceid, callback){
    connection.query("SELECT * FROM `user` WHERE faceid = ?", faceid, function(err, rows) {
      if(err){
        return callback(err);
      }
      if(!rows || !rows.length){
        return callback(null, null);
      }
      callback(null, rows[0]);
    });
  },
  deleteById: function(id, callback){
    connection.query("DELETE FROM `user` WHERE id = ?", id, function(err) {
      if(err){
        return callback(err);
      }
      callback(null);
    });
  },
  deleteByOpenId: function(openid, callback){
    connection.query("DELETE FROM `user` WHERE openid = ?", openid, function(err) {
      if(err){
        return callback(err);
      }
      callback(null);
    });
  },
  deleteByFaceId: function(faceid, callback){
    connection.query("DELETE FROM `user` WHERE faceid = ?", openid, function(err) {
      if(err){
        return callback(err);
      }
      callback(null);
    });
  }
}

/**
Star
**/
exports.Star = {
  find: function(page, size, callback){
    if(page == undefined || page < 1){
      page = 1;
    }
    if(size == undefined || size <= 0){
      size = 20;
    }
    connection.query('SELECT s.id,s.faceid,s.facesetid,f.img,f.data,f.time FROM `star` AS s, `face` AS f WHERE s.faceid=f.faceid LIMIT ?,?', [(page - 1) * size, size], function(err, rows){
      if(err){
        return callback(err);
      }
      return callback(null, rows);
    });
  },
  getCount: function(callback){
    connection.query('SELECT count(*) AS total FROM `star`', function(err, rows) {
      if(err || !rows || !rows.length){
        return callback(err || {});
      }
      callback(null, rows[0].total);
    });
  },
  add: function(star, callback){
    connection.query('INSERT INTO `star` SET ?', star, callback);
  },
  delete: function(id, callback){
    connection.query('DELETE FROM `star` WHERE id = ?', id, callback);
  },
  findById: function(id, callback){
    connection.query("SELECT * FROM `star` WHERE id = ?", [id], function(err, rows) {
      if(err){
        return callback(err);
      }
      if(!rows || !rows.length){
        return callback(null, null);
      }
      callback(null, rows[0]);
    });
  }
}

