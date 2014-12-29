/**
@author hk1k
**/
var database = require('../model/database');
var logger = require('../lib/logger');
var faceapi = require('../lib/faceapi');

/**
faceset渲染
@method index
@param {HttpRequest} req
@param {HttpResponse} res
**/
exports.index = function(req, res){
  var page = req.params.page || req.param('page');
  page = Number(page);
  if(isNaN(page) || page < 1){
    page = 1;
  }
  var pageCount = 20;
  database.Face.getCount(function(err, count){
    if(err){
      return res.redirect('admin/error');
    }
    database.Face.list(page, pageCount, function(err, rows){
      if(err){
        return res.redirect('admin/error');
      }
      res.render('admin/face.html', {
        page: page,
        size: Math.round(count/pageCount),
        list: rows
      });
    });
  });
  
}



/**
faceset face
@method index
@param {HttpRequest} req
@param {HttpResponse} res
**/
exports.face = function(req, res){
  var id = req.params.id || req.param('id');
  database.Face.find(id, function(err, result){
    if(err || !result){
      return res.redirect('admin/error');
    }
    res.render('admin/face-detail.html', {
      img: result.img,
      data: JSON.stringify(JSON.parse(result.data), 0, 2)
    });
  });
}


/**
delete faceset
@method delete
@param {HttpRequest} req
@param {HttpResponse} res
**/
exports.delete = function(req, res){
  var id = req.param('id');
  var info;
  
  if(!id){
    info = 'id不能为空';
  }
  if(info){
    req.flash('info', info);
    return res.redirect('/admin/face');
  }
  
  database.Face.delete(id, function(err){
    if(err){
      req.flash('info', err.toString());
    }
    return res.redirect('/admin/face');
  });
}