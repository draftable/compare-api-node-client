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

    private needleGet(url: string, parameters: unknown, callback: NeedleCallback): void {
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

    private needlePost(url: string, multipart: boolean, data: unknown, callback: NeedleCallback | undefined): void {
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

    private needleDelete(url: string, callback: NeedleCallback | undefined): void {
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

    private needlePromiseCallback = ({
        expectedStatusCode,
        resolve,
        reject,
    }: {
        expectedStatusCode: number;
        resolve: (data: unknown) => void;
        reject: (error: Error) => void;
    }) => {
        return (error: Error | null, response: { statusCode?: number; body: unknown }) => {
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
    };

    get<T>(url: string, parameters?: unknown): Promise<T> {
        return new Promise<T>((resolve, reject) =>
            this.needleGet(url, parameters, this.needlePromiseCallback({ expectedStatusCode: 200, resolve, reject })),
        );
    }

    post<T>(url: string, data: unknown, multipart?: boolean): Promise<T> {
        return new Promise<T>((resolve, reject) =>
            this.needlePost(
                url,
                multipart || false,
                data,
                this.needlePromiseCallback({ expectedStatusCode: 201, resolve, reject }),
            ),
        );
    }

    destroy(url: string): Promise<null> {
        // Needle still returns an unknown as response.body when there's no content. (It contains an empty buffer.) We just ignore it in favor of returning null.
        return new Promise((resolve, reject) =>
            this.needleDelete(url, this.needlePromiseCallback({ expectedStatusCode: 204, resolve, reject })),
        ).then(() => null);
    }
}
