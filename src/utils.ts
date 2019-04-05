export function wait(timeMs) : Promise<any> {
    return new Promise((resolve, reject) => {
        setTimeout(_ => resolve(), timeMs);
    });
}
