import firebase from "firebase";
import { MDCRipple } from "@material/ripple";
import { MDCDialog } from "@material/dialog";
import { json } from "overmind";
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
  let roomId = null;

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
    const db = firebase.firestore();
    const roomRef = await db.collection("rooms").doc();
    // const bigSnap = await firebase.firestore().collection('rooms').get()
    // console.log("BIGSNAP!!")
    // bigSnap.docs.map(doc => { console.log("BIGSNAP", doc.data()) });
    // console.log("Create PeerConnection with configuration: ", configuration);
    actions.firebase.createPeerConnection();
    // peerConnection = new RTCPeerConnection(configuration);

    // registerPeerConnectionListeners();
    actions.firebase
      .getLocalStream()
      .getTracks()
      .forEach(track => {
        actions.firebase
          .getPeerConnection()
          .addTrack(track, actions.firebase.getLocalStream());
      });

    // Code for collecting ICE candidates below
    const callerCandidatesCollection = roomRef.collection("callerCandidates");

    actions.firebase
      .getPeerConnection()
      .addEventListener("icecandidate", event => {
        if (!event.candidate) {
          // console.log('Got final candidate!');
          return;
        }
        // console.log('Got candidate: ', event.candidate);
        callerCandidatesCollection.add(event.candidate.toJSON());
      });
    // Code for collecting ICE candidates above

    // Code for creating a room below
    const offer = await actions.firebase.getPeerConnection().createOffer();
    await actions.firebase.getPeerConnection().setLocalDescription(offer);
    // console.log('Created offer:', offer);

    const roomWithOffer = {
      offer: {
        type: offer.type,
        sdp: offer.sdp
      }
    };
    await roomRef.set(roomWithOffer);
    roomId = roomRef.id;
    console.log(`New room created with SDP offer. Room ID: ${roomRef.id}`);
    document.querySelector("#currentRoom").innerText = `Current room is ${
      roomRef.id
    } - You are the caller!`;
    // Code for creating a room above

    actions.firebase.getPeerConnection().addEventListener("track", event => {
      console.log("Got remote track:", event.streams[0]);
      event.streams[0].getTracks().forEach(track => {
        console.log("Add a track to the remoteStream:", track);
        actions.firebase.getRemoteStream().addTrack(track);
      });
    });

    // Listening for remote session description below
    roomRef.onSnapshot(async snapshot => {
      const data = snapshot.data();
      if (
        !actions.firebase.getPeerConnection().currentRemoteDescription &&
        data &&
        data.answer
      ) {
        console.log("Got remote description: ", data.answer);
        const rtcSessionDescription = new RTCSessionDescription(data.answer);
        await actions.firebase
          .getPeerConnection()
          .setRemoteDescription(rtcSessionDescription);
      }
    });
    // Listening for remote session description above

    // Listen for remote ICE candidates below
    roomRef.collection("calleeCandidates").onSnapshot(snapshot => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === "added") {
          let data = change.doc.data();
          console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
          await actions.firebase
            .getPeerConnection()
            .addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
    // Listen for remote ICE candidates above
  }

  function joinRoom() {
    document.querySelector("#createBtn").disabled = true;
    document.querySelector("#joinBtn").disabled = true;

    document.querySelector("#confirmJoinBtn").addEventListener(
      "click",
      async () => {
        roomId = document.querySelector("#room-id").value;
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
    const db = firebase.firestore();
    const roomRef = db.collection("rooms").doc(`${roomId}`);
    // const bigSnap = await firebase.firestore().collection('rooms').get()
    // bigSnap.docs.map(doc => { console.log(doc.data()) });
    const roomSnapshot = await roomRef.get();
    console.log("Got room:", roomSnapshot.exists);

    if (roomSnapshot.exists) {
      // console.log("Create PeerConnection with configuration: ", configuration);
      actions.firebase.createPeerConnection();

      // peerConnection = new RTCPeerConnection(configuration);
      // registerPeerConnectionListeners();
      actions.firebase
        .getLocalStream()
        .getTracks()
        .forEach(track => {
          actions.firebase
            .getPeerConnection()
            .addTrack(track, actions.firebase.getLocalStream());
        });

      // Code for collecting ICE candidates below
      const calleeCandidatesCollection = roomRef.collection("calleeCandidates");
      actions.firebase
        .getPeerConnection()
        .addEventListener("icecandidate", event => {
          if (!event.candidate) {
            console.log("Got final candidate!");
            return;
          }
          console.log("Got candidate: ", event.candidate);
          calleeCandidatesCollection.add(event.candidate.toJSON());
        });
      // Code for collecting ICE candidates above

      actions.firebase.getPeerConnection().addEventListener("track", event => {
        console.log("Got remote track:", event.streams[0]);
        event.streams[0].getTracks().forEach(track => {
          console.log("Add a track to the remoteStream:", track);
          actions.firebase.getRemoteStream().addTrack(track);
        });
      });

      // Code for creating SDP answer below
      const offer = roomSnapshot.data().offer;
      console.log("Got offer:", offer);
      await actions.firebase
        .getPeerConnection()
        .setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await actions.firebase.getPeerConnection().createAnswer();
      console.log("Created answer:", answer);
      await actions.firebase.getPeerConnection().setLocalDescription(answer);

      const roomWithAnswer = {
        answer: {
          type: answer.type,
          sdp: answer.sdp
        }
      };
      await roomRef.update(roomWithAnswer);
      // Code for creating SDP answer above

      // Listening for remote ICE candidates below
      roomRef.collection("callerCandidates").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === "added") {
            let data = change.doc.data();
            console.log(
              `Got new remote ICE candidate: ${JSON.stringify(data)}`
            );
            await actions.firebase
              .getPeerConnection()
              .addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
      // Listening for remote ICE candidates above
    }
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
    // const tracks = document.querySelector("#localVideo").srcObject.getTracks();
    const stream = actions.firebase.getLocalStream();
    const tracks = stream.getTracks();
    tracks.forEach(track => {
      track.stop();
    });

    if (actions.firebase.getRemoteStream()) {
      actions.firebase
        .getRemoteStream()
        .getTracks()
        .forEach(track => track.stop());
    }

    if (actions.firebase.getPeerConnection()) {
      actions.firebase.getPeerConnection().close();
    }

    document.querySelector("#localVideo").srcObject = null;
    document.querySelector("#remoteVideo").srcObject = null;
    document.querySelector("#cameraBtn").disabled = false;
    document.querySelector("#joinBtn").disabled = true;
    document.querySelector("#createBtn").disabled = true;
    document.querySelector("#hangupBtn").disabled = true;
    document.querySelector("#currentRoom").innerText = "";

    // Delete room on hangup
    if (roomId) {
      const db = firebase.firestore();
      const roomRef = db.collection("rooms").doc(roomId);
      const calleeCandidates = await roomRef
        .collection("calleeCandidates")
        .get();
      calleeCandidates.forEach(async candidate => {
        await candidate.ref.delete();
      });
      const callerCandidates = await roomRef
        .collection("callerCandidates")
        .get();
      callerCandidates.forEach(async candidate => {
        await candidate.ref.delete();
      });
      await roomRef.delete();
    }

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
