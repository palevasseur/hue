import {Link, Links} from "./src/links";
import {startAqara} from "./src/aqara";
import SunCalc = require("suncalc");
import {HueLight, ILightState, startHue} from "./src/hue";

// ================
// Xiaomi buttons
const DeviceID = {
    switch1: '158d0001833eb0',
    switch2: '158d000183ac37',
    switch3: '158d000183c11d',
    switch_left: '158d0001f3f503_left',
    switch_right: '158d0001f3f503_right',
    switchGeneral: 'xxx' // todo
};

// ===========
// Hue lights
const LightId = {
    salon: 1,
    tableCuisine: 2,
    canape: 3,
    spot1: 4,
    spot2: 5,
};

function wait(timeMs) : Promise<any> {
    return new Promise((resolve, reject) => {
        setTimeout(_ => resolve(), timeMs);
    });
}

// wait 30s to ensure pc boot terminated and avoid hue search failure
console.log('Wait 30s before starting...');
wait(30000).then(_ => {
    console.log('Starting hue...');
    startHue().then(_ => {
        const links = new Links();

        // Simulation Presence
        links.add(new Link(DeviceID.switch1, [
            //new Scenario.SimulationPresence(LightId.tableCuisine, [
            //    {time: 'SUNSET', state:{bri: 254, on: true}},
            //    {time: 'SUNSET+01:10', state:{on: false}},
            //    {time: '23:00', state:{bri: 100, on: true}},
            //    {time: '23:30', state:{on: false}},
            //], true),
            new Scenario.SimulationPresence(LightId.canape, [
                {time: 'SUNSET', state:{bri: 100, on: true}},
                {time: 'SUNSET+00:20', state:{bri: 254, on: true}},
                {time: '20:30', state:{bri: 127, on: true}},
                {time: '22:50', state:{bri: 76, on: true}},
                {time: '23:00', state:{on: false}},
            ], true),
        ]));

        // spot bureau test
        /*links.add(new Link(DeviceID.switch1, [
            new Scenario.SimulationPresence(LightId.spot1, [
                {time: '11:10', state:{bri: 100, on: true}},
                {time: '11:11', state:{bri: 254, on: true}},
                {time: '11:12', state:{bri: 127, on: true}},
                {time: '11:13', state:{bri: 76, on: true}},
                {time: '11:14', state:{on: false}},
            ], true),
        ]));*/

        // switches
        links.add(new Link(DeviceID.switch2, new Scenario.Brightness(LightId.spot2)));
        links.add(new Link(DeviceID.switch3, new Scenario.Brightness(LightId.tableCuisine)));
        links.add(new Link(DeviceID.switch_left, new Scenario.Brightness(LightId.canape)));
        links.add(new Link(DeviceID.switch_right, new Scenario.Brightness(LightId.salon)));

        // general switch
        /*links.add(new Link(DeviceID.switchGeneral, [
            new Scenario.OnOff(LightId.tableCuisine),
            new Scenario.OnOff(LightId.canape),
            new Scenario.OnOff(LightId.salon),
            new Scenario.OnOff(LightId.spot1),
            new Scenario.OnOff(LightId.spot2),
        ]));*/

        setTimeout(_ => {
            console.log('Reset all states');
            links.checkLightsState()
        }, 60 * 1000);

        startAqara(links).then(_ => {
            console.log('HUE + AQARA initialized');
        });
    });
});

