import _each from '../_each'; // eslint-disable-line camelcase
import * as coerce from './coerce.js';

export default class ReportImp {
    constructor(runtime, oldestMicros, youngestMicros, spanRecords, internalLogs, counters, timestampOffsetMicros) {
        this._runtime = runtime;
        this._oldestMicros = oldestMicros;
        this._youngestMicros = youngestMicros;
        this._spanRecords = spanRecords;
        this._internalLogs = internalLogs;
        this._counters = counters;
        this._timestampOffsetMicros = timestampOffsetMicros;
    }

    getSpanRecords() {
        return this._spanRecords;
    }

    getInternalLogs() {
        return this._internalLogs;
    }

    getCounters() {
        return this._counters;
    }

    toJSON(auth) {
        _each(this._spanRecords, (span) => {
            span.runtime_guid = this._runtimeGUID;
        });
        let jsonSpanRecords = [];
        _each(this._spanRecords, (spanRecord) => {
            jsonSpanRecords.push(JSON.stringify(spanRecord._toJSON()));
        });
        return jsonSpanRecords;
    }
}
