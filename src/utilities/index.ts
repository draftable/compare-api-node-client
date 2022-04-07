/* eslint-disable no-restricted-syntax */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-continue */
import WrappedError from './WrappedError';
import AuthenticatedNeedleClient from './AuthenticatedNeedleClient';
import randomString from './randomString';
import hexHMAC from './hexHMAC';
import { Stream } from '../endpoints/comparisons/types';

export { WrappedError, AuthenticatedNeedleClient, randomString, hexHMAC };

export function isStream(object: Stream): boolean {
    return object && object.pipe && typeof object.pipe === 'function';
}

export function dataContainsStream(data: unknown): boolean {
    if (Array.isArray(data)) {
        for (const value of data) {
            if (value) {
                if (isStream(value)) {
                    return true;
                }
                if (dataContainsStream(value)) {
                    return true;
                }
            }
        }
        return false;
    }
    if (typeof data !== 'object') {
        return false;
    }
    for (const key in data) {
        if (!data.hasOwnProperty(key)) {
            continue;
        }
        const value = data[key];
        if (value) {
            if (isStream(value)) {
                return true;
            }
            if (dataContainsStream(value)) {
                return true;
            }
        }
    }
    return false;
}
