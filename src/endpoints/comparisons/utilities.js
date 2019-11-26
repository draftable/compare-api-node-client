// @flow

import { randomString } from '../../utilities';

const randomIdentifierLength = 12;
const randomIdentifierCharset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateIdentifier() {
    return randomString(randomIdentifierLength, randomIdentifierCharset);
}
