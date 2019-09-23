

export default class RuntimeImp {
    constructor(runtimeGUID, startMicros, componentName, attributes) {
        this._runtimeGUID = runtimeGUID;
        this._startMicros = startMicros;
        this._componentName = componentName;
        this._attributes = attributes;
    }

    toJSON() {
        // NOTE: for legacy reasons, the Thrift field is called "group_name"
        // but is semantically equivalent to the "component_name"
        return {
            guid         : this._runtimeGUID,
            start_micros : this._startMicros,
            group_name   : this._componentName,
            attrs        : this._attributes,
        };
    }
}
