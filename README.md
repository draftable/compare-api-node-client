# Draftable Compare API - Node.js Client Library

This is a thin Javascript client for Draftable's [document comparison API](https://api.draftable.com/).
It wraps the available endpoints, and handles authentication and signing for you.
The library is [available on npm](https://www.npmjs.com/package/@draftable/compare-api) as `@draftable/compare-api`.

See the [full API documentation](https://api.draftable.com) for an introduction to the API, usage notes, and other references.

### Getting started

- Sign up for free at [api.draftable.com](https://api.draftable.com) to get your credentials.

- `npm install @draftable/compare-api`

- Instantiate the client:
    ```
    const client = require('@draftable/compare-api').client(<yourAccountId>, <yourAuthToken>);
    const comparisons = client.comparisons;
    ```

- Start creating comparisons:
    ```
    comparisons.create({
        left: {
            source: 'https://domain.com/left.pdf',
            fileType: 'pdf',
        },
        right: {
            source: fs.readFileSync('path/to/right/file.docx'),
            fileType: 'docx',
        },
    }).then(function(comparison) {
       console.log("Comparison created:", comparison);
       console.log("Viewer URL (expires in 30 min):", comparisons.signedViewerURL(comparison.identifier));
   });
    ```

-----

# Client API

### Design notes

- All API requests return _Promises_.
  - Successful API calls that return data will resolve to `Comparison` objects with the parsed data.
  - Successful calls that return no data (e.g. a `DELETE` request) resolve to `null`.
  - Calls that fail for any reason will reject the Promise, with an `Error` object describing what went wrong.
  
- API requests should always succeed in production. Errors only occur upon network failures, invalid data, or invalid authentication.


### Initializing the client

`@draftable/compare-api` exports a single function, `client(accountId: string, authToken: string)`.
Call it to create a `Client` for your API account.

At present, `Client` has a single property, `comparisons`, that yields a `ComparisonsClient` that manages the comparisons for your API account.

So, we'll assume you set things up as follows:
    
    const comparisons = require('@draftable/compare-api').client(<yourAccountId>, <yourAuthToken>).comparisons;


### Getting comparisons

`ComparisonsClient` provides `getAll()` and `get(identifier: string)`.
- `getAll()` returns a `Promise` that resolves to a list of _all your comparisons_, ordered from newest to oldest. This is a potentially expensive operation.
- `get(identifier: string)` returns a `Promise` that resolves to a single `Comparison` object, or rejects if there isn't a comparison with that identifier.

###### Comparison objects

`Comparison` objects have the following properties:
- `identifier`: a `string` giving the identifier. 
- `left`, `right`: objects giving information about each side, containing:
    - `fileType`: the file extension.
    - `sourceURL` _(optional)_: if the file was specified as a URL, this is a `string` giving that URL.
    - `displayName` _(optional)_: a `string` giving the display name, if one was given.
- `publiclyAccessible`: a `boolean` giving whether the comparison is public, or requires authentication to view.
- `creationTime`: a `Date` giving when the comparison was created.
- `expiryTime` _(optional)_: if the comparison will expire, a `Date` giving the expiry time.
- `ready`: `boolean` indicating whether the comparison is ready for display.

If a `Comparison` is `ready` (i.e. it has been processed and is ready for display), it will have the following additional properties:
- `readyTime`: `Date` giving the time the comparison became ready.
- `failed`: `boolean` indicating whether the comparison succeeded or failed.
- `errorMessage` _(only present if `failed`)_: provides the developer with the reason the comparison failed.

###### Example usage
    
    comparisons.get('<identifier>').then(function(comparison) {
        const privateOrPublic = comparison.publiclyAccessible ? "private" : "public";
        const readyOrNot = comparison.ready ? "ready" : "not ready yet";
        console.log("Comparison '" + comparison.identifier + "' (" + privateOrPublic + ") is " + readyOrNot + ".");
        if (comparison.ready) {
            const secondsElapsed = Math.round((comparison.readyTime - comparison.creationTime) / 1000);
            console.log("The comparison took " + secondsElapsed + " seconds.");
            if (comparison.failed) {
                console.log("The comparison failed. Error message: " + comparison.errorMessage);
            }
        }
    });


### Deleting comparisons

`ComparisonsClient` provides `destroy(identifier: string)`, which attempts to delete the comparison with that identifier.

It returns a `Promise` that resolves (with no return value) on success, and rejects with an error message if no comparison with that identifier exists. 

###### Example usage
    
    comparisons.getAll().then(function(comparisons) {
        console.log("Deleting oldest 10 comparisons.");
        const deleteStartIndex = Math.max(0, comparisons.length - 10);
        
        for (let i = deleteStartIndex; i < comparisons.length; ++i) {
            const identifier = comparisons[i].identifier;
            comparisons.destroy(identifier).then(function() {
                console.log("Comparison '" + identifier + "' deleted.");
            });        
        }
    });


### Creating comparisons

`ComparisonsClient` provides `create(options)`, which returns a `Promise` that resolves to a newly created `Comparison` object.

###### Creation options

`options` should contain:

- `left`, `right`: objects describing the left and right files.
- `identifier` _(optional)_: the identifier to use for the comparison.
    - If specified, the identifier can't clash with an existing comparison.
    - If left unspecified, the API will automatically generate one for you.
- `publiclyAccessible` _(optional)_: whether the comparison is publicly accessible.
    - Defaults to `false` if unspecified. If `true`, then the comparison viewer can be accessed by anyone, without authentication.
    - See the full API documentation for details.
- `expires` _(optional)_: a time at which the comparison will be automatically deleted.
    - Can be specified as a `Date` object, or a `string` that `Date.parse` can understand.
    - If specified, the time must be in the future.
    - If unspecified, the comparison will never expire.
 
`options.left` and `options.right` should contain:
- `source`: either a `buffer` giving the file data, or a `string` giving a full URL from which Draftable will download the file.
- `fileType`: the type of the file, specified by the file extension.
    - The following file types are supported:
        - PDF: `pdf`
        - Word: `docx`, `docm`, `doc`, `rtf`
        - PowerPoint: `pptx`, `pptm`, `ppt`
    - If you provide the incorrect file type, the comparison will fail.
- `displayName` _(optional)_: a `string` that gives a name for the file to show in the comparison.

###### Example usage

    const identifier = comparisons.generateIdentifier(); # Generates a unique identifier.

    comparisons.create({

        identifier: identifier,

        left: {
            source: 'https://domain.com/left.pdf',
            fileType: 'pdf',
            displayName: 'document.pdf',
        },

        right: {
            source: fs.readFileSync('path/to/right/file.docx'),
            fileType: 'docx',
            displayName: 'document (revised).docx',
        },
        
        # 'publiclyAccessible' is omitted, because we only want to let authenticated users view the comparison.
        
        # Comparison expires 30 minutes into the future. (Date.now() is in milliseconds since the UNIX epoch.)
        expires: new Date(Date.now() + 1000 * 60 * 30),

    }).then(function(comparison) {
        console.log("Created comparison:", comparison);
        
        # This generates a signed viewer URL that can be used to access the private comparison for the next hour.
        console.log("Viewer URL (expires in 30 min):", comparisons.signedViewerURL(comparison.identifier));
    });


### Displaying comparisons

Comparisons are displayed using a _viewer URL_. See the section on displaying comparisons in the [full API documentation](https://api.draftable.com) for details.

Viewer URLs are generated with the following methods:

- `comparisons.publicViewerURL(identifier: string, wait?: boolean)`
    - Viewer URL for a public comparison with the given `identifier`.
    - If `wait` is `false` or unspecified, the viewer will show an error if no such comparison exists.
    - If `wait` is `true`, the viewer will wait for a comparison with the given `identifier` to exist (potentially displaying a loading animation forever).

- `comparisons.signedViewerURL(identifier: string, valid_until?: Date | string, wait?: boolean)`
    - Gets a signed viewer URL for a comparison with the given `identifier`. (The signature is an HMAC based on your credentials.)
    - If `wait` is `true`, the viewer will wait forever for a comparison with the given `identifier` to exist.
    - `valid_until` gives when the link will expire. It's specified as a `Date` or a `string` that `Date.parse` can understand.
        - `valid_until` defaults to 30 minutes in the future, which is more than enough time for a user to have loaded the page.


####### Example usage

```
const identifier = comparisons.generateIdentifier()

# Start uploading our request in the background. 
comparisons.create({left: {...}, right: {...}});

# Immediately give the user a view link to use, that displays a loading animation while we're creating the comparison.
# The URL is valid for 30 minutes, the default amount of time.
const viewerURL = comparisons.signedViewerURL(identifier, undefined, true);

console.log(viewerURL);
```

### Utility methods

- `comparisons.generateIdentifier()` generates a random unique identifier for you to use.

-----

# Other information

### Static type checking with Flow (optional)

All of the source code has Flow type annotations ([flowtype.org](https://flowtype.org/)).
The published package has typing information in `dist/flow`.

If you're using Flow, add the following to your `.flowconfig` to enable type checking: 

    [libs]
    <PROJECT_ROOT>/node_modules/@draftable/compare-api/dist/flow

### Known issues

###### Streams support

The lack of support for streams when uploading files is a known issue. This is a limitation that emerges from the lightweight request library we use, `needle`. 

If this causes you issues, consider adapting the code, or contact us at [support@draftable.com](mailto://support@draftable.com) as we may be able to help.

###### Lack of browser compatibility

We chose not to support browsers, as it's hazardous to be sharing your credentials with any users of your software.

If you find yourself needing to use the API from in a browser context, contact us at [support@draftable.com](mailto://support@draftable.com) for pointers.
You'll likely want to use more advanced authentication than just passing your auth token into requests made in the browser. 
