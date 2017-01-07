/**
 * Created by Mehmet Ali Peker on 07.01.2017.
 */
function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

var socket = io.connect();
var i = 0;
var kullanici = io.name;
var id = readCookie("fbID");
if(id == null || id == 'undefined')
{
    window.location.replace("http://dwtchat.cleverapps.io/auth/facebook");

}

var image = "https://graph.facebook.com/" + id + "/picture";
function dwtKeyUp(text,e){

    var tus = e.keyCode;

    if(tus == 13 && i == 1)
    {
        var mytext = text;
        if(mytext.trim() == "")
        {
            return;
        }
        $(".emojionearea-editor").html("");
        socket.emit("gonder",{"yazi" : mytext, "user" : kullanici, "saat" : "12:35", "image": image, fbId : id, socketID : socket.id});
        //document.cookie = "mySocketID="+ data.socketID;
        console.log(socket.id);
        console.log(mytext);
        i = 0;
    }
    if(tus == 13 && i == 0)
    {
        i = 1;
        setTimeout(function () {
            i = 0;
        },1000);

    }

}
$(document).ready(function () {

    socket.on("alici",function (data) {
        if(id == data.fbId)
        {
            $("#right-messages").append('<div class="row dwt-send-message"><div class="col-md-1 gonderdi"></div><div class="col-md-9 "><div class="your-message dwt-your-message-color-default dwt-message">'+data.yazi+' </div> </div> <div class="col-md-1 gonderdin"> <a target="_blank" href="https://facebook.com/'+data.fbId+'"> <img src="'+ data.image +'"/></a> <br/> <small class="message-time">'+ data.saat +'</small> </div></div>');

            var height = document.getElementById('dwt-right-messages').scrollHeight;
            document.getElementById('dwt-right-messages').scrollTop = height;
            console.log(document.getElementById('dwt-right-messages').scrollTop);
            console.log(document.getElementById('dwt-right-messages').scrollHeight);
            console.log(data);
        }else
        {
            $("#right-messages").append('<div class="row dwt-send-message"><div class="col-md-1 gonderdi"> <a target="_blank" href="https://facebook.com/'+data.fbId+'"></a> <img src="'+ data.image +'"/> </a> <br/> <small class="message-time">'+ data.saat +'</small></div><div class="col-md-9 "><div class="user-message dwt-message">'+data.yazi+' </div> </div> <div class="col-md-1 gonderdin"> </div></div>');

            var height = document.getElementById('dwt-right-messages').scrollHeight;
            document.getElementById('dwt-right-messages').scrollTop = height;
            console.log(document.getElementById('dwt-right-messages').scrollTop);
            console.log(document.getElementById('dwt-right-messages').scrollHeight);
            console.log(data);
        }
    });

    socket.on("ayrildi",function (data) {
        $("#right-messages").append('<div class="row"> <div class="col-md-11 dwt-alert"> <span class="label label-danger">'+ data + ' adlı kullanıcı odadan ayrıldı. </span> </div> </div> <br/>');

        var height = document.getElementById('dwt-right-messages').scrollHeight;
        document.getElementById('dwt-right-messages').scrollTop = height;
        console.log(document.getElementById('dwt-right-messages').scrollTop);
        console.log(document.getElementById('dwt-right-messages').scrollHeight);
        console.log(data);
    });
    socket.on("katildi", function (data) {
        $("#right-messages").append('<div class="row"> <div class="col-md-11 dwt-alert"> <span class="label label-success">'+ data + ' adlı kullanıcı odaya katıldı. </span> </div> </div> <br/>');

        var height = document.getElementById('dwt-right-messages').scrollHeight;
        document.getElementById('dwt-right-messages').scrollTop = height;
        console.log(document.getElementById('dwt-right-messages').scrollTop);
        console.log(document.getElementById('dwt-right-messages').scrollHeight);
        console.log(data);
    });

});