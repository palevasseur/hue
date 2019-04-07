import SunCalc = require("suncalc");
import {HueLight, ILightState} from "../hue";

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
export class ScenarioSimulationPresence extends HueLight {
    private pendingWaitTimeOut = null;
    private wait = (time: string, nextDay: boolean) => new Promise(resolve => {
        clearTimeout(this.pendingWaitTimeOut);
        this.pendingWaitTimeOut = setTimeout(_ => resolve(), getNextTime(time, nextDay));
    });
    constructor(targetId: string, private scenario: ScenarioStep[], private initWithSimulationActivated: boolean = false) {
        super(targetId);

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
