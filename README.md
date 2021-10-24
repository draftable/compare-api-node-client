Draftable Compare API - Node.js Client Library
==============================================

[![npm ver](https://img.shields.io/npm/v/@draftable/compare-api)](https://www.npmjs.com/package/@draftable/compare-api)
[![npm nodever](https://img.shields.io/node/v/@draftable/compare-api)](https://www.npmjs.com/package/@draftable/compare-api)
[![npm dlm](https://img.shields.io/npm/dm/@draftable/compare-api)](https://www.npmjs.com/package/@draftable/compare-api)
[![npm dlt](https://img.shields.io/npm/dt/@draftable/compare-api)](https://www.npmjs.com/package/@draftable/compare-api)
[![license](https://img.shields.io/github/license/draftable/compare-api-node-client)](https://choosealicense.com/licenses/mit/)

[![travis](https://api.travis-ci.com/draftable/compare-api-node-client.svg?branch=stable)](https://app.travis-ci.com/github/draftable/compare-api-node-client)

[![Open in Visual Studio Code](https://open.vscode.dev/badges/open-in-vscode.svg)](https://open.vscode.dev/draftable/compare-api-node-client)

A thin JavaScript client for the [Draftable API](https://draftable.com/rest-api) which wraps all available endpoints and handles authentication and signing.

See the [full API documentation](https://api.draftable.com) for an introduction to the API, usage notes, and other reference material.

- [Requirements](#requirements)
- [Getting started](#getting-started)
- [API reference](#api-reference)
  - [Initializing the client](#initializing-the-client)
  - [Retrieving comparisons](#retrieving-comparisons)
  - [Deleting comparisons](#deleting-comparisons)
  - [Creating comparisons](#creating-comparisons)
  - [Displaying comparisons](#displaying-comparisons)
  - [Utility functions](#utility-functions)
- [Other information](#other-information)
  - [Browser support](#browser-support)
  - [Self-signed certificates](#self-signed-certificates)
  - [Static type checking](#static-type-checking)

Requirements
------------

- Operating system: Any maintained Linux, macOS, or Windows release
- Node.js runtime: Any [maintained version](https://nodejs.org/en/about/releases/)

Getting started
---------------

- Create a free [API account](https://api.draftable.com)
- Retrieve your [credentials](https://api.draftable.com/account/credentials)
- Install the library

```sh
npm install @draftable/compare-api
```

- Instantiate a client

```js
var client = require('@draftable/compare-api').client('<yourAccountId>', '<yourAuthToken>');
var comparisons = client.comparisons;
```

- Start creating comparisons

```js
comparisons.create({
    left: {
        source: 'https://api.draftable.com/static/test-documents/code-of-conduct/left.rtf',
        fileType: 'rtf',
    },
    right: {
        source: 'https://api.draftable.com/static/test-documents/code-of-conduct/right.pdf',
        fileType: 'pdf',
    },
}).then(function(comparison) {
    console.log("Comparison created: %s", comparison);
    // Generate a signed viewer URL to access the private comparison. The expiry
    // time defaults to 30 minutes if the valid_until parameter is not provided.
    const viewerURL = comparisons.signedViewerURL(comparison.identifier);
    console.log("Viewer URL (expires in 30 mins): %s", viewerURL);
});
```

API reference
-------------

- All API requests return _Promises_:
  - Successful calls that return data resolve to `Comparison` objects
  - Successful calls that return no data resolve to `null` (e.g. a `DELETE` request)
  - Calls which fail for any reason will reject the `Promise` with an `Error` object

### Initializing the client

The package exports a function to create a `Client` for your API account.

`Client` provides a `comparisons` property which yields a `ComparisonsClient` to manage the comparisons for your API account.

Creating a `Client` differs slightly based on the API endpoint being used:

```js
// Draftable API (default endpoint)
var comparisons = require('@draftable/compare-api').client(
    '<yourAccountId>',  // Replace with your API credentials from:
    '<yourAuthToken>'   // https://api.draftable.com/account/credentials
).comparisons;

// Draftable API regional endpoint or Self-hosted
var comparisons = require('@draftable/compare-api').client(
    '<yourAccountId>',  // Replace with your API credentials from the regional
    '<yourAuthToken>',  // Draftable API endpoint or your Self-hosted container
    'https://draftable.example.com/api/v1'  // Replace with the endpoint URL
).comparisons;
```

For API Self-hosted you may need to [suppress TLS certificate validation](#self-signed-certificates) if the server is using a self-signed certificate (the default).

### Retrieving comparisons

- `getAll()`  
  Returns a `Promise` which resolves to a list of all your comparisons, ordered from newest to oldest. This is potentially an expensive operation.
- `get(identifier: string)`  
  Returns a `Promise` which resolves to the specified `Comparison` or rejects if the specified comparison identifier does not exist.

`Comparison` objects have the following properties:

- `identifier: string`  
  The unique identifier of the comparison
- `left: object` / `right: object`  
  Information about each side of the comparison
  - `fileType: string`  
    The file extension
  - `sourceURL: string` _(optional)_  
    The URL for the file if the original request was specified by URL
  - `displayName: string` _(optional)_  
    The display name for the file if given in the original request
- `publiclyAccessible: boolean`  
  Indicates if the comparison is public
- `creationTime: Date`  
  Time in UTC when the comparison was created
- `expiryTime: Date` _(optional)_  
  The expiry time if the comparison is set to expire
- `ready: boolean`  
  Indicates if the comparison is ready to display

If a `Comparison` is _ready_ (i.e. it has been processed) it has the following additional properties:

- `failed: boolean`  
  Indicates if comparison processing failed
- `errorMessage: string` _(only present if `failed`)_  
  Reason processing of the comparison failed

#### Example usage

```js
var identifier = '<identifier>';

comparisons.get(identifier).then(function(comparison) {
    const visibility = comparison.publiclyAccessible ? 'private' : 'public';
    const status = comparison.ready ? 'ready' : 'not ready';
    console.log("Comparison '%s' (%s) is %s.", comparison.identifier, visibility, status);

    if (comparison.ready && comparison.failed) {
        console.log("The comparison failed with error: %s", comparison.errorMessage);
    }
});
```

### Deleting comparisons

- `destroy(identifier: string)`  
  Returns a `Promise` which resolves on successfully deleting the specified comparison or rejects if no such comparison exists.

#### Example usage

```js
comparisons.getAll().then(function(oldest_comparisons) {
    console.log("Deleting oldest 10 comparisons ...");
    const deleteStartIndex = Math.max(0, oldest_comparisons.length - 10);

    for (let i = deleteStartIndex; i < oldest_comparisons.length; ++i) {
        const identifier = oldest_comparisons[i].identifier;
        comparisons.destroy(identifier).then(function() {
            console.log("Comparison '%s' deleted.", identifier);
        });
    }
});
```

### Creating comparisons

- `create(options)`  
  Returns a `Promise` which resolves to a new `Comparison` object.

`options` consists of the following parameters:

- `left: object` / `right: object`  
  Describes the left and right files (see below)
- `identifier: string` _(optional)_  
  Identifier to use for the comparison:
  - If specified, the identifier must be unique (i.e. not already be in use)
  - If unspecified, the API will automatically generate a unique identifier
- `publiclyAccessible: boolean` _(optional)_  
  Specifies the comparison visibility:
  - If `false` or unspecified authentication is required to view the comparison
  - If `true` the comparison can be accessed by anyone with knowledge of the URL
- `expires: Date | string` _(optional)_  
  Time at which the comparison will be deleted:
  - Must be specified as a `Date` object or a `string` which can be parsed by `Date.parse`
  - If specified, the provided expiry time must be UTC and in the future
  - If unspecified, the comparison will never expire (but may be explicitly deleted)

`options.left` and `options.right` consist of the following parameters:

- `source: buffer | string`  
  Specifies the source for this side of the comparison:
  - If provided as a `buffer`, contains the file data (e.g. `{source: fs.readFileSync('path/to/file')}`)
  - If provided as a `string`, the URL from which the server will download the file (e.g. `{source: 'https://example.com/path/to/file'}`)
- `fileType: string`  
  The type of file being submitted:
  - PDF: `pdf`
  - Word: `docx`, `docm`, `doc`, `rtf`
  - PowerPoint: `pptx`, `pptm`, `ppt`
- `displayName: string` _(optional)_  
  The name of the file shown in the comparison viewer

#### Example usage

```js
var identifier = comparisons.generateIdentifier();

comparisons.create({

    identifier: identifier,

    left: {
        source: 'https://domain.com/left.pdf',
        fileType: 'pdf',
        displayName: 'Document.pdf',
    },

    right: {
        source: fs.readFileSync('path/to/right/file.docx'),
        fileType: 'docx',
        displayName: 'Document (revised).docx',
    },

    // Expire this comparison in 2 hours (default is no expiry)
    expires: new Date(Date.now() + 1000 * 60 * 120),

}).then(function(comparison) {
    console.log("Created comparison: %s", comparison);
});
```

### Displaying comparisons

- `publicViewerURL(identifier: string, wait?: boolean)`  
  Generates a public viewer URL for the specified comparison
- `signedViewerURL(identifier: string, valid_until?: Date | string, wait?: boolean)`  
  Generates a signed viewer URL for the specified comparison

Both functions use the following common parameters:

- `identifier`  
  Identifier of the comparison for which to generate a _viewer URL_
- `wait` _(optional)_  
  Specifies the behaviour of the viewer if the provided comparison does not exist
  - If `false` or unspecified, the viewer will show an error if the `identifier` does not exist
  - If `true`, the viewer will wait for a comparison with the provided `identifier` to exist  
    Note this will result in a perpetual loading animation if the `identifier` is never created

The `signedViewerURL` function also supports the following parameters:

- `valid_until` _(optional)_  
  Time at which the URL will expire (no longer load)
  - Must be specified as a `Date` object or a `string` which can be parsed by `Date.parse`
  - If specified, the provided expiry time must be UTC and in the future
  - If unspecified, the URL will be generated with the default 30 minute expiry

See the displaying comparisons section in the [API documentation](https://api.draftable.com) for additional details.

#### Example usage

```js
var identifier = '<identifier>'

// Retrieve a signed viewer URL which is valid for 1 hour. The viewer will wait
// for the comparison to exist in the event processing has not yet completed.
var valid_until = new Date(Date.now() + 1000 * 60 * 60)
var viewerURL = comparisons.signedViewerURL(identifier, valid_until, true);
console.log("Viewer URL (expires in 1 hour): %s", viewerURL);
```

### Utility functions

- `generateIdentifier()`  
  Generates a random unique comparison identifier

Other information
-----------------

### Browser support

This library is designed primarily for server-side usage. Usage in web browsers (client-side) is not currently supported.

Calling the Draftable API via client-side JavaScript is generally discouraged as this implies sharing API credentials with end-users.

### Self-signed certificates

If connecting to an API Self-hosted endpoint which is using a self-signed certificate (the default) you will need to suppress certificate validation. This can be done by setting the `NODE_TLS_REJECT_UNAUTHORIZED` environment variable to `0`.

See the below examples for different operating systems and shell environments. Note that all examples only set the variable for the running shell and it will not persist. To persist the setting consult the documentation for your shell environment. This should be done with caution as this setting suppresses certificate validation for **all** connections made by the Node.js runtime!

(ba)sh (Linux, macOS, WSL)

```sh
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

PowerShell:

```posh
$env:NODE_TLS_REJECT_UNAUTHORIZED=0
```

Command Prompt (Windows):

```cmd
SET NODE_TLS_REJECT_UNAUTHORIZED=0
```

Setting this environment variable in production environments is strongly discouraged as it significantly lowers security. We only recommend setting this environment variable in development environments if configuring a CA signed certificate for API Self-hosted is not possible.

### Static type checking

We use [Flow](https://flow.org/) for static type checking:

- All source code has [Flow](https://flow.org/) type annotations
- The published package has type information available in `dist/flow`

If you're using Flow you can enable type checking by adding the following snippet to your project's `.flowconfig`:

```ini
[libs]
<PROJECT_ROOT>/node_modules/@draftable/compare-api/dist/flow
```
