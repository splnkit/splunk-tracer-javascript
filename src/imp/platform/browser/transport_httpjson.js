
export default class TransportBrowser {

    constructor() {
        this._host = '';
        this._port = 0;
        this._encryption = '';
        this._access_token = '';
    }

    ensureConnection(opts) {
        this._host = opts.collector_host;
        this._port = opts.collector_port;
        this._encryption = opts.collector_encryption;
        this._access_token = opts.access_token;

    }

    report(detached, auth, report, done) {
        try {
            if (!detached) {
                this._reportAJAX(auth, report, done);
            }
        } catch (e) {
            return done(e, null);
        }
    }

    _reportAJAX(auth, report, done) {
        let reportJSON = report.toJSON(auth);
        let protocol = (this._encryption === 'none') ? 'http' : 'https';
        let url = `${protocol}://${this._host}:${this._port}/services/collector`;
        let xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open('POST', url);
        // Note: the browser automatically sets 'Connection' and 'Content-Length'
        // and *does not* allow they to be set manually
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Authorization', 'Splunk '+ this._access_token);
        xhr.onreadystatechange = function () {
            if (this.readyState === 4) {
                let err = null;
                let resp = null;
                if (this.status !== 200) {
                    err = new Error(`status code = ${this.status}`);
                } else if (!this.response) {
                    err = new Error('unexpected empty response');
                } else {
                    try {
                        resp = this.response;
                    } catch (exception) {
                        err = exception;
                    }
                }
                return done(err, resp);
            }
        };
        let serialized = reportJSON.join('\n');
        xhr.send(serialized);
    }
}
