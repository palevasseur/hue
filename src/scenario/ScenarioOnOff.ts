import {HueLight} from "../hue";

export class ScenarioOnOff extends HueLight {
    execute(step) {
        this.setState(this.state.on ? {on: false} : {on: true});
    }
}
