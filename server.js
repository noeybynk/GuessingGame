'use strict';
const express = require('express');
const path = require('path')

// Constants
const PORT = 8245;
const HOST = '127.0.0.1';
// App
const app = express();

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine','ejs');

const mongoose = require('mongoose');
const mongo_uri = 'mongodb://localhost/GuessingGame';
mongoose.Promise = global.Promise;

mongoose.connect(mongo_uri, { useNewUrlParser: true }).then(
  () => {
    console.log("[success] task 2 : connected to the database ");

    const statisticSchema = mongoose.Schema({
      stage:  Number,
      question: Array,
      answer: Array,
      fail: Number,
      step: Number
    });
    
    const Stat = mongoose.model("Stats", statisticSchema);
    const games = new Stat({
      stage: 0,
      question: ['A', 'B', 'C', 'D'],
      answer: ["_", "_", "_", "_"],
      fail: 0,
      step: 0
      });
    games.save();

    app.get('/', function (req, res) {
      Stat.findOne().sort({_id: -1}).limit(1).exec((err, data) => {
        res.render('index', data);
      })
    });

    app.post('/start', (req,res)=>{
      Stat.findOne().sort({_id: -1}).limit(1).exec((err, data) => {
        let alphabet = ['A','B','C','D'];
        if (err) {console.log(err);}
        const keep = [];
        for (let i = 0; i < 4; i++) {
          let value = Math.floor((Math.random() * alphabet.length));
          keep.push(value);
        }
        data.question = [alphabet[keep[0]],alphabet[keep[1]],alphabet[keep[2]],alphabet[keep[3]]];
        data.stage = 1;
        data.save();
        res.redirect('/');
      })
    });

    app.post('/guess',(req,res)=>{
      const ch = req.body.alphabet;
      Stat.findOne().sort({_id: -1}).limit(1).exec((err, data) => {
        if (err) {
            console.log(err);
        }
        data.answer.push(ch);
        data.answer.shift();
        if (data.answer == data.question){
          data.stage = 2;
          data.save();
          res.redirect('/');
        }
        
        let status, findEmp = false;
        for(let i = 0; i < 4; i++) {
          if (data.answer[i] !== data.question[i]) {
            status = true;
          }
        }
        if( data.answer[0] != '_' ){
          findEmp = true;
        }
        if ( findEmp && status ) {
          data.fail += 1;
          data.answer = ["_", "_", "_", "_"];
          data.step = 0;
          data.save();
          res.redirect('/')
          // res.redirect('/complete');
        } else {
          data.save();
          res.redirect('/');
        }
      })
    });

    app.post('/finish', (req,res)=>{
      Stat.findOne().sort({_id: -1}).limit(1).exec((err, data) => {
        data.stage = 3;
        data.save();
        res.redirect('/');
      })
    });

    app.post('/home', (req,res)=>{
      Stat.findOne().sort({_id: -1}).limit(1).exec((err, data) => {
        data.stage = 0;
        data.answer = ["_", "_", "_", "_"];
        data.step = 0;
        data.save();
        res.redirect('/');
      })
    });
  }
);

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);