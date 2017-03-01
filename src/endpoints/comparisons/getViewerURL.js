// @flow
import {getComparisonViewerURL} from './urls';
import {hexHMAC} from '../../utilities';

export type DateParameter = Date | string | number;

export default function getViewerURL(accountId: string, authToken: ?string, identifier: string, valid_until: ?DateParameter, wait: boolean) {
    const baseURL = getComparisonViewerURL({accountId, identifier});
    if (!valid_until) {
        return `${baseURL}${wait ? '?wait' : ''}`;
    }
    if (typeof valid_until === "string") {
        valid_until = Date.parse(valid_until);
    }
    if (typeof valid_until !== "number") {
        valid_until = Number(valid_until);
    }
    // `valid_until` should now be in milliseconds since the UNIX epoch by this point. We want it to be in seconds since the UNIX epoch.
    valid_until = Math.floor(valid_until / 1000);

    const policy = {
        account_id: accountId,
        identifier: identifier,
        valid_until: valid_until,
    };
    if (!authToken) {
        throw Error("Signing a link requires an authToken.");
    }
    const signature = hexHMAC(authToken, policy);
    return `${baseURL}?valid_until=${valid_until}&signature=${signature}${wait ? '&wait' : ''}`;
}
