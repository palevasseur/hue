// https://github.com/peter-murray/node-hue-api
import * as hue from "node-hue-api";
import {Light} from "./links";
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
                    //hueApi.registeredUsers().then(users => console.log('Users: ' + JSON.stringify(users, null, 2)));
                    //hueApi.getFullState().then(states => console.log('States: ' + JSON.stringify(states, null, 2)));

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

export interface ILightState {
    on?: boolean,
    bri?: number, // 0-254
    ct?: number, // spot:153-454
    reachable?: boolean,
    name?: string
}

export abstract class HueLight implements Light {
    protected state: ILightState = {
        on: false,
        bri: 254
    };
    readonly lightId: number;

    constructor(lightId: string) {
        this.lightId = parseInt(lightId);
    }

    abstract execute(step: number);

    protected setState(state: ILightState) {
        Object.keys(state).forEach(key => {
            this.state[key] = state[key];
        });

        return hueApi.setLightState(this.lightId, state).then(res => console.log(`Set light ${this.lightId}: on=${this.state.on} bri=${this.state.bri}`));
    }

    public checkState() {
        hueApi.lightStatus(this.lightId).then(({state, name}: {state:ILightState, name: string}) => {
            if(!state.reachable) {
                console.log(`Light ${this.lightId} (${name}), NOT reachable`);
                return;
            }

            const match = state.on == this.state.on && (state.bri == this.state.bri || state.on == false);
            if(!match) {
                this.setState({on: this.state.on, bri: this.state.bri});

                let mes = `Light ${this.lightId} (${name}), state: on=${state.on}, bri=${state.bri}, reachable=${state.reachable}`;
                mes +=  ` DON'T MATCH => reset state with: on=${this.state.on}, bri=${this.state.bri}`;
                console.log(mes);
            }

         });
    }
}