// https://github.com/palevasseur/node-lumi-aqara
import Aqara = require("lumi-aqara");
let aqara = null;

export function startAqara(links) : Promise<any> {
    return aqara ? Promise.resolve() : new Promise<any>((resolve, reject) => {
        aqara = new Aqara();
        aqara.on('gateway', (gateway) => {
            console.log('Aqara gateway discovered');
            gateway.on('ready', () => {
                console.log('Aqara gateway is ready');
                gateway.setPassword('ovrgkuxg5mbm754i');

                gateway.setColor({ r: 0, g: 255, b: 0 });
                gateway.setIntensity(50);
                setTimeout(_ => gateway.setIntensity(0), 60000);

                //gateway.setSound(11,10); // 11 : Knock at the door | 10 : volume (0-100)

                resolve();
            });

            gateway.on('offline', () => {
                gateway = null;
                console.log('Aqara gateway is offline');
                reject();
            });

            gateway.on('subdevice', (device) => {
                console.log('New device');
                console.log(`  Battery: ${device.getBatteryPercentage()}%`);
                console.log(`  Type: ${device.getType()}`);
                console.log(`  SID: ${device.getSid()}`);

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
    });
}
