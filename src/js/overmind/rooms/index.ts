import * as firebase from "firebase";
import { json } from "overmind";

export enum RoomState {
  CHATTING = "chatting",
  CASCADING = "cascading"
}

export enum ConnectionType {
  CALLER = "caller",
  CALLEE = "callee"
}

export type Connection = {
  id: string;
  type: ConnectionType;
};
export type Member = {
  id: string;
};

type State = {
  initialized: boolean;
  roomState: RoomState;
  roomName: string;
  members: {
    //All members of the room
    [id: string]: Member;
  };
  connections: {
    //connections for this member
    [id: string]: Connection;
  };
};
export const state: State = {
  initialized: false,
  roomState: RoomState.CHATTING,
  roomName: "main",
  members: {},
  connections: {}
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
      if (!state.firebaseInitialized) {
        fb = firebase.initializeApp(firebaseConfig);
        actions.setFirebaseInitialized();
      }
      // state.firebase = firebase;
    },
    getFirebase() {
      return fb;
    }
  };
})();
const actions = {
  async joinRoomById({ state, actions }, roomId) {
    actions.rooms.setRoomId(roomId);
    await actions.rooms.setRoomRef(`${roomId}`);
    await actions.rooms.getRoomSnapshot();
    actions.rooms
      .getRoomRef()
      .collection("members")
      .add(state.rooms.roomId);
  },
  setRoomId({ state }, roomId) {
    state.rooms.roomId = roomId;
  },
  getRoomId({ state }) {
    return json(state.rooms.roomId);
  },

  async getRoomSnapshot({ actions }) {
    actions.rooms
      .getRoomRef()
      .collection("members")
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === "added") {
            let data = change.doc.data();
            console.log(`got new member: ${JSON.stringify(data)}`);
          }
        });
      });
  },

  setupSnapshotListener({ actions }) {
    // Listening for remote session description below
    actions.rooms.getRoomRef().onSnapshot(async snapshot => {
      const data = snapshot.data();
      if (
        !actions.rooms.getPeerConnection().currentRemoteDescription &&
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

  async setInitialized({ state }, firebase) {
    // debugger; // state.rooms.firebase = firebase;
    state.rooms.initialized = true;
  },
  getFirebase({ state }) {
    return firebase;
  },
  async setRoomRef({ state, actions }, roomId) {
    console.log("Set roomref");
    const fb = actions.rooms.getFirebase();
    const db = fb.firestore();
    state.rooms.roomRef = await db.collection("rooms").doc(roomId);
  },
  getRoomRef({ state }) {
    return json(state.rooms.roomRef);
  }
};

const effects = {
  api: api
};

const onInitialize = ({ state, actions, effects }) => {
  console.log("context in rooms", { state, actions, effects });
  effects.rooms.api.initialize({ state, actions, effects });
  actions.rooms.joinRoomById(state.rooms.roomName);
};

const config = {
  state,
  effects,
  actions,
  onInitialize
};
export default config;
