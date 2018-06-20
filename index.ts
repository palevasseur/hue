import {Link, Links} from "./src/links";
import {startAqara} from "./src/aqara";
import {HueLight, startHue} from "./src/hue";

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
    const lightBureau = new HueLightStepBrightness(LightId.bureau);
    const lightCanape = new HueLightStepBrightness(LightId.canape);
    const lightSalon = new HueLightStepBrightness(LightId.salon);

    const links = new Links();
    links.add(new Link(DeviceID.switch1, lightBureau));
    links.add(new Link(DeviceID.switch2_left, lightCanape));
    links.add(new Link(DeviceID.switch2_right, lightSalon));

    setInterval(_ => {links.checkLightsState()}, 10 * 1000); // check state every minutes

    startAqara(links).then(_ => {
        console.log('HUE + AQARA initialized');
    });
});

class HueLightStepBrightness extends HueLight {
    execute(step) {
        switch(step) {
            case 1: this.setState(this.state.on ? {on: false} : {bri: 254, on: true}); break;
            case 2: this.setState({bri: 127, on: true}); break;
            case 3: this.setState({bri: 76, on: true}); break;
            case 4: this.setState({bri: 12, on: true}); break;
            default: this.setState({on: false});
        }
    }
}