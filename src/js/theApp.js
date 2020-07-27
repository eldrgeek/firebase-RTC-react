// import.connection.from .connection.;
import { MDCRipple } from "@material/ripple";
import { MDCDialog } from "@material/dialog";
// import { json } from "overmind";
const theApp = ({ state, actions, effects }) => {
  MDCRipple.attachTo(document.querySelector(".mdc-button"));

  effects.connection.api.initialize({ state, actions });
  //   effects.connection.api.initialize()

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
    await actions.connection.createRoom();

    document.querySelector("#createBtn").disabled = true;
    document.querySelector("#joinBtn").disabled = true;

    document.querySelector("#currentRoom").innerText = `Current room is ${
      actions.connection.getRoomRef().id
    } - You are the caller!`;
    // Code for creating a room above

    // Listen for remote ICE candidates above
  }

  function joinRoom() {
    document.querySelector("#createBtn").disabled = true;
    document.querySelector("#joinBtn").disabled = true;

    document.querySelector("#confirmJoinBtn").addEventListener(
      "click",
      async () => {
        const roomId = document.querySelector("#room-id").value;

        console.log("Join room: ", roomId);
        document.querySelector(
          "#currentRoom"
        ).innerText = `Current room is ${roomId} - You are the callee!`;
        await actions.connection.joinRoomById(roomId);
      },
      { once: true }
    );
    roomDialog.open();
  }

  // async function joinRoomById(roomId) {
  //   actions.connection.setRoomId(roomId);
  //   await actions.connection.setRoomRef(`${roomId}`);
  //   await actions.connection.getRoomSnapshot();

  // }

  async function openUserMedia(e) {
    await actions.connection.openUserMedia();
    // const stream = await navigator.mediaDevices.getUserMedia({
    //   video: true,
    //   audio: true
    // });
    console.log("LS", actions.connection.getLocalStream());
    document.querySelector(
      "#localVideo"
    ).srcObject = actions.connection.getLocalStream();
    // localStream = stream;
    // remoteStream = new MediaStream();
    document.querySelector(
      "#remoteVideo"
    ).srcObject = actions.connection.getRemoteStream();

    console.log("Stream:", document.querySelector("#localVideo").srcObject);
    document.querySelector("#cameraBtn").disabled = true;
    document.querySelector("#joinBtn").disabled = false;
    document.querySelector("#createBtn").disabled = false;
    document.querySelector("#hangupBtn").disabled = false;
  }

  async function hangUp(e) {
    actions.connection.hangUp();

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
