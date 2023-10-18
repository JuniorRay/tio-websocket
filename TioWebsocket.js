/**
 * Description:
 * @author JuniorRay
 * @date 2019-6-22重构
 * @date 2020-8-05修改精简代码方便调用
 * 调用方法：

 var tioWebsocket=new TioWebsocket({
        ip:"218.17.207.5",
        port:"8602",
        paramStr :'type=MON:0&deviceId='+196,//传递的参数
        heartbeatTimeout:5000, // 心跳超时时间，单位：毫秒,
        reconnTime:5,//失败重连次数
        reconnInterval:3000, // 重连间隔时间，单位：毫秒,
        wsProtocol:'ws',// ws 或 wss协议,
        binaryType:'blob',// 'blob' or 'arraybuffer';//arraybuffer是字节,
        handler:new function(){//必须实例化调用
            this.onopen = function (event, ws) {
                //console.log("开启连接");
                ws.send({gbNum:1000,cameraIp:"192.168.1.1"});
            };
            this.onmessage = function (event, ws) {
                var data = JSON.parse(event.data);
                console.log("收到数据"+event.data);
                //你的处理逻辑
            };
            this.onclose = function (event, ws) {
                //console.log("连接关闭...=");
            };
            this.onerror = function (event, ws) {
                // error(event, ws)
            };
            // 发送心跳，本框架会自动定时调用该方法，请在该方法中发送心跳
            this.ping = function (ws) {
                //console.log("发心跳了")

            };
        },

    }).connect();//开始连接TioWebsocket!

 //tioWebsocket.close();//关闭websocket
 //tioWebsocket.reconnect();//重新连接TioWebsocket
 //tioWebsocket.send("你需要发送的数据");//发送数据
 //tioWebsocket.ping();//发送心跳

 **/
