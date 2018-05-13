// https://github.com/peter-murray/node-hue-api
const hue = require("node-hue-api");
const userId = 'T6gWbx989lZD-8mKGfNNyhftnrT5tEFRtLp8bo0P';

hue.nupnpSearch().then(bridges => {
  if(bridges.length && bridges[0].ipaddress) {
    const bridge = bridges[0];
    console.log('Hue Bridges Found: ' + JSON.stringify(bridge));

    const api = new hue.HueApi(bridge.ipaddress, userId);
    api.getConfig()
      .then(conf => {
        console.log('Config: ' + JSON.stringify(conf, null, 2));
        api.registeredUsers().then(users => console.log('Users: ' + JSON.stringify(users, null, 2)));
        api.getFullState().then(states => console.log('States: ' + JSON.stringify(states, null, 2)));

        // light 1 off, then on
        const state = hue.lightState.create();
        api.setLightState(1, state.off()).then(res => console.log('Light 1 off, success=: ' + res));
        setTimeout(_ => {
          api.setLightState(1, state.on()).then(res => console.log('Light 1 on, success=: ' + res));
        }, 3000);
      })
      .catch(err => {
        console.log('Error: ' + err);
      });
  }
});