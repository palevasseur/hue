// todo: find a generic name for this "targeted device"
export interface Light {
    execute(step: number);
    checkState();
}

export class Links {
    private links: Map<string, Link> = new Map();

    add(link: Link) {
        const findLink = this.links.get(link.deviceSid);
        if(findLink) {
            console.log(`Links: device ${link.deviceSid} already defined, check Link definition`);
            return;
        }

        this.links.set(link.deviceSid, link);
    }

    action(deviceSid, step) {
        const link = this.links.get(deviceSid);
        if(!link) {
            console.log(`Links: device ${deviceSid} not found, check Link definition`);
            return;
        }

        link.lights.forEach(l => l.execute(step));
    }

    checkLightsState() {
        this.links.forEach((link) => {
            link.lights.forEach(l => l.checkState());
        });
    }
}

export class Link {
    readonly deviceSid: string;
    readonly lights: Light[];
    constructor(deviceSid: string, light: Light | Light[]) {
        this.deviceSid = deviceSid;
        this.lights = Array.isArray(light) ? light : [light];
    }
}