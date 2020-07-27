// import firebase from "firebase";
import { MDCRipple } from "@material/ripple";
import { MDCDialog } from "@material/dialog";
// import { json } from "overmind";
const theApp = ({ state, actions, effects }) => {
  MDCRipple.attachTo(document.querySelector(".mdc-button"));
  //   const firebaseConfig = {
  //     apiKey: "AIzaSyAEM9uGdlfMsFAX1FaYBuiWT3Bh0ZfFRcE",
  //     authDfsomain:
  //       "https://3000-feeffad4-e711-4e5f-9f7f-891b31f22047.ws-us02.gitpod.io/",
  //     databaseURL: "https://civicapathyproject.firebaseio.com",
  //     projectId: "civicapathyproject",
  //     storageBucket: "civicapathyproject.appspot.com",
  //     messagingSenderId: "208039221624",
  //     appId: "1:208039221624:web:894094b7d962d148aed08d"
  //   };
  // effects.firebase.api.initialze()
  // const firebase = effects.firebase.api.getFirebase()
  //   if (!state.firebase.initialized) {
  //     console.log("intialez");
  //     actions.firebase.setInitialized();
  //     firebase.initializeApp(firebaseConfig);
  //   }
  effects.firebase.api.initialize({ state, actions });
  //   effects.firebase,api.initialize()

  let roomDialog = null;

  function init() {
    document
      .querySelector("#cameraBtn")
      .addEventListener("click", openUserMedia);
    document.querySelector("#hangupBtn").addEventListener("click", hangUp);
    document.querySelector("#createBtn").addEventListener("click", createRoom);
    document.querySelector("#joinBtn").addEventListener("click", joinRoom);
    roomDialog = new MDCDialog(document.querySelector("#room-dialog"));
  }

  async function createRoom() {
    document.querySelector("#createBtn").disabled = true;
    document.querySelector("#joinBtn").disabled = true;
    await actions.firebase.setRoomRef();
    await actions.firebase.createPeerConnection();
    actions.firebase.addLocalTracks();
    await actions.firebase.setupLocalCandidates();

    document.querySelector("#currentRoom").innerText = `Current room is ${
      actions.firebase.getRoomRef().id
    } - You are the caller!`;
    // Code for creating a room above
    actions.firebase.setupPeerListeners();
    actions.firebase.setupSnapshotListener();

    // Listening for remote session description above

    // Listen for remote ICE candidates below
    actions.firebase.setupCalleeCandidates();

    // Listen for remote ICE candidates above
  }

  function joinRoom() {
    document.querySelector("#createBtn").disabled = true;
    document.querySelector("#joinBtn").disabled = true;

    document.querySelector("#confirmJoinBtn").addEventListener(
      "click",
      async () => {
        const roomId = document.querySelector("#room-id").value;

        actions.firebase.setRoomId(roomId);
        console.log("Join room: ", roomId);
        document.querySelector(
          "#currentRoom"
        ).innerText = `Current room is ${roomId} - You are the callee!`;
        await joinRoomById(roomId);
      },
      { once: true }
    );
    roomDialog.open();
  }

  async function joinRoomById(roomId) {
    await actions.firebase.setRoomRef(`${roomId}`);
    await actions.firebase.getRoomSnapshot();

    // const roomSnapshot = await actions.firebase.getRoomRef().get();
    // console.log("Got room:", roomSnapshot.exists);

    // if (roomSnapshot.exists) {
    //   // console.log("Create PeerConnection with configuration: ", configuration);
    //   actions.firebase.createPeerConnection();

    //   // peerConnection = new RTCPeerConnection(configuration);
    //   // registerPeerConnectionListeners();
    //   actions.firebase.addLocalTracks();

    //   // Code for collecting ICE candidates below
    //   actions.firebase.addCalleeCandidateCollection();

    //   const calleeCandidatesCollection = actions.firebase
    //     .getRoomRef()
    //     .collection("calleeCandidates");

    //   actions.firebase
    //     .getPeerConnection()
    //     .addEventListener("icecandidate", event => {
    //       if (!event.candidate) {
    //         console.log("Got final candidate!");
    //         return;
    //       }
    //       console.log("Got candidate: ", event.candidate);
    //       calleeCandidatesCollection.add(event.candidate.toJSON());
    //     });
    //   // Code for collecting ICE candidates above

    //   actions.firebase.getPeerConnection().addEventListener("track", event => {
    //     console.log("Got remote track:", event.streams[0]);
    //     event.streams[0].getTracks().forEach(track => {
    //       console.log("Add a track to the remoteStream:", track);
    //       actions.firebase.getRemoteStream().addTrack(track);
    //     });
    //   });

    //   // Code for creating SDP answer below
    //   const offer = roomSnapshot.data().offer;
    //   console.log("Got offer:", offer);
    //   await actions.firebase
    //     .getPeerConnection()
    //     .setRemoteDescription(new RTCSessionDescription(offer));
    //   const answer = await actions.firebase.getPeerConnection().createAnswer();
    //   console.log("Created answer:", answer);
    //   await actions.firebase.getPeerConnection().setLocalDescription(answer);

    //   const roomWithAnswer = {
    //     answer: {
    //       type: answer.type,
    //       sdp: answer.sdp
    //     }
    //   };
    //   await actions.firebase.getRoomRef().update(roomWithAnswer);
    //   // Code for creating SDP answer above

    //   // Listening for remote ICE candidates below
    //   actions.firebase
    //     .getRoomRef()
    //     .collection("callerCandidates")
    //     .onSnapshot(snapshot => {
    //       snapshot.docChanges().forEach(async change => {
    //         if (change.type === "added") {
    //           let data = change.doc.data();
    //           console.log(
    //             `Got new remote ICE candidate: ${JSON.stringify(data)}`
    //           );
    //           await actions.firebase
    //             .getPeerConnection()
    //             .addIceCandidate(new RTCIceCandidate(data));
    //         }
    //       });
    //     });
    //   // Listening for remote ICE candidates above
    // }
  }

  async function openUserMedia(e) {
    console.log(effects.firebase);
    await actions.firebase.openUserMedia();
    // const stream = await navigator.mediaDevices.getUserMedia({
    //   video: true,
    //   audio: true
    // });
    console.log("LS", actions.firebase.getLocalStream());
    document.querySelector(
      "#localVideo"
    ).srcObject = actions.firebase.getLocalStream();
    // localStream = stream;
    // remoteStream = new MediaStream();
    document.querySelector(
      "#remoteVideo"
    ).srcObject = actions.firebase.getRemoteStream();

    console.log("Stream:", document.querySelector("#localVideo").srcObject);
    document.querySelector("#cameraBtn").disabled = true;
    document.querySelector("#joinBtn").disabled = false;
    document.querySelector("#createBtn").disabled = false;
    document.querySelector("#hangupBtn").disabled = false;
  }

  async function hangUp(e) {
    actions.firebase.hangUp();

    document.querySelector("#localVideo").srcObject = null;
    document.querySelector("#remoteVideo").srcObject = null;
    document.querySelector("#cameraBtn").disabled = false;
    document.querySelector("#joinBtn").disabled = true;
    document.querySelector("#createBtn").disabled = true;
    document.querySelector("#hangupBtn").disabled = true;
    document.querySelector("#currentRoom").innerText = "";

    // Delete room on hangup

    // document.location.reload(true);
  }

  // function registerPeerConnectionListeners() {
  //   peerConnection.addEventListener("icegatheringstatechange", () => {
  //     console.log(
  //       `ICE gathering state changed: ${peerConnection.iceGatheringState}`
  //     );
  //   });

  //   peerConnection.addEventListener("connectionstatechange", () => {
  //     console.log(`Connection state change: ${peerConnection.connectionState}`);
  //   });

  //   peerConnection.addEventListener("signalingstatechange", () => {
  //     console.log(`Signaling state change: ${peerConnection.signalingState}`);
  //   });

  //   peerConnection.addEventListener("iceconnectionstatechange ", () => {
  //     console.log(
  //       `ICE connection state change: ${peerConnection.iceConnectionState}`
  //     );
  //   });
  // }

  init();
};
export default theApp;
