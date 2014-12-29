/**
@author hk1k
**/
var fs = require('fs');
var path = require('path');
var nunjucks = require('nunjucks');
var logger = require('../lib/logger');
var database = require('../model/database');



/**
店铺首页渲染
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
  database.User.getCount(function(err, count){
    if(err){
      return res.redirect('admin/error');
    }
    database.User.find(page, pageCount, function(err, rows){
      if(err){
        return res.redirect('admin/error');
      }
      res.render('admin/user.html', {
        page: page,
        size: Math.round(count/pageCount),
        list: rows
      });
    });
  });
  
}