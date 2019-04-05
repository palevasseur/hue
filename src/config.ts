const fs = require('fs');

const CONFIG_PATH_NAME = './config.json';
type LightName = 'salon' | 'canape' | 'table cuisine' | 'spot1' | 'spot2';
type ScenarioName = 'simulation presence' | 'brightness' | 'on/off';

export type DeviceLight = {
    type: 'light'; // todo: generalize: hue_spot...
    name: LightName;
    id: string;
}
export type DeviceSwitch = {
    type: 'switch'; // todo: generalize: xiaomi_sw86...
    name: string;
    id: string;
    scenario: ScenarioName;
    targets: LightName[]
}
export type Device = DeviceLight | DeviceSwitch;

interface Config {
    delayToStartMS: number;
    devices: Device[];
}

const configDefault: Config = {
    delayToStartMS: 30 * 1000,
    devices: [
        {
            type: 'switch',
            name: 'simulation on/off',
            id: '158d0001833eb0',
            scenario: 'simulation presence',
            targets: ['canape']
        }, {
            type: 'switch',
            name: 'bureau',
            id: '158d000183ac37',
            scenario: 'brightness',
            targets: ['spot2']
        }, {
            type: 'switch',
            name: 'cuisine',
            id: '158d000183c11d',
            scenario: 'brightness',
            targets: ['table cuisine']
        }, {
            type: 'switch',
            name: 'canape',
            id: '158d0001f3f503_left',
            scenario: 'brightness',
            targets: ['canape']
        }, {
            type: 'switch',
            name: 'salon',
            id: '158d0001f3f503_right',
            scenario: 'brightness',
            targets: ['salon']
        }, {
            type: 'light',
            name: 'salon',
            id: '1'
        }, {
            type: 'light',
            name: 'table cuisine',
            id: '2'
        }, {
            type: 'light',
            name: 'canape',
            id: '3'
        }, {
            type: 'light',
            name: 'spot1',
            id: '4'
        }, {
            type: 'light',
            name: 'spot2',
            id: '5'
        }
    ]
};

export function loadConfig(): Config {
    let config = null;
    if(fs.existsSync(CONFIG_PATH_NAME)) {
        config = JSON.parse(fs.readFileSync(CONFIG_PATH_NAME, 'utf-8'));
        console.log('Read config from ' + CONFIG_PATH_NAME);
    }
    else {
        config = configDefault;
        fs.writeFileSync(CONFIG_PATH_NAME, JSON.stringify(config, null, 2) , 'utf-8');
        console.log('Use default config & saved in ' + CONFIG_PATH_NAME);
    }

    return config;
}