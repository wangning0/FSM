/**
 * @author winger
 */
;(function(root) {
    var fsm = function(stateObjects, initialStateName) {

        const toString = Object.prototype.toString;

        if(typeof stateObjects === 'function') {
            stateObjects = stateObjects();
        }

        if(toString.call(stateObjects) !== '[object Object]') {
            throw new Error(`状态必须为对象`);
        }
        // 工具

        // 当前的状态
        let currentState;
        // 全局的消息
        const broadcast = [];
        // 状态的集合
        const stateStore = {
            getCurrentState: () => {
                return currentState.name;
            },
            setMachineState: (nextState) => {
                if(typeof nextState == 'string') {
                    nextState = stateStore[nextState];
                }
                if(!nextState || !nextState.name || !stateStore[nextState.name]) {
                    return new Error('不存在的状态');
                }
                currentState = nextState;
                return this;
            }
        }
        const stateMachine = {
            getCurrentState: stateStore.getCurrentState,
            bind: (callback) => {
                if(callback) {
                    broadcast.push(callback);
                }
                return this;
            },
            unbind: (callback) => {
                if(!callback) {
                    broadcast = [];
                } else {
                    broadcast = broadcast.filter(i => i == callback);
                }
                return this;
            }
        };

        const transition = function(stateName, eventName, nextEvent) {
            // 函数的返回值 应该判断是不是有了的状态，有就改变，没有的话就报错，ignore的话则为当前的状态
            // this 最后返回的应该还是要为整个的转态机
            return function() {
                let eventVal = stateMachine;
                let nextState;
                // 调用非当前状态的方法时会终止
                console.log(stateStore[stateName].name, currentState.name ,2112112);
                if(stateStore[stateName] !== currentState) {
                    if(nextEvent) {
                        eventVal = nextEvent.apply(stateStore, arguments);
                    }
                    return eventVal;
                }
                // 钩子函数 before after 触发
                // 改变下一个状态
                eventVal = stateStore[stateName][eventName].apply(stateStore, arguments);
                // 没有返回
                if(typeof eventVal == 'undefined') {
                    nextState = currentState;
                    eventVal = stateMachine;
                    // 返回的是字符串
                } else if(typeof eventVal == 'string') {
                    nextState = stateStore[eventVal];
                    eventVal = stateMachine;
                    // 返回的是一个状态 this.xxx
                } else if(toString.call(eventVal) === '[object Object]') {
                    nextState = (eventVal === stateStore ? stateStore : eventVal);
                    eventVal = stateMachine;
                } else if(toString.call(eventVal) === '[object Array]') {
                    nextState = eventVal.length ? eventVal[0] : currentState;
                    eventVal = stateMachine;
                }

                stateStore.setMachineState(nextState)
                return eventVal;
            }
        };
        for(let stateName in stateObjects) {
            if(stateObjects.hasOwnProperty(stateName)) {
                stateStore[stateName] = stateObjects[stateName];
                for(let eventName in stateStore[stateName]) {
                    if(stateStore[stateName].hasOwnProperty(eventName)) {
                        // stateMachine[eventName] = stateStore[stateName][eventName];
                        // eventName 可以为两种类型， 一个是string，直接返回下个状态
                        // 另外一个是function 可以根据function 来返回／不返回下一个状态
                        if(typeof stateStore[stateName][eventName] === 'string') {
                             stateStore[stateName][eventName] = ((stateName) => {
                                 return function event() {
                                     return this[stateName];
                                 } 
                             })(stateStore[stateName][eventName])
                        }
                        if(typeof stateStore[stateName][eventName] === 'function') {
                            stateMachine[eventName] = transition(stateName, eventName, stateMachine[eventName]);
                        }
                    }
                }
                stateStore[stateName].name = stateName;
                if(!currentState) {
                    currentState = stateStore[stateName];
                }
            }
        }
        if(stateStore[initialStateName]) {
            currentState = stateStore[initialStateName];
        }

        if(!currentState) {
            throw new Error(`初始化state失败`);
        }
        return stateMachine;
    }

    fsm.machine = (stateObjects, initialStateName) => new fsm(stateObjects, initialStateName);

    if(typeof define === 'function' && define.amd) {
        define(fsm);
    } else if(typeof module !== 'undefined' && module.exports) {
        module.exports = fsm;
    } else {
        root.fsm = fsm;
    }
})(this);