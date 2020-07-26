import * as firebase from "firebase";
const state = {
  initialized: false,
  connectionName: 'test',
  localStream: null,
  remoteStream: null,
  roomId: null,
  peerConnections: {
    test:{
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
  let state = null;
  let actions = null;
  return {
    state: null,
    initialize(context) {
      console.log("Firebase initialized");
      state = context.state;
      actions = context.actions;
      if (!state.firebase.initialized) {
        console.log("initted");
        actions.firebase.setInitialized();
        fb = firebase.initializeApp(firebaseConfig);
      }
      // state.firebase = firebase;
    },
    getFirebase() {
      return fb;
    },
    
    async getRoomRef() {
      const db = firebase.firestore();
      const roomRef = await db.collection("rooms").doc();
      return roomRef;
    }
  };
})();

const actions = {
  async setInitialized({ state }) {
    state.firebase.initialized = true;
  },
  async getRoom({ state: { firebase }, effects }) {
    const roomRef = await effects.firebase.api.getRoomRef();
    firebase.roomRef = roomRef;
  },
  async openUserMedia({state}) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    state.firebase.localStream = stream
    state.firebase.remoteStream =  new MediaStream()
  },
};

const effects = {
  api: api
};

const onInitialize = ({ state, actions, effects }) => {
  console.log("effects", effects);
  effects.firebase.api.initialize({ state, actions, effects });
};

const config = {
  state,
  effects,
  actions,
  onInitialize
};
export default config;
