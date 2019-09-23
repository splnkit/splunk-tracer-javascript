var splunktracing = require("../../../..");
var FileTransport = require("../../../util/file_transport");
var path = require('path');
var filename = path.join(__dirname, "../../../results/cmdline_args.json");

var transport = new FileTransport(filename);
var Tracer = new splunktracing.Tracer({
    access_token           : "{your_access_token}",
    component_name         : "api-javascript/unit-test/cmdline_args",
    override_transport     : transport,
});

for (var i = 0; i < 10; i++) {
    var span = Tracer.startSpan("test_span_" + i);
    span.log({"record_idx" : i});
    span.finish();
}
