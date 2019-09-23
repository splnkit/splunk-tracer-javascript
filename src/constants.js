
export const LOG_INFO = 0;
export const LOG_WARN = 1;
export const LOG_ERROR = 2;
export const LOG_FATAL = 3;

export const LOG_LEVEL_TO_STRING = {
    LOG_INFO  : 'I',
    LOG_WARN  : 'W',
    LOG_ERROR : 'E',
    LOG_FATAL : 'F',
};
export const LOG_STRING_TO_LEVEL = {
    I : LOG_INFO,
    W : LOG_WARN,
    E : LOG_ERROR,
    F : LOG_FATAL,
};

// The report interval for empty reports used to sample the clock skew
export const CLOCK_STATE_REFRESH_INTERVAL_MS = 350;

export const SPLUNK_APP_URL_PREFIX = 'https://app.lightstep.com';

export const JOIN_ID_PREFIX = 'join:';

export const SPL_META_EVENT_KEY = 'splunk.meta_event';
export const SPL_META_PROPAGATION_KEY = 'splunk.propagation_format';
export const SPL_META_TRACE_KEY = 'splunk.trace_id';
export const SPL_META_SPAN_KEY = 'splunk.span_id';
export const SPL_META_TRACER_GUID_KEY = 'splunk.tracer_guid';
export const SPL_META_EXTRACT = 'splunk.extract_span';
export const SPL_META_INJECT = 'splunk.inject_span';
export const SPL_META_SP_START = 'splunk.span_start';
export const SPL_META_SP_FINISH = 'splunk.span_finish';
export const SPL_META_TRACER_CREATE = 'splunk.tracer_create';
