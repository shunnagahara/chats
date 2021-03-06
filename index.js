const express = require('express');
const app = require('express')();
const server= require('http').Server(app);
const io = require('socket.io')(server);
const confessionPhrase = require('./confessionPhrase.js');
const port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
});

let loginUsers = [];

io.on('connection', function(socket){

    let nickName = ""; 
    let existedNameUser = false;

    // 新規接続ユーザー
    socket.on('new comer', function(strNickname_){

      if (existedNameUser) return

      nickName = strNickname_;
      loginUsers.push(nickName);

      socket.broadcast.emit("new comer", nickName);
    });

    // 接続が切れた場合
    socket.on('disconnect',function(){

      if (existedNameUser) return

      var index = loginUsers.indexOf(nickName);
      if(index >= 0){
        loginUsers.splice(index, 1);
      }

      socket.broadcast.emit("left", nickName);
    });

    // 同名ユーザーチェック
    socket.on('check same name', function(myName){
      if (loginUsers.includes(myName)) existedNameUser = true;
      io.to(socket.id).emit('check same name', existedNameUser);
    });
    
    // チャットメッセージ
    socket.on('chat message', function(chat){
      io.emit('chat message', chat);
    });
    
    // 告白
    socket.on('love confession', function(chat){

      // 電源OFFした場合、コネクションは切れずにサーバー側の変数が無くなるためにログイン画面に飛ばす。
      if (!loginUsers.includes(chat.name)) {
        io.to(socket.id).emit('byebye');
      }

      if (loginUsers.length <= 1) {
        return
      }

      var confessedUsers = loginUsers.concat();
      confessedUsers.filter(Boolean);
      var index = confessedUsers.indexOf(nickName);

      if(index >= 0){
        confessedUsers.splice(index, 1);
      }

      var confessedUser = confessedUsers[Math.floor(Math.random() * confessedUsers.length)];

      chat.text = confessedUser + confessionPhrase[Math.floor(Math.random() * confessionPhrase.length)];

      io.emit('love confession', chat);

    });
});

// function test() {
//   console.log('aaa');
// }

server.listen(port, function(){
  console.log("Server listening on port " + port);
});	