var express = require('express');
var router = express.Router();
var model = require('../model')
var urgen = require('../lib/urgent')
var marketAnalyze = require('../lib/marketAnalyze')
/* GET home page. */
router.get('/', function(req, res, next) {
  // model.connect(function(client) {
  //   const database = client.db("crepe");
  //   // console.log('database', database.collection('users').find().toArray());
  //   database.collection('users').insertOne({name: 'jianbing2'})
  //   console.log('database', database.collection('users').insertOne({name: 'jianbing'}));
  //   database.collection('users').find().toArray(function(error, docs) {
  //     console.log('user list', docs);
  //     res.render('index', { title: 'Express' });
  //   })
  // })
  // res.render(urgen.getFbaInventory(null, null));
  console.log('test')
  // urgen.getFbaInventory(null, null);
  marketAnalyze.marketAnalyze(null, null)
  res.render('index', { title: 'Express' });
  
});

module.exports = router;
