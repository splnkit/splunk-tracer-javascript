'use strict';

var splunktracing = require('../..');

var tracer = new splunktracing.Tracer({
    access_token   : '08243c00-a31b-499d-9fae-776b41990997',
    component_name : 'splunk-tracer/examples/node-trivial',
    collector_encryption: 'tls'
});

var span = tracer.startSpan('trivial_span');
setTimeout(function() {
    span.log({
        event    : 'log_event',
        my_field : 'a string',
        'generic string' : 'two words',
        number   : 42,
        float    : 4.2,
        obj      : {
            'property': 'value',
        },
    });
    var childSpan = tracer.startSpan('childSpan',{ childOf: span.context()});
    setTimeout(function() {
        childSpan.log({event: 'childevent'})
        childSpan.finish();
    }, 0.5)
}, 600);
setTimeout(function() {
    span.finish();
}, 1000);

tracer.flush();
