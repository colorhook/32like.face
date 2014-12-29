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
  faceapi.getAllFaceset(function(err, faceset){
    if(err){
      return res.redirect('admin/error');
    }
    res.render('admin/faceset.html', {
      list: faceset
    });
  });
}

/**
faceset detail
@method index
@param {HttpRequest} req
@param {HttpResponse} res
**/
exports.faceset = function(req, res){
  var id = req.params.id || req.param('id');
  faceapi.getFacesFromFaceset(id, function(err, faces){
    if(err){
      return res.redirect('admin/error');
    }
    res.render('admin/facelist.html', {
      list: faces
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
  database.Face.find(id, function(err, data){
    res.render('admin/face.html', {
      data: data
    });
  });
}

/**
add faceset
@method add
@param {HttpRequest} req
@param {HttpResponse} res
**/
exports.add = function(req, res){
  var name = req.param('name');
  var info;
  
  if(!name){
    info = 'name不能为空';
  }
  if(info){
    req.flash('info', info);
    return res.redirect('/admin/faceset');
  }
  
  faceapi.createFaceset(name, function(err){
    if(err){
      req.flash('info', err.toString());
    }
    return res.redirect('/admin/faceset');
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
    return res.redirect('/admin/faceset');
  }
  
  faceapi.removeFaceset(id, function(err){
    if(err){
      req.flash('info', err.toString());
    }
    return res.redirect('/admin/faceset');
  });
}