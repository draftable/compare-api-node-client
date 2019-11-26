// @flow

import { hexHMAC } from '../utilities';

export type DateParameter = Date | string | number;

export default class Urls {
    __baseUrl: string;

    constructor(baseUrl: { baseUrl: string, ... }) {
        this.__baseUrl = baseUrl;
    }

    get baseUrl(): string {
        return this.__baseUrl;
    }

    get comparisonsEndpointURL(): string {
        return `${this.__baseUrl}/comparisons`;
    }

    getComparisonEndpointURL({ identifier }: { identifier: string, ... }): string {
        return `${this.comparisonsEndpointURL}/${identifier}`;
    }

    getComparisonViewerURL({ accountId, identifier }: { accountId: string, identifier: string, ... }): string {
        return `${this.comparisonsEndpointURL}/viewer/${accountId}/${identifier}`;
    }

    getViewerURL(
        accountId: string,
        authToken: ?string,
        identifier: string,
        valid_until: ?DateParameter,
        wait: boolean,
    ) {
        const baseURL = this.getComparisonViewerURL({ accountId, identifier });
        if (!valid_until) {
            return `${baseURL}${wait ? '?wait' : ''}`;
        }
        if (typeof valid_until === 'string') {
            valid_until = Date.parse(valid_until);
        }
        if (typeof valid_until !== 'number') {
            valid_until = Number(valid_until);
        }
        // `valid_until` should now be in milliseconds since the UNIX epoch by this point. We want it to be in seconds since the UNIX epoch.
        valid_until = Math.floor(valid_until / 1000);

        const policy = {
            account_id: accountId,
            identifier,
            valid_until,
        };
        if (!authToken) {
            throw Error('Signing a link requires an authToken.');
        }
        const signature = hexHMAC(authToken, policy);
        return `${baseURL}?valid_until=${valid_until}&signature=${signature}${wait ? '&wait' : ''}`;
    }
}
