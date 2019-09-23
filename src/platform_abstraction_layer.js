/* global PLATFORM_BROWSER */

// Hide the differences in how the Thrift compiler generates code for the
// different platforms as well as expose a Platform class to abstract a few
// general differences in the platforms.
if ((typeof PLATFORM_BROWSER !== 'undefined') && PLATFORM_BROWSER) {
    module.exports = {
        Platform        : require('./imp/platform/browser/platform_browser.js'),
        HTTPTransport  : require('./imp/platform/browser/transport_httpjson.js'),
    };
} else {
    module.exports = {
        Platform        : require('./imp/platform/node/platform_node.js'),
        HTTPTransport  : require('./imp/platform/node/transport_httpjson.js'),
    };
}
