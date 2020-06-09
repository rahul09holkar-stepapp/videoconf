console.log("Setting Div");
document.getElementById("consultingRoom").innerHTML += '<video id="11111" autoplay ></video> \n';
reload();
// getting dom elements
var divSelectRoom = document.getElementById("selectRoom");
var divConsultingRoom = document.getElementById("consultingRoom");
var inputRoomNumber = document.getElementById("roomNumber");
var imputUserName = document.getElementById("username");
var btnGoRoom = document.getElementById("goRoom");
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");
var remoteVideo_1 = document.getElementById("remoteVideo_1");


console.log("App strated")

// variables
var roomNumber;
var localStream;
var remoteStream;
var remoteStream_1;
var rtcPeerConnection;
var connections = []
var iceServers = {
    'iceServers': [
        { 'urls': 'stun:stun.services.mozilla.com' },
        { 'urls': 'stun:stun.l.google.com:19302' }
    ]
}
var streamConstraints = { audio: {'echoCancellationType': 'system', echoCancellation : true} , video: true };
console.log(JSON.stringify(streamConstraints));
var isCaller;

// Let's do this
var socket = io();
var userAgent = navigator.userAgent
//console.log(JSON.stringify(userAgent.getCapabilities()));
btnGoRoom.onclick = function () {
    if (inputRoomNumber.value === '') {
        alert("Please type a room number")
    } else {
        roomNumber = inputRoomNumber.value;
        socket.emit('create or join', roomNumber);
	console.log(roomNumber)
        divSelectRoom.style = "display: none;";
        divConsultingRoom.style = "display: block;";
    }
};

// message handlers
socket.on('created', function (room,SocketId) {
	console.log("In Create");
	console.log(SocketId)
	//var video = document.createElement('video');
	//video.id = "aaaaaaaa";
	//document.getElementById("consultingRoom").innerHTML += '<video id="'+ SocketId +'" poster="http://3.6.46.73/abc.jpg"></video>';
	//video.poster = "http://3.6.46.73/abc.jpg";
	//document.body.appendChild(video);
	//var localVideoS = document.getElementById("aaaaaaaa");
	//location.reload();
	//reload();
        navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        localStream = stream;
        localVideo.srcObject = stream;
        isCaller = true;
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });
});

socket.on('joined', function (room,SocketId) {
	console.log("In joined");
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        localStream = stream;
        localVideo.srcObject = stream;
        socket.emit('ready', roomNumber);
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });
});

socket.on('candidate', function (event) {
	console.log("In candidate");
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    });
    rtcPeerConnection.addIceCandidate(candidate);
});

socket.on('ready', function () {
    if (isCaller) {
	console.log("In caller");
        rtcPeerConnection = new RTCPeerConnection(iceServers);
	console.log(JSON.stringify(rtcPeerConnection));
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection.createOffer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription);
                socket.emit('offer', {
                    type: 'offer',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            })
    }
});

socket.on('offer', function (event, numClients) {
    if (!isCaller) {
	console.log("In caller not");
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
	if (numClients > 1) {
		rtcPeerConnection.ontrack = onAddStream_1;
	}else {
        	rtcPeerConnection.ontrack = onAddStream;
	}
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
        rtcPeerConnection.createAnswer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription);
                socket.emit('answer', {
                    type: 'answer',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            })
    }
});

socket.on('answer', function (event) {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
})

function reload(){
    var container = document.getElementById("consultingRoom");
    var content = container.innerHTML;
    container.innerHTML= content; 
    
   //this line is to watch the result in console , you can remove it later	
   console.log("Refreshed"); 
}

function enableMute() { 
  localVideo.muted = !localVideo.muted;
} 

function disableMute() { 
  remoteVideo.muted = !remoteVideo.muted
} 


// handler functions
function onIceCandidate(event) {
    if (event.candidate) {
        console.log('sending ice candidate');
        socket.emit('candidate', {
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: roomNumber
        })
    }
}

function onAddStream(event) {
	console.log("In Add stream  func");
	console.log(JSON.stringify(event));
    	remoteVideo.srcObject = event.streams[0];
    	remoteStream = event.stream;
}

function onAddStream_1(event) {
        console.log("In Add stream  funci - 2 wala");
        console.log(JSON.stringify(event));
        remoteVideo_1.srcObject = event.streams[0];
        remoteStream_1 = event.stream;
}
