import {Link, Links} from "./src/links";
import {startAqara} from "./src/aqara";
import {startHue} from "./src/hue";

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
    links.add(new Link(DeviceID.switch1, LightId.bureau));
    links.add(new Link(DeviceID.switch2_left, LightId.canape));
    links.add(new Link(DeviceID.switch2_right, LightId.salon));

    startAqara(links).then(_ => {
        console.log('HUE + AQARA initialized');
    });
});

