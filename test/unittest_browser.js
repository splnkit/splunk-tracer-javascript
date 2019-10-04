var LocalStorageTransport = require('./util/localstorage_transport');

global.Tracer = new splunktracing.Tracer({
    access_token       : '{your_access_token}',
    component_name     : 'splunk/unittests/browser',
    override_transport : new LocalStorageTransport('splunk_report'),
});

describe("Common", function() {
    require("./suites/common.js");
});
describe("Browser-specific", function() {
    require("./suites/browser.js");
});
