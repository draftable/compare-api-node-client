// These tests run against a test account on the live API. This ensures that everything is still
// working on both the client and on the server.

// Note that for the creation checks, these checks test whether the comparison request is accepted
// by the server. We don't currently check that the comparison eventually succeeds.
// TODO add optional tests to also check that the comparison eventually succeeds. To do this, poll
// the server after the comparison is created until comparison.ready = true then check that
// comparison.failed = false.

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const fs = require('fs');

chai.use(chaiAsPromised);
chai.should();

describe('Compare Api Node Client live tests', function () {
    this.timeout(10000);

    before(function () {
        // From https://api.draftable.com/account/credentials under "Account ID"
        this.client = require('..').client(process.env.DR_ACCOUNT, process.env.DR_TOKEN);
        this.comparisons = this.client.comparisons;
        this.identifiers = Array.from({ length: 3 }, () => this.comparisons.generateIdentifier());
    });

    after(function () {
        this.identifiers.forEach((identifier) => this.comparisons.destroy(identifier).catch((err) => {}));
    });

    describe('Create comparison from URLs', function () {
        step('create the comparison', function () {
            const request = this.comparisons.create({
                left: {
                    source: 'https://api.draftable.com/static/test-documents/code-of-conduct/left.rtf',
                    fileType: 'rtf',
                },
                right: {
                    source: 'https://api.draftable.com/static/test-documents/code-of-conduct/right.pdf',
                    fileType: 'pdf',
                },
                identifier: this.identifiers[0],
            });
            return Promise.all([
                request.should.eventually.be.fulfilled,
                request.should.eventually.have.property('identifier', this.identifiers[0]),
            ]);
        });

        step('retrieve the comparison', function () {
            const request = this.comparisons.get(this.identifiers[0]);
            return Promise.all([
                request.should.eventually.be.fulfilled,
                request.should.eventually.have.property('identifier', this.identifiers[0]),
            ]);
        });

        step('generate a public viewer URL', function () {
            const viewerURL = this.comparisons.publicViewerURL(this.identifiers[0]);
            viewerURL.should.be.a('string');
            viewerURL.should.not.be.empty;
        });

        step('generate a signed viewer URL', function () {
            const viewerURL = this.comparisons.signedViewerURL(this.identifiers[0]);
            viewerURL.should.be.a('string');
            viewerURL.should.not.be.empty;
        });

        step('delete the comparison', function () {
            this.comparisons.destroy(this.identifiers[0]).then(() => {
                const request = this.comparisons.get(this.identifiers[0]);
                return Promise.all([request.should.eventually.be.rejected]);
            });
        });
    });

    describe('Create comparison from files', function () {
        it('should create a comparison', function () {
            const request = this.comparisons.create({
                left: {
                    source: fs.readFileSync('test/assets/left.rtf'),
                    fileType: 'rtf',
                },
                right: {
                    source: fs.readFileSync('test/assets/right.pdf'),
                    fileType: 'pdf',
                },
                identifier: this.identifiers[1],
            });
            return Promise.all([
                request.should.eventually.be.fulfilled,
                request.should.eventually.have.property('identifier', this.identifiers[1]),
            ]);
        });
    });

    describe('Create comparison where one side is file and other side is a URL', function () {
        it('should create a comparison', function () {
            const request = this.comparisons.create({
                left: {
                    source: fs.readFileSync('test/assets/left.rtf'),
                    fileType: 'rtf',
                },
                right: {
                    source: 'https://api.draftable.com/static/test-documents/code-of-conduct/right.pdf',
                    fileType: 'pdf',
                },
                identifier: this.identifiers[2],
            });
            return Promise.all([
                request.should.eventually.be.fulfilled,
                request.should.eventually.have.property('identifier', this.identifiers[2]),
            ]);
        });
    });
});
