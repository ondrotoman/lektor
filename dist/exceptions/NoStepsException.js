export default class NoStepsException extends Error {
    constructor() {
        super('No steps set');
        this.name = this.constructor.name;
    }
}
