import * as https from 'https';
import * as http from 'http';
import * as zlib from 'zlib';

const kMaxDetailedErrorFrequencyMs = 30000;
const kMaxStringLength = 2048;

function truncatedString(s) {
    if (!s || s.length <= kMaxStringLength) {
        return s;
    }
    let half = Math.floor(kMaxStringLength / 2);
    return `${s.substr(0, half)}...${s.substr(-half)}`;
}

function encodeAndTruncate(obj) {
    try {
        return truncatedString(obj.toString('utf8'));
    } catch (exception) {
        return exception;
    }
}

function errorFromResponse(res, buffer) {
    if (buffer && buffer.length) {
        buffer = truncatedString(`${buffer}`.replace(/\s+$/, ''));
    }
    return new Error(`status code=${res.statusCode}, message='${res.statusMessage}', body='${buffer}'`);
}

export default class TransportHTTPJSON {
    constructor(logger) {
        this._host = '';
        this._port = 0;
        this._encryption = '';
        this._timeoutMs = 0;

        this._logger = logger;
        this._lastLogMs = 0;
    }

    ensureConnection(opts) {
        this._host       = opts.collector_host;
        this._port       = opts.collector_port;
        this._encryption = opts.collector_encryption;
        this._timeoutMs  = opts.report_timeout_millis;
        this._gzipJSON   = opts.gzip_json_requests;
    }

    _preparePayload(useGzip, auth, reportRequest, cb) {
        let payload;
        try {
            let reportJSON = reportRequest.toJSON(auth);
            payload = reportJSON.join('\n');
        } catch (exception) {
            // This should never happen. The library should always be constructing
            // valid reports.
            this._error('Could not JSON.stringify report!');
            return cb(exception);
        }

        if (useGzip) {
            return zlib.gzip(payload, cb);
        }
        return cb(null, payload);
    }

    report(detached, auth, reportRequest, done) {
        let options = {
            hostname : this._host,
            port     : this._port,
            method   : 'POST',
            path     : '/services/collector',
            rejectUnauthorized: false,
        };

        let protocol = (this._encryption === 'none') ? http : https;
        let useGzip = this._gzipJSON;

        this._preparePayload(useGzip, auth, reportRequest, (payloadErr, payload) => {
            if (payloadErr) {
                this._error('Error serializing payload');
                return done(payloadErr);
            }

            let extraErrorData = [];

            let req = protocol.request(options, (res) => {
                let buffer = '';
                res.on('data', (chunk) => {
                    buffer += chunk;
                });
                res.on('end', () => {
                    let err = null;
                    let resp = null;
                    if (res.statusCode === 400) {
                        this._throttleLog(() => {
                            this._warning('transport status code = 400', {
                                code    : res.statusCode,
                                message : res.statusMessage,
                                body    : buffer,
                                extra   : extraErrorData,
                                report  : encodeAndTruncate(reportRequest),
                            });
                        });
                        err = errorFromResponse(res, buffer);
                    } else if (res.statusCode !== 200) {
                        err = errorFromResponse(res, buffer);
                    } else if (!buffer) {
                        err = new Error('unexpected empty response');
                    } else {
                        try {
                            resp = JSON.parse(buffer);
                        } catch (exception) {
                            err = exception;
                        }
                    }
                    return done(err, resp);
                });
            });
            req.on('socket', (socket, head) => {
                socket.setTimeout(this._timeoutMs);
                socket.on('timeout', () => {
                    // abort() will generate an error, so done() is called as a
                    // result.
                    req.abort();
                    extraErrorData.push(`Request timed out (${this._timeoutMs} ms)`);
                });
            });
            req.on('error', (err) => {
                this._throttleLog(() => {
                    this._warning('HTTP request error', {
                        error  : err,
                        extra  : extraErrorData,
                        report : encodeAndTruncate(reportRequest),
                    });
                });
                console.log(err);
                done(err, null);
            });

            req.setHeader('Host', this._host);
            req.setHeader('User-Agent', 'Splunk-JavaScript-Node');
            req.setHeader('Authorization', 'Splunk ' + auth.getAccessToken());
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('Content-Length', payload.length);
            if (useGzip) {
                req.setHeader('Content-Encoding', 'gzip');
            }
            if (!detached) {
                req.setHeader('Connection', 'keep-alive');
            }
            req.write(payload);
            req.end();
        });
    }

    _throttleLog(f) {
        let now = Date.now();
        if (now - this._lastLogMs < kMaxDetailedErrorFrequencyMs) {
            return;
        }
        this._lastLogMs = now;
        f();
    }

    _warning(msg, payload) {
        this._logger.warn(msg, payload);
    }

    _error(msg, payload) {
        this._logger.error(msg, payload);
    }
}
