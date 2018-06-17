// todo: find a generic name for this "targeted device"
export interface Light {
    execute(step: number);
}

export class Links {
    private links: Link[] = [];

    add(link: Link) {
        const findLink = this.links[link.deviceSid];
        if(findLink) {
            console.log(`Links: device ${link.deviceSid} already defined, check Link definition`);
            return;
        }

        this.links[link.deviceSid] = link;
    }

    action(deviceSid, step) {
        const link = this.links[deviceSid];
        if(!link) {
            console.log(`Links: device ${deviceSid} not found, check Link definition`);
            return;
        }

        link.light.execute(step);
    }
}

export class Link {
    constructor(readonly deviceSid: string, readonly light: Light) {
    }
}