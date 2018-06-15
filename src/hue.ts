// https://github.com/peter-murray/node-hue-api
import * as hue from "node-hue-api";
const userId = 'T6gWbx989lZD-8mKGfNNyhftnrT5tEFRtLp8bo0P';

export let hueApi = null;

export function startHue() : Promise<any> {
    return hueApi ? Promise.resolve() : hue.nupnpSearch().then(bridges => {
        if(bridges.length && bridges[0].ipaddress) {
            const bridge = bridges[0];
            console.log('Hue Bridges Found: ' + JSON.stringify(bridge));

            hueApi = new hue.HueApi(bridge.ipaddress, userId);
            hueApi.getConfig()
                .then(conf => {
                    //console.log('Config: ' + JSON.stringify(conf, null, 2));
                    //api.registeredUsers().then(users => console.log('Users: ' + JSON.stringify(users, null, 2)));
                    //api.getFullState().then(states => console.log('States: ' + JSON.stringify(states, null, 2)));

                    // test: light off, then on
                    const state = hue.lightState.create();
                    hueApi.setLightState(2, state.on()).then(res => console.log('Light 2 on, success=: ' + res));
                    setTimeout(_ => {
                        hueApi.setLightState(2, state.off()).then(res => console.log('Light 2 off, success=: ' + res));
                    }, 3000);
                })
                .catch(err => {
                    console.log('Error: ' + err);
                });
        }
    });
}
