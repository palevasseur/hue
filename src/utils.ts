import {Config, TargetName} from "./config";

export function wait(timeMs) : Promise<any> {
    return new Promise((resolve, reject) => {
        setTimeout(_ => resolve(), timeMs);
    });
}

export const getTargetId = (config: Config, name: TargetName): string => {
    const targets = config.targets.filter(light => light.name == name);
    if(targets.length > 1) {
        console.error('Found several devices with same name "' + name + '", use the first = ' + targets[0].id);
    }

    return targets.length ? targets[0].id : '';
};