(function (root,factory) {
    if (typeof define === 'function' && define.amd) {
        /*AMD. Register as an anonymous module.
        *define([], factory); */
        define([], factory());
    } else if (typeof module === 'object' && module.exports) {
        /*Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.*/
        module.exports = factory();

    } else {
        /*Browser globals (root is window)*/
        root['TioWebsocket'] = factory();
    }
}(this, function () {
    "use strict";

    var TioWebsocket = function(obj) {
        // console.log("开始实例化TioWebsocket："+TioWebsocket);
        /**
         * @param {*} wsProtocol wss or ws标识
         * @param {*} ip
         * @param {*} port
         * @param {*} paramStr 加在ws url后面的请求参数，形如：name=张三&id=12
         * @param {*} Handler 作为webSocket执行处理器，
         * @param {*} heartbeatTimeout 心跳时间 单位：毫秒
         * @param {*} reconnInterval 失败后重连间隔时间 单位：毫秒
         * @param {*} binaryType 'blob' or 'arraybuffer';//arraybuffer是字节,'blob'二进制大对象
         */
        this.name = "Junior制作";
        this.ip = obj.ip;
        this.port = obj.port;
        this.wsProtocol = obj.wsProtocol||'ws'; // ws 或 wss
        this.url = this.wsProtocol + '://' + this.ip + ':' + this.port + "/ws/msg.ws";//请求后缀方便nginx代理
        this.paramStr = obj.paramStr;
        if (obj.paramStr) {//形如：name=张三&id=12
            this.url += '?' + obj.paramStr
            this.reconnUrl = this.url + "&"
        } else {
            this.reconnUrl = this.url + "?"
        }
        this.reconnUrl += "tiows_reconnect=true";
        this.handler = obj.handler;//执行处理引擎函数
        this.heartbeatTimeout = obj.heartbeatTimeout||5000;//5s
        this.reconnTime = obj.reconnTime||3;//websocket重连次数
        this.reconnInterval = obj.reconnInterval||3000;//3s
        this.binaryType = obj.binaryType||'arraybuffer';
        this.lastInteractionTime = function () {//上次交互时间
            if (arguments.length == 1) {
                this.lastInteractionTimeValue = arguments[0]
            }
            return this.lastInteractionTimeValue
        };

        this.heartbeatSendInterval = this.heartbeatTimeout / 2

        this.callBackWebsocket;//保存connect返回的websocket对象
        this.obj = obj;

        return this;

    };
    /** 基于原生websocket进行封装，创建websocket对象调用tioWebScoket的handler处理对应的onOpen，onMessage,onError
     * */
    TioWebsocket.prototype.connect=function(){//是否重新连接
        var tiows = this ;
        var _url = this.url;
        if (tiows >0) {
            _url = this.reconnUrl;
        }
        var ws=new WebSocket(_url);
        /**WebSocket的异常是异步的，你要用onerror方法获取异常
         * js中是不能catch住websocket的超时error的，这个是设计的限制。
         * **/

        this.callBackWebsocket = ws;
        // console.log( this.callBackWebsocket);

        ws.binaryType = this.binaryType; // 'arraybuffer'; // 'blob' or 'arraybuffer';//arraybuffer是字节,blob二进制大对象
        var selfTioWs = this;//TioWebsocket

        ws.onopen = function (event) {
            tiows.reconnTime = selfTioWs.obj.reconnTime;

            console.log("TioWebSocket开启");
            selfTioWs.handler.onopen.call(selfTioWs.handler, event, ws);//调用函数handler,selfTioWs.handler调用自己的onopen方法传入参数event，ws
            selfTioWs.lastInteractionTime(new Date().getTime());//lastInteractionTime

            selfTioWs.pingIntervalId = setInterval(function () {
                selfTioWs.ping(selfTioWs)
            }, selfTioWs.heartbeatSendInterval)
        };
        ws.onmessage = function (event) {
            selfTioWs.handler.onmessage.call(selfTioWs.handler, event, ws);//调用函数handler,selfTioWs.handler调用自己的onmessage方法传入参数event，ws
            selfTioWs.lastInteractionTime(new Date().getTime());//lastInteractionTime
        };
        ws.onclose = function (event) {
            console.log("TioWebSocket关闭:event",event);
            clearInterval(selfTioWs.pingIntervalId);// clear send heartbeat task

            var isClosed = false;

            try {
                selfTioWs.handler.onclose.call(selfTioWs.handler, event, ws);//调用函数handler,selfTioWs.handler调用自己的onclose方法传入参数event，ws
                // ws.close(event.code,event.reason);
                ws.close();
                isClosed = true;
            } catch (error) {
                console.error(error);
                isClosed = false;
            }

            if (tiows.reconnTime > 0 && isClosed) {//进行判断是否进行重新连接操作
                console.log("TioWebSocket重连次数还剩"+tiows.reconnTime+"次,耗尽将不再重连");
                selfTioWs.reconnect(event)
            }

        };
        ws.onerror = function (event) {
            console.error("TioWebSocket连接失败，请检查浏览器是否支持，以及ip,端口等配置是否正确:event:",event);
            selfTioWs.handler.onerror.call(selfTioWs.handler, event, ws);
            ws.close(event.code,event.reason);

            if (tiows.reconnTime > 0) {//进行判断是否进行重新连接操作
                console.log("TioWebSocket重连次数还剩"+tiows.reconnTime+"次,耗尽将不再重连");
                selfTioWs.reconnect(event)
            }
            return null;

        };

        return this;//返回TioWebsocket对象
    };

    /**重新连接TioWebsocket
     * @param {*}
     * */
    TioWebsocket.prototype.reconnect=function(event) {//重新连接
        var self = this;
        self.close();//重连前关闭上次的连接
        setTimeout(function () {
            console.log("开始重连TioWebSocket...");
            var tiows = self.connect(true);
            var ws = tiows.getWebsocket();
            self.callBackWebsocket = ws;
            self.reconnTime--;//重连次数减一
        }, self.reconnInterval);

        return this;
    };

    /**ping 发送心跳
     * */
    TioWebsocket.prototype.ping=function() {

        var iv = new Date().getTime() - this.lastInteractionTime(); // 已经多久没发消息了
        // 单位：秒
        if ((this.heartbeatSendInterval + iv) >= this.heartbeatTimeout) {
            this.handler.ping(this.callBackWebsocket);
            console.log("TioWebSocket,正在尝试发送心跳");
            this.callBackWebsocket.send('TioWebSocket,正在尝试发送心跳',function(err){
                if(err) {
                    console.error("发送心跳出现异常:" ,err);
                    return;
                }
                console.log("发送心跳成功:");
            });
        }

        return this;
    };

    /**send 发送数据
     * */
    TioWebsocket.prototype.send=function(data) {
        this.callBackWebsocket.send(data,function(err){
            if(err) {
                console.error("消息发送出现异常:" ,err);
                return;
            }
            console.log("消息发送成功:",data);
        });
        return this;
    };

    /**send 关闭TioWebsocket
     * */
    TioWebsocket.prototype.close=function() {
        console.log("TioWebsocket.close()");
        // debugger
        var ws=this.callBackWebsocket;
        if(ws){
            console.log("调用关闭函数");
            ws.close();//调用原生websocket的close关闭TCP连接
        }

        return this;
    };
    /**获取当前websocket原生对象,方便外部利用原生ws操作**/
    TioWebsocket.prototype.getWebsocket=function() {
        var ws=this.callBackWebsocket;
        return ws;
    };

    return TioWebsocket;
}));


