
export default class AuthImp {
    constructor(accessToken) {
        this._accessToken = accessToken;
    }

    getAccessToken() {
        if (typeof this._accessToken === 'undefined' || this._accessToken === null || this._accessToken.length === 0) {
            return 'empty';
        }

        return this._accessToken;
    }
}
