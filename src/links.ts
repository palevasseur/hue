import * as hue from "node-hue-api";
import {hueApi} from "./hue";

export class Links {
    private links = [];

    add(link) {
        const device = this.links[link.deviceSid];
        if(device) {
            console.log(`Links: device ${link.deviceSid} already defined, check Link definition`);
            return;
        }

        this.links[link.deviceSid] = link;
    }

    action(deviceSid, step) {
        const device = this.links[deviceSid];
        if(!device) {
            console.log(`Links: device ${deviceSid} not found, check Link definition`);
            return;
        }

        device.action(step);
    }
}

export class Link {
    private lightState = false;
    constructor(private deviceSid, private lightId) {
    }

    action(step) {
        const state = hue.lightState.create();
        let brightness;
        switch(step) {
            case 1:
                brightness = brightness || 100;
                this.lightState = !this.lightState;
                let newState = this.lightState ? state.brightness(100).on() : state.off();
                hueApi.setLightState(this.lightId, newState).then(res => console.log(`Light ${this.lightId} ${this.lightState ? 'on' : 'off'}, success=: ${res}`));
                break;
            case 2:
                brightness = brightness || 50;
            case 3:
                brightness = brightness || 30;
            case 4:
                brightness = brightness || 5;
                hueApi.setLightState(this.lightId, state.brightness(brightness).on()).then(res => console.log(`Light ${this.lightId} brightness=${brightness}%, success=: ${res}`));
                break;
            default:
                hueApi.setLightState(this.lightId, state.off()).then(res => console.log(`Light ${this.lightId} off, success=: ${res}`));
                this.lightState = false;
        }

    }
}