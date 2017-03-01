// @flow

import {apiBaseURL} from '../urls'

export const comparisonsEndpointURL = `${apiBaseURL}/comparisons`;

export function getComparisonEndpointURL({identifier}: {identifier: string}): string {
    return `${comparisonsEndpointURL}/${identifier}`;
}

export function getComparisonViewerURL({accountId, identifier}: {accountId: string, identifier: string}): string {
    return `${comparisonsEndpointURL}/viewer/${accountId}/${identifier}`;
}
