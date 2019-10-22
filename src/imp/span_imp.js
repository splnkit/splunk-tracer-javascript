import * as coerce from './coerce.js';
import * as constants from '../constants';
import _each from '../_each';
import * as opentracing from 'opentracing';
import { crouton_thrift } from '../platform_abstraction_layer'; // eslint-disable-line camelcase
import LogRecordImp from './log_record_imp'; // eslint-disable-line camelcase
import util from './util/util.js';
let converter = require('hex2dec');

export default class SpanImp extends opentracing.Span {

    // ---------------------------------------------------------------------- //
    // opentracing.Span SPI
    // ---------------------------------------------------------------------- //

    _tracer() {
        return this._tracerImp;
    }

    _context() {
        return this._ctx;
    }

    _setOperationName(name) {
        this._operationName = `${name}`;
    }

    _addTags(keyValuePairs) {
        let self = this;
        _each(keyValuePairs, (value, key) => {
            self._tags[key] = value;
        });
    }

    _log(keyValuePairs, timestamp) {
        let self = this;
        const argumentType = typeof keyValuePairs;
        if (argumentType !== 'object') {
            self._tracerImp._error('Span.log() expects an object as its first argument');
            return;
        }

        let tsMicros = timestamp ?
            (timestamp * 1000) :
            self._tracerImp._platform.nowMicros();

        let record = new LogRecordImp(
            self._tracerImp.getLogFieldKeyHardLimit(),
            self._tracerImp.getLogFieldValueHardLimit(),
            tsMicros,
            keyValuePairs);
        self._log_records = self._log_records || [];
        self._log_records.push(record);
        self._tracerImp.emit('log_added', record);
    }

    _finish(finishTime) {
        return this.end(finishTime);
    }

    // ---------------------------------------------------------------------- //
    // Private methods
    // ---------------------------------------------------------------------- //

    constructor(tracer, name, spanContext) {
        super();

        console.assert(typeof tracer === 'object', 'Invalid runtime');  // eslint-disable-line no-console

        this._tracerImp = tracer;
        this._ctx = spanContext;
        this._ended  = false;

        this._operationName = name;
        this._tags          = {};
        this._beginMicros   = tracer._platform.nowMicros();
        this._endMicros     = 0;
        this._errorFlag     = false;
        this._log_records   = null;
    }

    // ---------------------------------------------------------------------- //
    // Splunk Extensions
    // ---------------------------------------------------------------------- //

    getOperationName() {
        return this._operationName;
    }

    // Getter only. The GUID is immutable once set internally.
    guid() {
        return this._ctx._guid;
    }

    traceGUID() {
        return this._ctx._traceGUID;
    }

    parentGUID() {
        return this._tags.parent_span_guid;
    }

    setParentGUID(guid) {
        this._tags.parent_span_guid = coerce.toString(guid);
        return this;
    }

    beginMicros() {
        return this._beginMicros;
    }

    setBeginMicros(micros) {
        this._beginMicros = micros;
        return this;
    }

    endMicros() {
        return this._endMicros;
    }

    setEndMicros(micros) {
        this._endMicros = micros;
        return this;
    }

    /**
     * Returns a URL to the trace containing this span.
     *
     * Unlike most methods, it *is* safe to call this method after `finish()`.
     *
     * @return {string} the absolute URL for the span
     */
    generateTraceURL() {
        let micros;
        if (this._beginMicros > 0 && this._endMicros > 0) {
            micros = Math.floor((this._beginMicros + this._endMicros) / 2);
        } else {
            micros = this._tracerImp._platform.nowMicros();
        }

        let urlPrefix = constants.SPLUNK_APP_URL_PREFIX;
        let accessToken = encodeURIComponent(this._tracerImp.options().access_token);
        let guid = encodeURIComponent(this.guid());
        return `${urlPrefix}/${accessToken}/trace?span_guid=${guid}&at_micros=${micros}`;
    }

    getTags() {
        return this._tags;
    }

    /**
     * Finishes the span.
     *
     * @param  {Number} finishTime
     *         	Optional Unix timestamp in milliseconds setting an explicit
     *         	finish time for the span.
     */
    end(finishTime) {
        // Ensure a single span is not recorded multiple times
        if (this._ended) {
            return;
        }
        this._ended = true;

        if (finishTime !== undefined) {
            this.setEndMicros(Math.floor(finishTime * 1000));
        }

        // Do not set endMicros if it has already been set. This accounts for
        // the case of a span that has had it's times set manually (i.e. allows
        // for retroactively created spans that might not be possible to create
        // in real-time).
        if (this._endMicros === 0) {
            this.setEndMicros(this._tracerImp._platform.nowMicros());
        }

        if (util.shouldSendMetaSpan(this._tracer().options(), this.getTags())) {
            this._tracerImp.startSpan(constants.SPL_META_SP_FINISH, {
                tags : {
                    [constants.SPL_META_EVENT_KEY] : true,
                    [constants.SPL_META_TRACE_KEY] : this.traceGUID(),
                    [constants.SPL_META_SPAN_KEY]  : this.guid(),
                },
            }).finish();
        }

        // console.log(this._log_records);
        this._tracerImp._addSpanRecord(this);
    }

    _toJSON() {
        var obj_array = [];
        var json_span = { event: {
            span_id         : this.guid(),
            trace_id        : this.traceGUID(),
            parent_span_id  : this.parentGUID(),
            runtime_guid    : this._tracerImp.guid(),
            baggage         : this._ctx.baggage,
            component_name  : this._tracerImp._options.component_name,
            operation_name  : this._operationName,
            duration        : this._endMicros - this._beginMicros,
            timestamp       : this._beginMicros / 1000000,
            tags            : this._tags,
            error_flag      : this._errorFlag,
        },
        sourcetype: 'splunktracing:span',
        time: this._beginMicros / 1000000
        };
        _each(this._tracerImp._runtime._attributes, (value, key) => {
            json_span.event[key] = value;
        });
        delete json_span.event.tags.parent_span_guid;
        obj_array.push(JSON.stringify(json_span));
        _each(this._log_records, (value, key) => {
            var json_log = { event: {
                fields: value._fields,
                timestamp: value._timestampMicros / 1000000
            },
               sourcetype: 'splunktracing:log',
               time: value._timestampMicros / 1000000
            };
            _each(json_span.event, (value1, key1) => {
                if (key1!='timestamp' && key1 != "duration") {
                    json_log.event[key1] = value1;
                }
            });
            try {
                obj_array.push(JSON.stringify(json_log));
            } catch (err) {
                this._tracerImp._error('Span.log() contains circular data structure');
            }
        });
        // console.log(obj_array);
        return obj_array.join('\n');
    }
}
