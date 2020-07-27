import * as firebase from "firebase";
import { json } from "overmind";

const state = {
  initialized: false,
  connectionName: "test",
  localStream: null,
  remoteStream: null,
  roomId: null,
  roomRef: null,
  peerConnections: {
    test: {
      peerConnection: null
    }
  }
};
const firebaseConfig = {
  apiKey: "AIzaSyAEM9uGdlfMsFAX1FaYBuiWT3Bh0ZfFRcE",
  authDomain:
    "https://3000-feeffad4-e711-4e5f-9f7f-891b31f22047.ws-us02.gitpod.io/",
  databaseURL: "https://civicapathyproject.firebaseio.com",
  projectId: "civicapathyproject",
  storageBucket: "civicapathyproject.appspot.com",
  messagingSenderId: "208039221624",
  appId: "1:208039221624:web:894094b7d962d148aed08d"
};
let fb;

const api = (() => {
  return {
    state: null,
    initialize({ state, actions }) {
      console.log("Firebase initialized");
      if (!state.firebase.initialized) {
        console.log("initted");
        fb = firebase.initializeApp(firebaseConfig);
        actions.firebase.setInitialized();
      }
      // state.firebase = firebase;
    },
    getFirebase() {
      return fb;
    }
  };
})();

const actions = {
  setupCalleeCandidates({ actions }) {
    actions.firebase
      .getRoomRef()
      .collection("calleeCandidates")
      .onSnapshot(snapshot => {
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
  },
  setupSnapshotListener({ actions }) {
    // Listening for remote session description below
    actions.firebase.getRoomRef().onSnapshot(async snapshot => {
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
  },
  setupPeerListeners({ actions }) {
    actions.firebase.getPeerConnection().addEventListener("track", event => {
      console.log("Got remote track:", event.streams[0]);
      event.streams[0].getTracks().forEach(track => {
        console.log("Add a track to the remoteStream:", track);
        actions.firebase.getRemoteStream().addTrack(track);
      });
    });
  },
  async setupLocalCandidates({ actions }) {
    const callerCandidatesCollection = await actions.firebase
      .getRoomRef()
      .collection("callerCandidates");

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
    await actions.firebase.getRoomRef().set(roomWithOffer);
    // roomId = actions.firebase.getRoomRef().id;
    console.log(
      `New room created with SDP offer. Room ID: ${
        actions.firebase.getRoomRef().id
      }`
    );
  },
  async setInitialized({ state }, firebase) {
    // debugger; // state.firebase.firebase = firebase;
    state.firebase.initialized = true;
  },
  getFirebase({ state }) {
    return firebase;
  },
  async setRoomRef({ state, actions }, roomId) {
    console.log("Set roomref");
    const fb = actions.firebase.getFirebase();
    const db = fb.firestore();
    if (roomId) {
      state.firebase.roomRef = await db.collection("rooms").doc(roomId);
    } else {
      state.firebase.roomRef = await db.collection("rooms").doc();
    }
  },
  getRoomRef({ state }) {
    return json(state.firebase.roomRef);
  },
  async openUserMedia({ state }) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    state.firebase.localStream = stream;
    state.firebase.remoteStream = new MediaStream();
  },
  getLocalStream({ state }) {
    return json(state.firebase.localStream);
  },
  getRemoteStream({ state }) {
    return json(state.firebase.remoteStream);
  },
  getPeerConnection({ state }) {
    return json(state.firebase.peerConnection);
  },
  createPeerConnection({ state }) {
    const configuration = {
      iceServers: [
        {
          urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302"
          ]
        }
      ],
      iceCandidatePoolSize: 10
    };
    state.firebase.peerConnection = new RTCPeerConnection(configuration);
  },
  addLocalTracks({ state, actions }) {
    actions.firebase
      .getLocalStream()
      .getTracks()
      .forEach(track => {
        actions.firebase
          .getPeerConnection()
          .addTrack(track, actions.firebase.getLocalStream());
      });
  },

  addCalleeCandidateCollection({ state, actions }) {
    // const calleeCandidatesCollection = roomRef.collection("calleeCandidates");
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
  }
};

const effects = {
  api: api
};

const onInitialize = ({ state, actions, effects }) => {
  console.log("effects", effects);
  effects.firebase.api.initialize({ state, actions, effects });
  console.log("init complete");
};

const config = {
  state,
  effects,
  actions,
  onInitialize
};
export default config;
