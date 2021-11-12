import { allowedFileTypes } from "./consts";

export type SideData = {
    file_type: FileType,
    source_url?: string | null,
    display_name?: string | null,
};

export type ComparisonData = {
    identifier: string,
    left: SideData,
    right: SideData,
    creation_time: string,
    // noinspection ReservedWordAsName
    public?: boolean | null,
    expiry_time?: string,
    ready: boolean,
    failed?: boolean | null,
    error_message?: string | null,
};

export type ComparisonSide = {
    fileType: FileType,
    sourceURL?: string | null,
    displayName?: string | null,
};

export type FileType = keyof typeof allowedFileTypes;

export type Stream = { pipe: Function, };

export type Side = {
    source: Stream | string,
    fileType: FileType,
    displayName?: string,
};
