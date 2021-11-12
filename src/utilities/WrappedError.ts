export default class WrappedError extends Error {
    innerException: Error;

    constructor(message: string, innerException: Error) {
        super(message);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
        this.innerException = innerException;
    }

    toString() {
        return `Error: ${this.message} (Inner exception: ${this.innerException.toString()})`;
    }
}
