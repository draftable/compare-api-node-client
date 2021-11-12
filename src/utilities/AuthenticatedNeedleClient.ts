import * as needle from 'needle';
import { NeedleCallback } from 'needle';
import WrappedError from './WrappedError';

export default class AuthenticatedNeedleClient {
    accountId: string;

    authToken: string;

    constructor({ accountId, authToken }: { accountId: string; authToken: string }) {
        this.accountId = accountId;
        this.authToken = authToken;
    }

    __needle_get(url: string, parameters: Object, callback: NeedleCallback): void {
        needle.request(
            'get',
            url,
            parameters,
            {
                json: true,
                accept: 'application/json',
                decode: true,
                headers: {
                    Authorization: `Token ${this.authToken}`,
                },
            },
            callback,
        );
    }

    __needle_post(url: string, multipart: boolean, data: Object, callback: NeedleCallback | undefined): void {
        needle.request(
            'post',
            url,
            data,
            {
                multipart,
                json: !multipart,
                accept: 'application/json',
                decode: true,
                headers: {
                    Authorization: `Token ${this.authToken}`,
                },
            },
            callback,
        );
    }

    __needle_delete(url: string, callback: NeedleCallback | undefined): void {
        needle.request(
            'delete',
            url,
            null,
            {
                json: true,
                accept: 'application/json',
                decode: true,
                headers: {
                    Authorization: `Token ${this.authToken}`,
                },
            },
            callback,
        );
    }

    __needlePromiseCallback({
        expectedStatusCode,
        resolve,
        reject,
    }: {
        expectedStatusCode: number;
        resolve: (data: Object) => void;
        reject: (error: Error) => void;
    }) {
        return (error: Error | null, response: { statusCode?: number; body: Object }) => {
            if (error) {
                if (error.name === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
                    reject(
                        new WrappedError(
                            'Unable to submit request as server is using an untrusted self-signed certificate.',
                            error,
                        ),
                    );
                }
                reject(new WrappedError('Unable to submit request.', error));
            } else if (response.statusCode !== expectedStatusCode) {
                const bodyDescription = response.body ? ` Response body: ${JSON.stringify(response.body)}` : '';
                if (response.statusCode === 404) {
                    reject(new Error(`Not found.${bodyDescription}`));
                }
                if (response.statusCode === 400) {
                    reject(new Error(`Bad request.${bodyDescription}`));
                }
                if (response.statusCode === 401) {
                    reject(new Error(`Authentication failed.${bodyDescription}`));
                }
                if (response.statusCode === 403) {
                    reject(new Error(`Unable to authenticate.${bodyDescription}`));
                }
                reject(
                    new Error(
                        `Unknown response received (status code was '${response.statusCode}', but we expected '${expectedStatusCode}').${bodyDescription}`,
                    ),
                );
            } else {
                resolve(response.body);
            }
        };
    }

    get(url: string, parameters?: Object): Promise<Object> {
        return new Promise((resolve, reject) =>
            this.__needle_get(url, parameters, this.__needlePromiseCallback({ expectedStatusCode: 200, resolve, reject })),
        );
    }

    post(url: string, data: Object, multipart?: boolean): Promise<Object> {
        return new Promise((resolve, reject) =>
            this.__needle_post(
                url,
                multipart || false,
                data,
                this.__needlePromiseCallback({ expectedStatusCode: 201, resolve, reject }),
            ),
        );
    }

    destroy(url: string): Promise<null> {
        // Needle still returns an object as response.body when there's no content. (It contains an empty buffer.) We just ignore it in favor of returning null.
        return new Promise((resolve, reject) =>
            this.__needle_delete(url, this.__needlePromiseCallback({ expectedStatusCode: 204, resolve, reject })),
        ).then((data) => null);
    }
}
