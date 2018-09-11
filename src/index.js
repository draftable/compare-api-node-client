// @flow

import {ComparisonsEndpoint} from './endpoints';
import Urls from "./endpoints/urls";

class Client {
    __accountId: string;
    __authToken: string;
    __urls: Urls;

    constructor({accountId, authToken, baseUrl}: {accountId: string, authToken: string, baseUrl: ?string}) {
        this.__accountId = accountId;
        this.__authToken = authToken;
        this.__urls = new Urls(typeof baseUrl === 'string' ? baseUrl : "https://api.draftable.com/v1");
    }

    __comparisons: ?ComparisonsEndpoint;

    get baseUrl(): string {
        return this.__urls.baseUrl;
    }

    get comparisons(): ComparisonsEndpoint {
        return this.__comparisons || (this.__comparisons = new ComparisonsEndpoint({
            accountId: this.__accountId, authToken: this.__authToken, urls: this.__urls}));
    }
}

export function client(accountId: string, authToken: string, baseUrl: ?string): Client {
    return new Client({accountId, authToken, baseUrl});
}
