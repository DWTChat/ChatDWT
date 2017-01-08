/**
 * Created by Mehmet Ali Peker on 07.12.2016.
 */

var express = require("express");
var app = express();

var server = app.listen(8080);
var io = require("socket.io").listen(server);
var path = require("path");
var graph     = require('fbgraph');

var conf = {
    client_id:      '377680875915788'
    , client_secret:  '62e4f18bce5d2a57cea6251189d908c3'
    , scope:          'public_profile'
    , redirect_uri:   'http://localhost:8080/auth/facebook'
};


function escapeHtml(unsafe) {
    return unsafe;
}



app.use(express.static(path.join(__dirname, 'public')));

app.get("/beta",function (req, res) {

    // we don't have a code yet
    // so we'll redirect to the oauth
    /*
    if (!req.query.code) {
        var authUrl = graph.getOauthUrl({
            "client_id":     conf.client_id
            , "redirect_uri":  conf.redirect_uri
            , "scope":         conf.scope
        });

        if (!req.query.error) { //checks whether a user denied the app facebook login/permissions
             res.redirect("auth/facebook");
        } else {  //req.query.error == 'access_denied'
            res.send('access denied');
        }
        return;
    }*/

    res.sendFile(path.join(__dirname+"/beta/index.html"));



});

app.get("/", function (req, res) {


   res.sendFile(path.join(__dirname+"/alpha/index.html"));

});
app.get('/auth/facebook', function(req, res) {

    // we don't have a code yet
    // so we'll redirect to the oauth dialog
    if (!req.query.code) {
        var authUrl = graph.getOauthUrl({
            "client_id":     conf.client_id
            , "redirect_uri":  conf.redirect_uri
            , "scope":         conf.scope
        });

        if (!req.query.error) { //checks whether a user denied the app facebook login/permissions
            res.redirect(authUrl);
        } else {  //req.query.error == 'access_denied'
            res.send('access denied');
        }
        return;
    }

    // code is set
    // we'll send that and get the access token
    graph.authorize({
        "client_id":      conf.client_id
        , "redirect_uri":   conf.redirect_uri
        , "client_secret":  conf.client_secret
        , "code":           req.query.code
    }, function (err, facebookRes) {
        res.redirect('/UserHasLoggedIn');
    });


});


// user gets sent here after being authorized
app.get('/UserHasLoggedIn', function(req, res) {
    graph.get("/me",function (err,res) {
        io.name = escapeHtml(res.name);
        io.fbId = escapeHtml(res.id);
        console.log(io.name + ' adlı kullanıcı odaya katıldı.');
        var katildiData = io.name ;
        io.sockets.emit("katildi", katildiData);
        console.log(res);
    });
    res.cookie('fbID', io.fbId);
    res.cookie('login', true);
    res.redirect("/beta");

});
io.sockets.on("connection",function (socket) {

    socket.on("gonder",function (data) {
        data.socketID = io.id;
        data.yazi = escapeHtml(data.yazi);
        data.user = escapeHtml(data.user);
        timeNow = new Date();
        var hours   = timeNow.getHours();
        var minutes = timeNow.getMinutes()
        var timeString  = ((hours < 10) ? "0" : "") + hours;
        timeString  += ((minutes < 10) ? ":0" : ":") + minutes;
        data.saat = timeString;
        io.emit("alici",data);

    });

    socket.on('disconnect', function(){
        if(io.name != undefined){
            var ayrildiData = io.name ;
            console.log(ayrildiData);
            io.sockets.emit("ayrildi", ayrildiData);
        }
    });

    socket.on('reconnect', function(){
        var reConnectData = io.name + ' adlı kullanıcı yeniden bağlandı.';
        console.log(reConnectData);
        io.sockets.emit("reconnected", reConnectData);
    });

    socket.on('join', function (data) {
        io.name = escapeHtml(data.name);
        io.fbId = escapeHtml(data.id);

        console.log(io.name + ' adlı kullanıcı odaya katıldı. '+ socket.id);
        var katildiData = socket.name ;
        io.sockets.emit("katildi", katildiData);
    });


});
