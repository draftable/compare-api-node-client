import hexHMAC from '../utilities/hexHMAC';
import { DateParameter } from './types';

export default class Urls {
    baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    get comparisonsEndpointURL(): string {
        return `${this.baseUrl}/comparisons`;
    }

    get exportsEndpointURL(): string {
        return `${this.baseUrl}/exports`;
    }

    getComparisonEndpointURL({ identifier }: { identifier: string }): string {
        return `${this.comparisonsEndpointURL}/${identifier}`;
    }

    getComparisonViewerURL({ accountId, identifier }: { accountId: string; identifier: string }): string {
        return `${this.comparisonsEndpointURL}/viewer/${accountId}/${identifier}`;
    }

    getExportEndpointURL({ identifier }: { identifier: string }): string {
        return `${this.exportsEndpointURL}/${identifier}`;
    }

    getViewerURL(
        accountId: string,
        authToken: string | null | undefined,
        identifier: string,
        valid_until: DateParameter | null | undefined,
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
