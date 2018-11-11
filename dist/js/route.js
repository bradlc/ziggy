var UrlBuilder = function UrlBuilder(name, absolute, ziggyObject) {
    this.name = name;
    this.ziggy = ziggyObject;
    this.route = this.ziggy.namedRoutes[this.name];
    if (typeof this.name === 'undefined') {
        throw new Error('Ziggy Error: You must provide a route name');
    } else if (typeof this.route === 'undefined') {
        throw new Error(("Ziggy Error: route '" + (this.name) + "' is not found in the route list"));
    }
    this.absolute = typeof absolute === 'undefined' ? true : absolute;
    this.domain = this.setDomain();
    this.path = this.route.uri.replace(/^\//, '');
};
UrlBuilder.prototype.setDomain = function setDomain () {
    if (!this.absolute) 
        { return '/'; }
    if (!this.route.domain) 
        { return this.ziggy.baseUrl.replace(/\/?$/, '/'); }
    var host = (this.route.domain || this.ziggy.baseDomain).replace(/\/+$/, '');
    if (this.ziggy.basePort && host.replace(/\/+$/, '') === this.ziggy.baseDomain.replace(/\/+$/, '')) 
        { host = this.ziggy.baseDomain + ':' + this.ziggy.basePort; }
    return this.ziggy.baseProtocol + '://' + host + '/';
};
UrlBuilder.prototype.construct = function construct () {
    return this.domain + this.path;
};

var extend = Object.assign || function (target, source) {
    for (var key in source) {
        target[key] = source[key];
    }
    return target;
};
var Router = /*@__PURE__*/(function (String) {
    function Router(name, params, absolute, customZiggy) {
        if ( customZiggy === void 0 ) customZiggy = null;

        String.call(this);
        this.name = name;
        this.absolute = absolute;
        this.ziggy = customZiggy ? customZiggy : Ziggy;
        this.template = this.name ? new UrlBuilder(name, absolute, this.ziggy).construct() : '', this.urlParams = this.normalizeParams(params);
        this.queryParams = this.normalizeParams(params);
    }

    if ( String ) Router.__proto__ = String;
    Router.prototype = Object.create( String && String.prototype );
    Router.prototype.constructor = Router;
    Router.prototype.normalizeParams = function normalizeParams (params) {
        if (typeof params === 'undefined') 
            { return {}; }
        params = typeof params !== 'object' ? [params] : params;
        if (params.hasOwnProperty('id') && this.template.indexOf('{id}') == -1) {
            params = [params.id];
        }
        this.numericParamIndices = Array.isArray(params);
        return extend({}, params);
    };
    Router.prototype.with = function with$1 (params) {
        this.urlParams = this.normalizeParams(params);
        return this;
    };
    Router.prototype.withQuery = function withQuery (params) {
        extend(this.queryParams, params);
        return this;
    };
    Router.prototype.hydrateUrl = function hydrateUrl () {
        var this$1 = this;

        var tags = this.urlParams, paramsArrayKey = 0, params = this.template.match(/{([^}]+)}/gi), needDefaultParams = false;
        if (params && params.length != Object.keys(tags).length) {
            needDefaultParams = true;
        }
        return this.template.replace(/{([^}]+)}/gi, function (tag, i) {
            var keyName = tag.replace(/\{|\}/gi, '').replace(/\?$/, ''), key = this$1.numericParamIndices ? paramsArrayKey : keyName, defaultParameter = this$1.ziggy.defaultParameters[keyName];
            if (defaultParameter && needDefaultParams) {
                if (this$1.numericParamIndices) {
                    tags = Object.keys(tags).map(function (x) { return tags[x]; });
                    tags.splice(key, 0, defaultParameter);
                } else {
                    tags[key] = defaultParameter;
                }
            }
            paramsArrayKey++;
            if (typeof tags[key] !== 'undefined') {
                delete this$1.queryParams[key];
                return tags[key].id || encodeURIComponent(tags[key]);
            }
            if (tag.indexOf('?') === -1) {
                throw new Error(("Ziggy Error: '" + keyName + "' key is required for route '" + (this$1.name) + "'"));
            } else {
                return '';
            }
        });
    };
    Router.prototype.matchUrl = function matchUrl () {
        var windowUrl = window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname;
        var searchTemplate = this.template.replace(/(\{[^\}]*\})/gi, '[^\/\?]+').split('://')[1];
        var urlWithTrailingSlash = windowUrl.replace(/\/?$/, '/');
        return new RegExp("^" + searchTemplate + "\/$").test(urlWithTrailingSlash);
    };
    Router.prototype.constructQuery = function constructQuery () {
        if (Object.keys(this.queryParams).length === 0) 
            { return ''; }
        var queryString = '?';
        Object.keys(this.queryParams).forEach((function (key, i) {
            if (this.queryParams[key] !== undefined && this.queryParams[key] !== null) {
                queryString = i === 0 ? queryString : queryString + '&';
                queryString += key + '=' + encodeURIComponent(this.queryParams[key]);
            }
        }).bind(this));
        return queryString;
    };
    Router.prototype.current = function current (name) {
        var this$1 = this;
        if ( name === void 0 ) name = null;

        var routeNames = Object.keys(this.ziggy.namedRoutes);
        var currentRoute = routeNames.filter(function (name) {
            if (this$1.ziggy.namedRoutes[name].methods.indexOf('GET') === -1) {
                return false;
            }
            return new Router(name, undefined, undefined, this$1.ziggy).matchUrl();
        })[0];
        return name ? name == currentRoute : currentRoute;
    };
    Router.prototype.parse = function parse () {
        this.return = this.hydrateUrl() + this.constructQuery();
    };
    Router.prototype.url = function url () {
        this.parse();
        return this.return;
    };
    Router.prototype.toString = function toString () {
        return this.url();
    };
    Router.prototype.valueOf = function valueOf () {
        return this.url();
    };

    return Router;
}(String));
function route(name, params, absolute, customZiggy) {
    return new Router(name, params, absolute, customZiggy);
}

module.exports = route;
