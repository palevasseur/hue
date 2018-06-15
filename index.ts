// https://github.com/peter-murray/node-hue-api
import * as hue from "node-hue-api";
const userId = 'T6gWbx989lZD-8mKGfNNyhftnrT5tEFRtLp8bo0P';

// https://github.com/palevasseur/node-lumi-aqara
import {Aqara} from "./lumi-aqara";

// ==============
// Hue lights
let api = null;
hue.nupnpSearch().then(bridges => {
    if(bridges.length && bridges[0].ipaddress) {
        const bridge = bridges[0];
        console.log('Hue Bridges Found: ' + JSON.stringify(bridge));

        api = new hue.HueApi(bridge.ipaddress, userId);
        api.getConfig()
            .then(conf => {
                console.log('Config: ' + JSON.stringify(conf, null, 2));
                api.registeredUsers().then(users => console.log('Users: ' + JSON.stringify(users, null, 2)));
                api.getFullState().then(states => console.log('States: ' + JSON.stringify(states, null, 2)));

                // light 1 off, then on
                const state = hue.lightState.create();
                api.setLightState(2, state.on()).then(res => console.log('Light 2 on, success=: ' + res));
                setTimeout(_ => {
                    api.setLightState(2, state.off()).then(res => console.log('Light 2 off, success=: ' + res));
                }, 3000);
            })
            .catch(err => {
                console.log('Error: ' + err);
            });
    }
});

// =================
// Xiaomi buttons

const DeviceID = {
    switch1: '158d0001833eb0',
    switch2_left: '158d0001f3f503_left',
    switch2_right: '158d0001f3f503_right'
};

const LightId = {
    salon: 1,
    bureau: 2,
    canape: 3
};

function createLinks() {
    const links = new Links();
    links.add(new Link(DeviceID.switch1, LightId.bureau));
    links.add(new Link(DeviceID.switch2_left, LightId.canape));
    links.add(new Link(DeviceID.switch2_right, LightId.salon));

    return links;
}

// ----
const aqara = new Aqara();
aqara.on('gateway', (gateway) => {
    console.log('Gateway discovered');
    gateway.on('ready', () => {
        console.log('Gateway is ready');
        gateway.setPassword('ovrgkuxg5mbm754i');
        gateway.setColor({ r: 255, g: 0, b: 0 });
        gateway.setIntensity(100);
        gateway.setSound(11,50); // 11 : Knock at the door | 50 : volume (0-100)
    });

    gateway.on('offline', () => {
        gateway = null;
        console.log('Gateway is offline')
    });

    gateway.on('subdevice', (device) => {
        console.log('New device');
        console.log(`  Battery: ${device.getBatteryPercentage()}%`);
        console.log(`  Type: ${device.getType()}`);
        console.log(`  SID: ${device.getSid()}`);

        const links = createLinks();

        switch (device.getType()) {
            case 'switch':
                console.log(`  Switch`);
                device.on('click', (step) => {
                    console.log(`${device.getSid()} is clicked, step ${step}`);
                    links.action(device.getSid(), step);
                });
        }
    });

    gateway.on('lightState', (state) => {
        console.log(`Light updated: ${JSON.stringify(state)}`)
    })
});

class Links {
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

class Link {
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
                api.setLightState(this.lightId, newState).then(res => console.log(`Light ${this.lightId} ${this.lightState ? 'on' : 'off'}, success=: ${res}`));
                break;
            case 2:
                brightness = brightness || 50;
            case 3:
                brightness = brightness || 30;
            case 4:
                brightness = brightness || 5;
                api.setLightState(this.lightId, state.brightness(brightness).on()).then(res => console.log(`Light ${this.lightId} brightness=${brightness}%, success=: ${res}`));
                break;
            default:
                api.setLightState(this.lightId, state.off()).then(res => console.log(`Light ${this.lightId} off, success=: ${res}`));
                this.lightState = false;
        }

    }
}