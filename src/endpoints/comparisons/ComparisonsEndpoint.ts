import { generateIdentifier as _generateIdentifier } from './utilities';
import Urls from '../urls';
import { Side, Stream } from './types';
import AuthenticatedNeedleClient from '../../utilities/AuthenticatedNeedleClient';
import Comparison from './Comparison';
import { allowedFileTypes } from './consts';
import { DateParameter } from '../types';

export default class ComparisonsEndpoint {
    __needleClient: AuthenticatedNeedleClient;

    __urls: Urls;

    get accountId(): string {
        return this.__needleClient.accountId;
    }

    get authToken(): string {
        return this.__needleClient.authToken;
    }

    constructor({ accountId, authToken, urls }: { accountId: string, authToken: string, urls: Urls, }) {
        this.__needleClient = new AuthenticatedNeedleClient({ accountId, authToken });
        this.__urls = urls;
    }

    getAll = (): Promise<Comparison[]> =>
        this.__needleClient.get(this.__urls.comparisonsEndpointURL).then((data: any) => {
            if (!data || !data.results) {
                throw new Error(
                    `Unexpected response received - expected object with non-null results array, instead got: ${JSON.stringify(
                        data,
                    )}`,
                );
            }
            return data.results.map((data: any): Comparison => new Comparison(data));
        });

    get = (identifier: string): Promise<Comparison> =>
        this.__needleClient.get(this.__urls.getComparisonEndpointURL({ identifier })).then((data: any) => {
            if (!data) {
                throw new Error(
                    'Unexpected response received - expected non-empty comparison object, instead got nothing.',
                );
            }
            return new Comparison(data);
        });

    create = ({
        left,
        right,
        identifier,
        publiclyAccessible,
        expires,
    }: {
        left: Side,
        right: Side,
        identifier?: string,
        publiclyAccessible?: boolean,
        expires?: DateParameter,
    }): Promise<Comparison> => {
        // We need to use a multipart request when either either file is specified using a buffer rather than a URL.
        const multipartRequired = !(typeof left.source === 'string' && typeof right.source === 'string');
        function getSideData(side: string, data: Side) {
            if (data.fileType == null || typeof data.fileType !== 'string') {
                throw new Error('Invalid file type given - file type must be a string.');
            }
            if (allowedFileTypes[data.fileType.toLowerCase()] == null) {
                throw new Error(
                    `Invalid file type "${data.fileType.toLowerCase()}" given. Expected one of ("${Object.keys(
                        allowedFileTypes,
                    ).join('", "')}").`,
                );
            }
            const sideData: { file_type?: string, display_name?: string , source_url?: string | Stream } = {};
            if (multipartRequired) {
                sideData[`${side}.file_type`] = data.fileType;
                if (data.displayName) {
                    sideData[`${side}.display_name`] = data.displayName;
                }
                if (typeof data.source === 'string') {
                    sideData[`${side}.source_url`] = data.source;
                } else {
                    sideData[`${side}.file`] = {
                        content_type: 'application/octet-stream',
                        filename: `${side}.${data.fileType}`,
                        buffer: data.source,
                    };
                }
                return sideData;
            }
            sideData.file_type = data.fileType;
            if (data.displayName) {
                sideData.display_name = data.displayName;
            }
            sideData.source_url = data.source;
            const return_val = {};
            return_val[side] = sideData;
            return return_val;
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
                ...getSideData('left', left),
                ...getSideData('right', right),
                public: publiclyAccessible,
                expiry_time: expires,
            };
            return this.__needleClient
                .post(this.__urls.comparisonsEndpointURL, data, multipartRequired)
                .then((data: any) => {
                    if (!data) {
                        throw new Error(
                            'Unexpected response received - expected non-empty comparison object, instead got nothing.',
                        );
                    }
                    return new Comparison(data);
                });
        } catch (error) {
            return Promise.reject(error);
        }
    };

    destroy = (identifier: string): Promise<null> =>
        this.__needleClient.destroy(this.__urls.getComparisonEndpointURL({ identifier }));

    generateIdentifier = (): string => _generateIdentifier();

    publicViewerURL = (identifier: string, wait?: boolean): string =>
        this.__urls.getViewerURL(this.accountId, null, identifier, null, wait || false);

    signedViewerURL = (identifier: string, valid_until?: DateParameter, wait?: boolean): string =>
        this.__urls.getViewerURL(
            this.accountId,
            this.authToken,
            identifier,
            valid_until || Date.now() + 30 * 60 * 1000,
            wait || false,
        );
}
