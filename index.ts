import {Link, Links} from "./src/links";
import {startAqara} from "./src/aqara";
import {HueLight, ILightState, startHue} from "./src/hue";

// ================
// Xiaomi buttons
const DeviceID = {
    switch1: '158d0001833eb0',
    switch2_left: '158d0001f3f503_left',
    switch2_right: '158d0001f3f503_right',
    switchGeneral: 'xxx'
};

// ===========
// Hue lights
const LightId = {
    salon: 1,
    bureau: 2,
    canape: 3,
    spot1: 4,
    spot2: 5,
};


startHue().then(_ => {
    const links = new Links();

    // Simulation Presence
    links.add(new Link(DeviceID.switch1, [
        new Scenario.SimulationPresence(LightId.bureau, [
            {time: '21:00', state:{bri: 254, on: true}},
            {time: '21:40', state:{on: false}},
            {time: '23:00', state:{bri: 100, on: true}},
            {time: '23:30', state:{on: false}},
        ], true), // activate simulation on init
        new Scenario.SimulationPresence(LightId.canape, [
            {time: '21:30', state:{bri: 254, on: true}},
            {time: '22:10', state:{bri: 76, on: true}},
            {time: '23:35', state:{on: false}},
        ], true), // activate simulation on init
    ]));

    // double button salon/canape
    links.add(new Link(DeviceID.switch2_left, new Scenario.Brightness(LightId.canape)));
    links.add(new Link(DeviceID.switch2_right, new Scenario.Brightness(LightId.salon)));

    // general switch
    links.add(new Link(DeviceID.switchGeneral, [
        new Scenario.OnOff(LightId.bureau),
        new Scenario.OnOff(LightId.canape),
        new Scenario.OnOff(LightId.salon),
        new Scenario.OnOff(LightId.spot1),
        new Scenario.OnOff(LightId.spot2),
    ]));

    setTimeout(_ => {
        console.log('Reset all states');
        links.checkLightsState()
    }, 60 * 1000);

    startAqara(links).then(_ => {
        console.log('HUE + AQARA initialized');
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

    // inputTime: 'hh:mm'
    function getNextTime(inputTime: string): number {
        const now = new Date();
        const timeNow = now.getHours() * 60 * 60 * 1000 + now.getMinutes() * 60 * 1000;

        const hours = Number.parseInt(inputTime.split(':')[0]);
        const minutes = Number.parseInt(inputTime.split(':')[1]);
        const time = hours * 60 * 60 * 1000 + minutes * 60 * 1000;

        const time24h = 24 * 60 * 60 * 1000;
        const nextTime = timeNow <= time ? time - timeNow : time + time24h - timeNow;
        console.log('next time = ' + (new Date(Date.now() + nextTime)).toLocaleTimeString() + (timeNow <= time ? '' : ' (tomorrow)'));

        return nextTime;
    }

    type ScenarioStep = {state?: ILightState, time?: string};
    export class SimulationPresence extends HueLight {
        private pendingWaitTimeOut = null;
        private wait = (time: string) => new Promise(resolve => {
            clearTimeout(this.pendingWaitTimeOut);
            this.pendingWaitTimeOut = setTimeout(_ => resolve(), getNextTime(time));
        });
        constructor(link, private scenario: ScenarioStep[], private simulationOn: boolean = false) {
            super(link);

            if(simulationOn) {
                this.simulation(scenario);
            }
        }

        execute(step) {
            // todo: need debouce / 1s / only last event
            switch (step) {
                case 1:
                    if(!this.simulationOn) {
                        this.simulationOn = true;
                        console.log('Simulation switch ON');
                        // todo: need start blinking scenario
                        this.simulation(this.scenario);
                    }
                    else {
                        console.log('Simulation already ON');
                    }
                    break;
                case 2:
                    if(this.simulationOn) {
                        console.log('Simulation switch OFF');
                        // todo: need end blinking scenario
                        this.simulationOn = false;
                        clearTimeout(this.pendingWaitTimeOut);
                    }
                    else {
                        console.log('Simulation already OFF');
                    }
                    break;
            }
        }

        private simulation(steps: Array<ScenarioStep>, it = 0)
        {
            if(!this.simulationOn) {
                return;
            }

            if(!steps.length || !steps[0].time) {
                console.log('Simulation: empty scenario !');
                return;
            }

            if(steps[it]) {
                console.log('Simulation step ' + it + ' : ' + JSON.stringify(steps[it]));
                this.wait(steps[it].time).then(_ => {
                    this.setState(steps[it].state);
                    this.simulation(steps, ++it);
                });
            }
            else {
                // end for today, restart scenario for next day
                console.log('Simulation step end : restart scenario for next day');
                this.simulation(steps);
            }
        }
    }

}
