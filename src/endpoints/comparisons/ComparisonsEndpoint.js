// @flow
import {AuthenticatedNeedleClient} from '../../utilities';
import {generateIdentifier as _generateIdentifier} from './utilities';
import getViewerURL from './getViewerURL';
import type {DateParameter} from './getViewerURL';
import {comparisonsEndpointURL, getComparisonEndpointURL} from './urls';

import {allowedFileTypes} from './fileTypes';
import type {FileType} from './fileTypes';

import Comparison from './Comparison';

type Stream = {
    pipe: Function;
}

type Side = {
    source: Stream | string,
    fileType: FileType,
    displayName?: ?string,
}

export default class ComparisonsEndpoint {
    __needleClient: AuthenticatedNeedleClient;
    get accountId(): string {
        return this.__needleClient.accountId;
    }
    get authToken(): string {
        return this.__needleClient.authToken;
    }

    constructor({accountId, authToken}: {accountId: string, authToken: string}) {
        this.__needleClient = new AuthenticatedNeedleClient({accountId, authToken});
    }

    getAll = (): Promise<Comparison> =>
        this.__needleClient.get(comparisonsEndpointURL).then(data => {
            if (!data || !data.results) {
                throw new Error(`Unexpected response received - expected object with non-null results array, instead got: ${JSON.stringify(data)}`);
            }
            return data.results.map((data: any): Comparison => new Comparison(data));
        });

    get = (identifier: string): Promise<Comparison> =>
        this.__needleClient.get(getComparisonEndpointURL({identifier})).then((data: ?any) => {
            if (!data) {
                throw new Error('Unexpected response received - expected non-empty comparison object, instead got nothing.');
            }
            return new Comparison(data);
        });

    create = ({left, right, identifier, publiclyAccessible, expires}: {left: Side, right: Side, identifier?: ?string, publiclyAccessible?: ?boolean, expires?: ?DateParameter}): Promise<Comparison> => {
        let multipartRequired = false;
        function getSideData(side: string, data: Side) {
            if (data.fileType == null || typeof data.fileType !== "string") {
                throw new Error('Invalid file type given - file type must be a string.')
            }
            if (allowedFileTypes[data.fileType.toLowerCase()] == null) {
                throw new Error(`Invalid file type "${data.fileType.toLowerCase()}" given. Expected one of ("${Object.keys(allowedFileTypes).join('", "')}").`)
            }
            const sideData: Object = {};
            sideData.file_type = data.fileType;
            if (data.displayName) {
                sideData.display_name = data.displayName;
            }
            if (typeof data.source === 'string') {
                sideData.source_url = data.source;
            } else {
                sideData.file = {content_type: 'application/octet-stream', filename: `${side}.${data.fileType}`, buffer: data.source};
                multipartRequired = true;
            }
            return sideData;
        }

        try {
            if (expires) {
                if (typeof expires === 'string') {
                    expires = Date.parse(expires);
                }
                if (typeof expires === 'number') {
                    expires = new Date(expires);
                }
                expires = expires.toISOString();
            }
            const data = {
                identifier,
                left: getSideData('left', left),
                right: getSideData('right', right),
                public: publiclyAccessible,
                expiry_time: expires,
            };
            return this.__needleClient.post(comparisonsEndpointURL, data, multipartRequired).then((data: ?any) => {
                if (!data) {
                    throw new Error('Unexpected response received - expected non-empty comparison object, instead got nothing.');
                }
                return new Comparison(data);
            });
        } catch (error) {
            return Promise.reject(error);
        }
    };

    destroy = (identifier: string): Promise<null> =>
        this.__needleClient.destroy(getComparisonEndpointURL({identifier}));

    generateIdentifier = (): string => _generateIdentifier();

    publicViewerURL = (identifier: string, wait?: boolean): string =>
        getViewerURL(this.accountId, null, identifier, null, wait || false);

    signedViewerURL = (identifier: string, valid_until?: DateParameter, wait?: boolean): string =>
        getViewerURL(this.accountId, this.authToken, identifier, valid_until || (Date.now() + 30 * 60 * 1000), wait || false);
}
