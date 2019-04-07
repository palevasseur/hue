import {HueLight, ILightState} from "../hue";

export class ScenarioBrightness extends HueLight {
    execute(step) {
        switch(step) {
            case 1: this.setState(this.state.on ? {on: false} : {bri: 254, on: true}); break;
            case 2: this.setState({bri: 127, on: true}); break;
            case 3: this.setState({bri: 76, on: true}); break;
            case 4: this.extinction(this.extinctionSteps); break;
            default: this.setState({on: false});
        }
    }

    // extinction
    private _state = (state: ILightState) => this.setState(state);
    private _delay = (seconds: number) => new Promise(resolve => setTimeout(_ => resolve(), seconds * 1000));
    private extinctionSteps: {_state?: ILightState, _delay?: number}[] = [
        {_state: {bri: 254, on: true}},
        {_delay: 1},
        {_state: {bri: 5}},
        {_delay: 1},
        {_state: {bri: 254}},
        {_delay: 3 * 60},
        {_state: {on: false}}
    ];

    private extinction(steps: object, it = 0) {
        if(steps[it]) {
            const actionName = Object.keys(steps[it])[0];
            return this[actionName](steps[it][actionName]).then(_ => this.extinction(steps, ++it));
        }
    }
}
