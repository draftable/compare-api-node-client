// These tests run against a test account on the live API. This ensures that everything is still
// working on both the client and on the server.

// Note that for the creation checks, these checks test whether the comparison request is accepted
// by the server. We don't currently check that the comparison eventually succeeds.
// TODO add optional tests to also check that the comparison eventually succeeds. To do this, poll
// the server after the comparison is created until comparison.ready = true then check that
// comparison.failed = false.

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var fs = require('fs');

chai.use(chaiAsPromised);
chai.should();

describe('Compare Api Node Client live tests', function() {
    this.timeout(10000);

    before(function() {
        // These credentials are for the Draftable Comparison API Test Account and can be public.
        this.client = require('..').client('GOiDaN-test', 'fe055b5a54c4d58264f70050a469536e');
        this.comparisons = this.client.comparisons;
        this.identifier = this.comparisons.generateIdentifier();
        this.identifier2 = this.comparisons.generateIdentifier();
        this.identifier3 = this.comparisons.generateIdentifier();
    });

    after(function() {
        this.comparisons.destroy(this.identifier);
        this.comparisons.destroy(this.identifier2);
        this.comparisons.destroy(this.identifier3);
    });

    describe('Create comparison from URLs', function() {

        step('create the comparison', function() {
            var request = this.comparisons.create({
                left: {
                    source: 'https://api.draftable.com/static/test-documents/code-of-conduct/left.rtf',
                    fileType: 'rtf'
                },
                right: {
                    source: 'https://api.draftable.com/static/test-documents/code-of-conduct/right.pdf',
                    fileType: 'pdf'
                },
                identifier: this.identifier
            });
            return Promise.all([
                request.should.eventually.be.fulfilled,
                request.should.eventually.have.property('identifier', this.identifier)
            ]);
        });

        step('retrieve the comparison', function() {
            var request = this.comparisons.get(this.identifier);
            return Promise.all([
                request.should.eventually.be.fulfilled,
                request.should.eventually.have.property('identifier', this.identifier)
            ]);
        });

        step('generate a public viewer URL', function() {
            var viewerURL = this.comparisons.publicViewerURL(this.identifier);
            viewerURL.should.be.a('string');
            viewerURL.should.not.be.empty;
        });

        step('generate a signed viewer URL', function() {
            var viewerURL = this.comparisons.signedViewerURL(this.identifier);
            viewerURL.should.be.a('string');
            viewerURL.should.not.be.empty;
        });

        step('delete the comparison', function() {
            this.comparisons.destroy(this.identifier).then(function() {
                var request = this.comparisons.get(this.identifier);
                return Promise.all([
                    request.should.eventually.be.rejected
                ]);
            });
        });
    });

    describe('Create comparison from files', function() {
        it('should create a comparison', function() {
            var request = this.comparisons.create({
                left: {
                    source: fs.readFileSync('test/assets/left.rtf'),
                    fileType: 'rtf'
                },
                right: {
                    source: fs.readFileSync('test/assets/right.pdf'),
                    fileType: 'pdf'
                },
                identifier: this.identifier2
            });
            return Promise.all([
                request.should.eventually.be.fulfilled,
                request.should.eventually.have.property('identifier', this.identifier2)
            ]);
        });
    });

    describe('Create comparison where one side is file and other side is a URL', function() {
        it('should create a comparison', function() {
            var request = this.comparisons.create({
                left: {
                    source: fs.readFileSync('test/assets/left.rtf'),
                    fileType: 'rtf'
                },
                right: {
                    source: 'https://api.draftable.com/static/test-documents/code-of-conduct/right.pdf',
                    fileType: 'pdf'
                },
                identifier: this.identifier3
            });
            return Promise.all([
                request.should.eventually.be.fulfilled,
                request.should.eventually.have.property('identifier', this.identifier3)
            ]);
        });
    });
});