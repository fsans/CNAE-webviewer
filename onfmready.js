(() => {
    const $wnd = window;
    let iexplore;
    if (!!window.document.documentMode) {
        if (typeof Object.assign != 'function') {
            Object.defineProperty(Object, 'assign', {
                value: function assign(target, varArgs) {
                    if (target == null) {
                        throw new TypeError('Cannot convert undefined or null to object');
                    }
                    var to = Object(target);
                    for (var index = 1; index < arguments.length; index++) {
                        var nextSource = arguments[index];
                        if (nextSource != null) {
                            for (var nextKey in nextSource) {
                                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                                    to[nextKey] = nextSource[nextKey];
                                }
                            }
                        }
                    }
                    return to;
                },
                writable: true,
                configurable: true
            });
        }
        if (typeof window.CustomEvent != 'function') {
            function CustomEvent(event, params) {
                params = params || {
                    bubbles: false,
                    cancelable: false,
                    detail: undefined
                };
                var evt = document.createEvent('Event');
                evt.initEvent(event, params.bubbles, params.cancelable);
                Object.defineProperty(evt, 'detail', { value: params.detail });
                return evt;
            }
            CustomEvent.prototype = window.Event.prototype;
            window.CustomEvent = CustomEvent;
            window.Event = CustomEvent;
        }
        const FM_CONTEXT_TEST = 'if (window.FileMaker != null)';
        iexplore = {
            resolver: () => {
                try {
                    const caller = iexplore.resolver.caller.caller.toString();
                    iexplore.stash = caller.indexOf(FM_CONTEXT_TEST) >= 0;
                }
                catch (ex) {
                    iexplore.stash = false;
                }
            },
            stash: false
        };
    }
    let deferred = [];
    let unfulfilled;
    const events = () => {
        if (!unfulfilled) {
            const ready = new Event('filemaker-ready');
            $wnd.dispatchEvent(ready);
            document.dispatchEvent(ready);
        }
        const expected = Object.assign(new Event('filemaker-expected'), {
            filemaker: !unfulfilled,
            FileMaker: !unfulfilled
        });
        $wnd.dispatchEvent(expected);
        document.dispatchEvent(expected);
    };
    if (typeof $wnd.FileMaker === 'object') {
        setTimeout(events);
        return;
    }
    $wnd.OnFMReady = Object.assign({ respondTo: {}, noLogging: false, unmount: false }, $wnd.OnFMReady);
    const DEFAULT = {
        PerformScript: (script, param) => DEFAULT.PerformScriptWithOption(script, param),
        PerformScriptWithOption: (script, param, option = 0) => {
            if (unfulfilled) {
                utility(script, param, option);
            }
            else {
                deferred.push([script, param, option]);
            }
        }
    };
    const utility = (script, param, option) => {
        const responder = $wnd.OnFMReady.respondTo[script];
        return responder
            ? responder(param, option)
            : $wnd.OnFMReady.noLogging
                ? null
                : console.log(Object.assign({ script, param }, !!option ? { option } : {}));
    };
    let STORE = DEFAULT;
    let fallback;
    let awaitingSet;
    document.addEventListener('DOMContentLoaded', () => {
        if (!iexplore || (!!iexplore && !iexplore.stash)) {
            STORE = null;
            awaitingSet = true;
        }
        setTimeout(() => {
            setTimeout(() => {
                $wnd.FileMaker;
            });
        });
    });
    Object.defineProperty(window, 'FileMaker', {
        set(value) {
            STORE = value;
            awaitingSet = false;
            clearTimeout(fallback);
            if (value == undefined)
                return;
            setTimeout(() => {
                const str = STORE;
                const dispatcher = str?.PerformScriptWithOption || str.PerformScript;
                deferred.forEach((d) => {
                    dispatcher(...d);
                });
                deferred = [];
                events();
            });
        },
        get() {
            if (iexplore && !iexplore.stash && !awaitingSet) {
                iexplore.resolver();
                if (iexplore.stash)
                    return null;
            }
            if (awaitingSet) {
                iexplore = undefined;
                fallback = setTimeout(() => {
                    unfulfilled = true;
                    $wnd.FileMaker = $wnd.OnFMReady.unmount ? undefined : DEFAULT;
                });
            }
            return STORE;
        }
    });
})();