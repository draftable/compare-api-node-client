import { ComparisonData, ComparisonSide } from './types';

export default class Comparison {
    identifier: string;

    left: ComparisonSide;

    right: ComparisonSide;

    publiclyAccessible: boolean;

    creationTime: Date;

    expiryTime: void | Date;

    ready: boolean;

    failed: void | boolean;

    errorMessage: void | string;

    constructor(data: ComparisonData) {
        this.identifier = data.identifier;
        this.left = {
            fileType: data.left.file_type,
            sourceURL: data.left.source_url,
            displayName: data.left.display_name,
        };
        this.right = {
            fileType: data.right.file_type,
            sourceURL: data.right.source_url,
            displayName: data.right.display_name,
        };
        this.publiclyAccessible = data.public || false;
        this.creationTime = new Date(Date.parse(data.creation_time));
        if (data.expiry_time) this.expiryTime = new Date(Date.parse(data.expiry_time));
        this.ready = data.ready;
        if (data.failed != null) this.failed = data.failed;
        if (data.error_message != null) this.errorMessage = data.error_message;
    }
}
