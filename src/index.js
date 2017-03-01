// @flow

import {ComparisonsEndpoint} from './endpoints';

class Client {
    __accountId: string;
    __authToken: string;

    constructor({accountId, authToken}: {accountId: string, authToken: string}) {
        this.__accountId = accountId;
        this.__authToken = authToken;
    }

    __comparisons: ?ComparisonsEndpoint;

    get comparisons(): ComparisonsEndpoint {
        return this.__comparisons || (this.__comparisons = new ComparisonsEndpoint({accountId: this.__accountId, authToken: this.__authToken}));
    }
}

export function client(accountId: string, authToken: string): Client {
    return new Client({accountId, authToken});
}
