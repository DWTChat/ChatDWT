/**
 * Created by Mehmet Ali Peker on 07.12.2016.
 */
var express = require("express");
var app = express();

var server = app.listen(8080);
var fs = require('fs');
var cookieParser = require('cookie-parser');

var io = require("socket.io").listen(server);
var path = require("path");
var graph     = require('fbgraph');
var secretKeyy = "SanaNeNiyeBurayaBakıyorsunKiDWT1453";
var request = require('request').defaults({ encoding: null });
var jf = require('jsonfile'); // Requires Reading/Writing JSON
var messages = {items: [  ], alerts : []} ;



var aktifler = "";
function randomInt(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}
function curl(url){
    var data = "";
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log('request url: '+url);
            data += body;
        }
    });
    return data;

}
app.use(cookieParser());
var crypto = require("crypto");

function encrypt(key, data) {
    var cipher = crypto.createCipher('aes-256-cbc', key);
    var crypted = cipher.update(data, 'utf-8', 'hex');
    crypted += cipher.final('hex');

    return crypted;
}

function decrypt(key, data) {
    var decipher = crypto.createDecipher('aes-256-cbc', key);
    var decrypted = decipher.update(data, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    return decrypted;
}

function objToString (obj) {
    var str = '';
    var it = 0;
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            if(it != 0)
            {
                str +=  obj[p];

            }else { it = 1;}
        }
    }
    return str;
}
var conf = {
    client_id:      '377680875915788'
    , client_secret:  '62e4f18bce5d2a57cea6251189d908c3'
    , scope:          'public_profile'
    , redirect_uri:   'https://dwtchat.cleverapps.io/auth/facebook'
};


function escapeHtml(unsafe) {
    return unsafe;
}


app.use(express.static(path.join(__dirname, 'public')));

app.get("/beta",function (req, res) {

    if(req.cookies.name == undefined)
    {
        res.redirect("/auth/facebook");
    }else
    {
        res.sendFile(path.join(__dirname+"/beta/index.html"));
    }



});

app.get("/", function (req, res) {


   res.sendFile(path.join(__dirname+"/alpha/index.html"));

});
app.get("/picture/:id", function (req,res) {

    var decryptedText = decrypt(secretKeyy, req.params.id);
    console.log(decryptedText);
    request.get("https://graph.facebook.com/"+decryptedText+"/picture", function (err, ress , body) {
        res.contentType('image/jpeg');
        res.send(ress.body);
    });
});
app.get("/profil/:id", function (req,res) {
    var iddd = decrypt(secretKeyy, req.params.id);
    console.log(iddd);
    res.redirect("https://facebook.com/"+ iddd);

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

var userName,userId;
// user gets sent here after being authorized
app.get('/UserHasLoggedIn', function(req, res) {
    graph.get("/me",function (err,res) {
        userName = res.name;
        console.log(userName);
        var id = objToString(res);
        var encrypte = encrypt(secretKeyy, id);
        userId = encrypte;
        console.log(userName + ' adlı kullanıcı odaya katıldı.');
        console.log(encrypte);
        var katildiData = userName ;
        io.sockets.emit("katildi", katildiData);
        console.log(res);
    });
    console.log(userName + "rrrr"); 
    res.cookie('fbID', userId);
    res.cookie('name', userName);
    res.cookie('login', true);
    res.redirect("/beta");

});
io.sockets.on("connection",function (socket) {

    socket.on("gonder",function (data) {
        data.yazi = escapeHtml(data.yazi);
        data.user = escapeHtml(data.user);
        timeNow = new Date();
        var hours   = timeNow.getHours();
        if(hours < 21)
        {
            hours = hours + 3;
        }
        else
        {
            if(hours == 21) {
                hours = 00;
            }
            if(hours == 22) {
                hours = 01;
            }
            if(hours == 23) {
                hours = 02;
            }
        }
        var minutes = timeNow.getMinutes();
        var timeString  = ((hours < 10) ? "0" : "") + hours;
        timeString  += ((minutes < 10) ? ":0" : ":") + minutes;
        data.saat = timeString;
        messages.items.push(data);

        io.emit("alici",data);

    });

    socket.on('disconnect', function(){
        if(userName != undefined){
            var ayrildiData = userName ;
            console.log(ayrildiData);
            io.sockets.emit("ayrildi", ayrildiData);
        }
    });

    socket.on('reconnect', function(){
        var reConnectData = userName + ' adlı kullanıcı yeniden bağlandı.';
        console.log(reConnectData);
        io.sockets.emit("reconnected", reConnectData);
    });

    socket.on('join', function (data) {
        userName = data.name;
        var id = objToString(data);
        userId = id;
        console.log(userName + ' adlı kullanıcı odaya katıldı. '+ socket.id);
        var katildiData = userName ;
        io.sockets.emit("katildi", katildiData);
    });


});


