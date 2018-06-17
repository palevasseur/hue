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
    const links = new Links();
    links.add(new Link(DeviceID.switch1, new HueLightStepBrightness(LightId.bureau)));
    links.add(new Link(DeviceID.switch2_left, new HueLightStepBrightness(LightId.canape)));
    links.add(new Link(DeviceID.switch2_right, new HueLightStepBrightness(LightId.salon)));

    startAqara(links).then(_ => {
        console.log('HUE + AQARA initialized');
    });
});

class HueLightStepBrightness extends HueLight {
    execute(step) {
        switch(step) {
            case 1: this.setState(this.state.on ? {on: false} : {brightness: 100, on: true}); break;
            case 2: this.setState({brightness: 50, on: true}); break;
            case 3: this.setState({brightness: 30, on: true}); break;
            case 4: this.setState({brightness: 5, on: true}); break;
            default: this.setState({on: false});
        }
    }
}