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
      list: faceset,
      info: req.flash('info')
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

  if(!id){
    return res.redirect('admin/faceset');
  }
  
  var page = req.params.page || req.param('page');
  page = Number(page);
  if(isNaN(page) || page < 1){
    page = 1;
  }
  var pageCount = 20;
  
  faceapi.getFacesFromFaceset(id, function(err, faces){
    if(err){
      return res.redirect('admin/error');
    }
    var total = faces.length;
    
    faces = faces.splice((page - 1) * pageCount, pageCount);
    
    var size = faces.length, completed = 0;
    faces.forEach(function(item, index){
      database.Star.findByFaceId(item.face_id, function(err, data){
        faces[index].in_star = !!data;
        database.Face.find(item.face_id, function(err, data){
          faces[index].face = data;
          faces[index].in_face = !!data;
          completed++;
          if(completed >= size){
            res.render('admin/faceset-face.html', {
              facesetid: id,
              total: total,
              page: page,
              size: Math.round(total/pageCount),
              list: faces
            });
          }
        });
      });
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
  }else{
    req.flash('info', '');
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
  }else{
    req.flash('info', '');
  }
  
  faceapi.removeFaceset(id, function(err){
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
exports.deleteFace = function(req, res){
  var id = req.param('id');
  var facesetid = req.param('facesetid');
  var info;
  
  if(!id){
    info = 'id不能为空';
  }else if(!facesetid){
    info = 'facesetid不能为空';
  }else{
    req.flash('info', '');
  }
  if(info){
    req.flash('info', info);
    return res.redirect('/admin/faceset');
  }
  
  faceapi.removeFaceFromFaceset(id, facesetid, function(err){
    if(err){
      logger.error(err);
      req.flash('info', err.toString());
    }
    return res.redirect('/admin/faceset/item/' + facesetid);
  });
}
/**
train faceset
@method train
@param {HttpRequest} req
@param {HttpResponse} res
**/
exports.train = function(req, res){
  var facesetid = req.param('facesetid');
  var info;
  
  if(!facesetid){
    info = 'facesetid不能为空';
  }
  if(info){
    req.flash('info', info);
    return res.redirect('/admin/faceset');
  }else{
    req.flash('info', '');
  }
  faceapi.trainFaceset(facesetid, function(err, result){
    if(err){
      logger.error(err);
      console.log(err);
      req.flash('info', err.toString());
    }else{
      req.flash('info', 'train session id: ' + result.session_id);
    }
    return res.redirect('back');
  });
}
