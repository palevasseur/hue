import {Link, Links} from "./src/links";
import {startAqara} from "./src/aqara";
import {startHue} from "./src/hue";
import {loadConfig, TargetName} from "./src/config";
import {getTargetId, wait} from "./src/utils";
import {ScenarioOnOff} from "./src/scenario/ScenarioOnOff";
import {ScenarioBrightness} from "./src/scenario/ScenarioBrightness";
import {ScenarioSimulationPresence} from "./src/scenario/ScenarioSimulationPresence";
import * as fs from "fs";
const express = require('express');

const LOG_PATH_NAME = './hue.log'; // log name defined in cron task
const config = loadConfig();

// ---------------
// launch rest api
const app = express();
app.get('/config', (req, res) => {
    res.send(JSON.stringify(config, null, 2));
});
app.get('/log', (req, res) => {
    if(fs.existsSync(LOG_PATH_NAME)) {
        res.send('' + fs.readFileSync(LOG_PATH_NAME)); // need to convert to string (avoid "download file")
    }
    else {
        res.send('Log file "' + LOG_PATH_NAME + '" doesn\'t exist');
    }
});
app.listen(3000, _ => {
    console.log('App listening on http://localhost:3000');
});

// -----------------
// launch hue engine
const delayToSTart = config.delayToStartMS || 30000; // wait to ensure pc boot terminated and avoid hue search failure
console.log('Wait ' + delayToSTart + 'ms before starting...');
wait(delayToSTart).then(_ => {
    console.log('Starting hue...');
    startHue().then(_ => {
        const links = new Links();
        config.triggers.forEach(device => {
            // todo: need to redef: trigger an action => target attached to scenario (scenario execute / action props)
            let targets = null;
            switch (device.scenario) {
                case 'simulation presence':
                    targets = device.targets.map((name: TargetName) => new ScenarioSimulationPresence(getTargetId(config, name), [
                            {time: 'SUNSET', state:{bri: 100, on: true}},
                            {time: 'SUNSET+00:20', state:{bri: 254, on: true}},
                            {time: '20:30', state:{bri: 127, on: true}},
                            {time: '22:50', state:{bri: 76, on: true}},
                            {time: '23:00', state:{on: false}},
                        ], true),
                    );
                    break;
                case 'brightness':
                    targets = device.targets.map(name => new ScenarioBrightness(getTargetId(config, name)));
                    break;
                case 'on/off':
                    targets = device.targets.map(name => new ScenarioOnOff(getTargetId(config, name)));
                    break;
            }

            if(targets) {
                console.log(' -> add Link "' + device.name + '" (' + device.id + ') => ' + device.targets);
                links.add(new Link(device.id, targets));
            }
        });

        startAqara(links).then(_ => {
            console.log('HUE + AQARA initialized');
        });

        setTimeout(_ => {
            console.log('Reset all states');
            links.checkLightsState()
        }, 60 * 1000);
    });
});