namespace Scenario {
    export class OnOff extends HueLight {
        execute(step) {
            this.setState(this.state.on ? {on: false} : {on: true});
        }
    }

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
            if(steps[it]) {
                const actionName = Object.keys(steps[it])[0];
                return this[actionName](steps[it][actionName]).then(_ => this.extinction(steps, ++it));
            }
        }
    }

    // inputTime = "hh:mm" / return ms
    function getHourMinFromInput(inputTime: string) : number {
        const hours = Number.parseInt(inputTime.split(':')[0]);
        const minutes = Number.parseInt(inputTime.split(':')[1]);
        return hours * 60 * 60 * 1000 + minutes * 60 * 1000;
    }

    // inputTime: 'hh:mm' | 'SUNSET+00:30' | 'SUNSET-00:30' | 'SUNSET'
    function getNextTime(inputTime: string, nextDay: boolean): number {
        const input = /(SUNSET[+-])?(\d{2}:\d{2})|(SUNSET)/.exec(inputTime); // [1] = SUNSET+ | SUNSET-, [2] = '00:30', [3] = SUNSET
        if(!input || (!input[2] && !input[3])) {
            console.warn('Bad input time = ' + inputTime + ', ex: "SUNSET+00:30"');
            return 0;
        }

        const sunset = !!input[1] || !!input[3];
        const inputHourMin = input[2] || '00:00';
        const operator = /SUNSET-/.test(inputTime) ? -1 : 1;

        const now = new Date();
        const nowHourMin = now.getHours() * 60 * 60 * 1000 + now.getMinutes() * 60 * 1000;
        const hourMin = sunset
            ? getHourMinSunset(operator * getHourMinFromInput(inputHourMin))
            : getHourMinFromInput(inputTime);

        let nextTime;
        if(nowHourMin <= hourMin) {
            nextTime = hourMin - nowHourMin;
            console.log('                    ' + inputTime + ' => next time = ' + (new Date(Date.now() + nextTime)).toLocaleTimeString() + ', in ' + nextTime/1000 + 's');

        }
        else {
            if(nextDay) {
                const time24h = 24 * 60 * 60 * 1000;
                nextTime = hourMin + time24h - nowHourMin;
                console.log('                    ' + inputTime + ' => next time = ' + (new Date(Date.now() + nextTime)).toLocaleTimeString() + ' (tomorrow), in ' + nextTime/1000 + 's');
            }
            else {
                nextTime = 0;
                console.log('                    ' + inputTime + ' => next time = 0 (next time already passed => go to next step)');
            }
        }

        return nextTime;
    }

    // return paris sunset hours+mins ms
    function getHourMinSunset(shiftMs:number): number {
        const sunsetTime = SunCalc.getTimes(new Date(), 48.8, 2.3).sunset;
        return sunsetTime.getHours() * 60 * 60 * 1000 + sunsetTime.getMinutes() * 60 * 1000 + Number(shiftMs);
    }

    type ScenarioStep = {state?: ILightState, time?: string};
    export class SimulationPresence extends HueLight {
        private pendingWaitTimeOut = null;
        private wait = (time: string, nextDay: boolean) => new Promise(resolve => {
            clearTimeout(this.pendingWaitTimeOut);
            this.pendingWaitTimeOut = setTimeout(_ => resolve(), getNextTime(time, nextDay));
        });
        constructor(link, private scenario: ScenarioStep[], private initWithSimulationActivated: boolean = false) {
            super(link);

            if(initWithSimulationActivated) {
                this.simulation(scenario);
            }
        }

        execute(step) {
            // todo: need debouce / 1s / only last event
            switch (step) {
                case 1:
                    if(!this.initWithSimulationActivated) {
                        this.initWithSimulationActivated = true;
                        console.log('Simulation, light' + this.lightId + ': switch ON');
                        // todo: need start blinking scenario
                        this.simulation(this.scenario);
                    }
                    else {
                        console.log('Simulation, light' + this.lightId + ': already ON');
                    }
                    break;
                case 2:
                    if(this.initWithSimulationActivated) {
                        console.log('Simulation, light' + this.lightId + ': switch OFF');
                        // todo: need end blinking scenario
                        this.initWithSimulationActivated = false;
                        clearTimeout(this.pendingWaitTimeOut);
                    }
                    else {
                        console.log('Simulation, light' + this.lightId + ': already OFF');
                    }
                    break;
            }
        }

        private simulation(steps: Array<ScenarioStep>, it = 0, nextDay = false)
        {
            if(!this.initWithSimulationActivated) {
                return;
            }

            if(!steps.length || !steps[0].time) {
                console.log('Simulation, light' + this.lightId + ': empty scenario !');
                return;
            }

            if(steps[it]) {
                console.log('Simulation, light' + this.lightId + ': wait next step = step ' + it + ' | ' + JSON.stringify(steps[it]));
                this.wait(steps[it].time, nextDay).then(_ => {
                    console.log('Simulation, light' + this.lightId + ': apply step ' + it + ' | ' + JSON.stringify(steps[it]));
                    this.setState(steps[it].state);

                    if(steps[it+1]) {
                        this.simulation(steps, it+1);
                    }
                    else {
                        // end for today, restart scenario for next day
                        console.log('Simulation, light' + this.lightId + ': end => restart scenario for next day');
                        this.simulation(steps, 0, true);
                    }
                });
            }

        }
    }

}
