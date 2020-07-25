import { createHook } from "overmind-react";
import { createOvermind } from "overmind";
import { merge, namespaced } from "overmind/config";
// import { logLoader } from '../../util/logloader';
// import { toast } from 'react-toastify';
// import actions from "./actions";
// import effects from "./effects";
// import state from "./state";
import firebase from "./firebase";
// import { proxyMethods, setProxyActions } from './proxyMethods'
// export { proxyMethods }

// logLoader(module);

// let theActions
// console.log('conform source code', effects.socket.onConfirm + '')
// actions.actionCB()

// const onInitialize = ({
//   //   state,
//   actions,
//   effects
//   //
// }) =>
//   //  ,

//   {
//     // const attrs = effects.storage.getAttrs();
//     // // theActions = actions
//     // actions.setAttrs(attrs);
//   };
const config = {
  state: {},
  actions: {},
  effects: {}
  //   onInitialize
};
export let app;
export let useApp;

const mergedConfig = merge(
  config,
  namespaced({
    firebase
  })
);

const initialize = () => {
  console.log("oninitialize");
  app = createOvermind(mergedConfig, {
    devtools: "penguin.linux.test:3031"
    // devtools: 'localhost:3031'
  });
  // setProxyActions(app.actions)
  useApp = createHook();
  // app.actions.setAttrs(app.effects.getAttrs())
};
// const {actions,state} = useApp()
if (!module.hot) {
  console.log("not hot");
  //   initialize();
  initialize();
} else {
  module.hot.dispose(data => {
    // console.log('disposing of the CB ', cb + '')
    // socket.off('confirm', cb)
    // data.cb = cb
    if (data.cb) console.log("THIS IS JUST TO KEEP THIS ALIVE");
  });
  if (!module.hot.data) {
    console.log("no hot data");
    initialize();
    /** Now we should always have module.hot.data */
  } else {
    console.log("Hot data output");
    // console.log('disposing', data.cb + '', cb + '')
    initialize();
  }
}
