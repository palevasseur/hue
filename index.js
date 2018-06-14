"use strict";
exports.__esModule = true;
// https://github.com/peter-murray/node-hue-api
var hue = require("node-hue-api");
var userId = 'T6gWbx989lZD-8mKGfNNyhftnrT5tEFRtLp8bo0P';
// https://github.com/palevasseur/node-lumi-aqara
var lumi_aqara_1 = require("./deps/lumi-aqara");
// ==============
// Hue lights
var api = null;
hue.nupnpSearch().then(function (bridges) {
    if (bridges.length && bridges[0].ipaddress) {
        var bridge = bridges[0];
        console.log('Hue Bridges Found: ' + JSON.stringify(bridge));
        api = new hue.HueApi(bridge.ipaddress, userId);
        api.getConfig()
            .then(function (conf) {
            console.log('Config: ' + JSON.stringify(conf, null, 2));
            api.registeredUsers().then(function (users) { return console.log('Users: ' + JSON.stringify(users, null, 2)); });
            api.getFullState().then(function (states) { return console.log('States: ' + JSON.stringify(states, null, 2)); });
            // light 1 off, then on
            var state = hue.lightState.create();
            api.setLightState(2, state.on()).then(function (res) { return console.log('Light 2 on, success=: ' + res); });
            setTimeout(function (_) {
                api.setLightState(2, state.off()).then(function (res) { return console.log('Light 2 off, success=: ' + res); });
            }, 3000);
        })["catch"](function (err) {
            console.log('Error: ' + err);
        });
    }
});
// =================
// Xiaomi buttons
var aqara = new lumi_aqara_1.Aqara();
aqara.on('gateway', function (gateway) {
    console.log('Gateway discovered');
    gateway.on('ready', function () {
        console.log('Gateway is ready');
        gateway.setPassword('ovrgkuxg5mbm754i');
        gateway.setColor({ r: 255, g: 0, b: 0 });
        gateway.setIntensity(100);
        gateway.setSound(11, 50); // 11 : Knock at the door | 50 : volume (0-100)
    });
    gateway.on('offline', function () {
        gateway = null;
        console.log('Gateway is offline');
    });
    gateway.on('subdevice', function (device) {
        console.log('New device');
        console.log("  Battery: " + device.getBatteryPercentage() + "%");
        console.log("  Type: " + device.getType());
        console.log("  SID: " + device.getSid());
        var links = new Links();
        links.add(new Link(DeviceID.switch1, LightId.bureau));
        links.add(new Link(DeviceID.switchDouble1, LightId.canape));
        switch (device.getType()) {
            case 'switch':
                console.log("  Switch");
                device.on('click', function (step) {
                    console.log(device.getSid() + " is clicked, step " + step);
                    links.action(device.getSid(), step);
                });
                device.on('clickLeft', function (step) {
                    console.log(device.getSid() + " left button is clicked, step " + step);
                    links.action(device.getSid(), step);
                });
                device.on('clickRight', function (step) {
                    console.log(device.getSid() + " right button is clicked, step " + step);
                    links.action(device.getSid(), step);
                });
        }
    });
    gateway.on('lightState', function (state) {
        console.log("Light updated: " + JSON.stringify(state));
    });
});
var DeviceID = {
    switch1: '158d0001833eb0',
    switchDouble1: '158d0001f3f503'
};
var LightId = {
    salon: 1,
    bureau: 2,
    canape: 3
};
var Links = /** @class */ (function () {
    function Links() {
        this.links = [];
    }
    Links.prototype.add = function (link) {
        this.links[link.deviceSid] = link;
    };
    Links.prototype.action = function (deviceSid, step) {
        this.links[deviceSid].action(step);
    };
    return Links;
}());
var Link = /** @class */ (function () {
    function Link(deviceSid, lightId) {
        this.deviceSid = deviceSid;
        this.lightId = lightId;
        this.lightState = false;
    }
    Link.prototype.action = function (step) {
        var _this = this;
        var state = hue.lightState.create();
        var brightness;
        switch (step) {
            case 1:
                brightness = brightness || 100;
                this.lightState = !this.lightState;
                var newState = this.lightState ? state.brightness(100).on() : state.off();
                api.setLightState(this.lightId, newState).then(function (res) { return console.log("Light " + _this.lightId + " " + (_this.lightState ? 'on' : 'off') + ", success=: " + res); });
                break;
            case 2:
                brightness = brightness || 50;
            case 3:
                brightness = brightness || 30;
            case 4:
                brightness = brightness || 5;
                api.setLightState(this.lightId, state.brightness(brightness).on()).then(function (res) { return console.log("Light " + _this.lightId + " brightness=" + brightness + "%, success=: " + res); });
                break;
            default:
                api.setLightState(this.lightId, state.off()).then(function (res) { return console.log("Light " + _this.lightId + " off, success=: " + res); });
                this.lightState = false;
        }
    };
    return Link;
}());
