import {Link, Links} from "./src/links";
import {startAqara} from "./src/aqara";
import {HueLight, ILightState, startHue} from "./src/hue";

// ================
// Xiaomi buttons
const DeviceID = {
    switch1: '158d0001833eb0',
    switch2_left: '158d0001f3f503_left',
    switch2_right: '158d0001f3f503_right'
};

// ===========
// Hue lights
const LightId = {
    salon: 1,
    bureau: 2,
    canape: 3
};


startHue().then(_ => {
    const lightBureau = new Scenario.Brightness(LightId.bureau);
    const lightCanape = new Scenario.Brightness(LightId.canape);
    const lightSalon = new Scenario.Brightness(LightId.salon);

    const links = new Links();
    links.add(new Link(DeviceID.switch1, lightBureau));
    links.add(new Link(DeviceID.switch2_left, lightCanape));
    links.add(new Link(DeviceID.switch2_right, lightSalon));

    setInterval(_ => {links.checkLightsState()}, 10 * 1000); // check state every minutes

    startAqara(links).then(_ => {
        console.log('HUE + AQARA initialized');
    });
});

namespace Scenario {
    export class Brightness extends HueLight {
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
            console.log('Extinction scenario');
            if(steps[it]) {
                const actionName = Object.keys(steps[it])[0];
                return this[actionName](steps[it][actionName]).then(_ => this.extinction(steps, ++it));
            }
        }
    }
}
