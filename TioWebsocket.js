/**
 * Description:
 * @author JuniorRay
 * @date 2019-6-22重构
 * 调用方法：
 var  wsPort= "#(wsPort??)";
 var  wsHost= "#(wsHost??)";
 var ws_protocol = 'ws'; // ws 或 wss
 var heartbeatTimeout = 5000; // 心跳超时时间，单位：毫秒
 var reconnInterval = 1000; // 重连间隔时间，单位：毫秒
 var binaryType = 'blob'; // 'blob' or 'arraybuffer';//arraybuffer是字节
 var handler = new DemoHandler_rtsp();//TioWebSocket处理引擎,请参考handler的函数注释
 var paramString = 'deviceId='+ivaeId+'&page=monitorRtsp.html';//传递的参数
 var tiows;
 initWs();
 function initWs () {
       try{
            tiows.close();//先关闭上一次的websocket再连接
            console.log("TIO---close")
        }catch(e){

        }
        tiows=new TioWebsocket({
             ws_protocol:ws_protocol,
                ip:wsHost,
                port:wsPort,
                heartbeatTimeout:heartbeatTimeout,
                reconnInterval:reconnInterval,
                binaryType:binaryType,
                handler:handler,
                paramStr:paramString
         });
         tiows.connect(isReconnect=false);//开始连接，其中isReconnect=false关闭自动重连
         console.log("TIO---new")
  }
 **/

var TioWebsocket = function(obj) {
    // console.log("开始实例化TioWebsocket："+TioWebsocket);
    /**
     * @param {*} ws_protocol wss or ws标识
     * @param {*} ip
     * @param {*} port
     * @param {*} paramStr 加在ws url后面的请求参数，形如：name=张三&id=12
     * @param {*} handler 作为webSocket执行处理器，
     * var handler= function () {
        this.onopen = function (event, ws) {
            ws.send({gbNum:gbNum,cameraIp:cameraIp});
        }
        this.onmessage = function (event, ws) {
            var data = $.parseJSON(event.data);
            console.log("收到数据"+event.data);
          //你的处理逻辑
        }
        this.onclose = function (event, ws) {
            console.log("连接关闭...ivaeId="+ivaeId);
            ws.close(event);
        }
        this.onerror = function (event, ws) {
            // error(event, ws)
            layer.close(loadProgress);//清除进度条
            ws.close(event);
        }
         // 发送心跳，本框架会自动定时调用该方法，请在该方法中发送心跳
         this.ping = function (ws) {
            // log("发心跳了")
            ws.send('心跳内容')
        }
    }
     * @param {*} heartbeatTimeout 心跳时间 单位：毫秒
     * @param {*} reconnInterval 失败后重连间隔时间 单位：毫秒
     * @param {*} binaryType 'blob' or 'arraybuffer';//arraybuffer是字节,'blob'二进制大对象
     */
    this.name = "Junior制作";
    this.ip=obj.ip;
    this.port=obj.port;
    this.ws_protocol = obj.ws_protocol||'ws'; // ws 或 wss
    this.url=this.ws_protocol + '://' + this.ip + ':' + this.port + "/ws/msg.ws";
    this.paramStr=obj.paramStr;
    if (obj.paramStr) {//形如：name=张三&id=12
        this.url += '?' + obj.paramStr
        this.reconnUrl = this.url + "&"
    } else {
        this.reconnUrl = this.url + "?"
    }
    this.reconnUrl += "tiows_reconnect=true";
    this.handler=obj.handler;//执行处理引擎函数
    this.heartbeatTimeout=obj.heartbeatTimeout||5000;//5s

    this.reconnInterval=obj.reconnInterval||1000;//1s
    this.binaryType=obj.binaryType||'arraybuffer';
    this.lastInteractionTime = function () {//上次交互时间
        if (arguments.length == 1) {
            this.lastInteractionTimeValue = arguments[0]
        }
        return this.lastInteractionTimeValue
    }

    this.heartbeatSendInterval = this.heartbeatTimeout / 2

    this.callBackWebsocket;//保存connect返回的websocket对象

    return this;

};
/** 基于原生websocket进行封装，创建websocket对象调用tioWebScoket的handler处理对应的onOpen，onMessage,onError
 * @param {*} isReconnect 是否重新连接
 * */
TioWebsocket.prototype.connect=function(isReconnect){//是否重新连接
    var _url = this.url;
    if (isReconnect) {
        _url = this.reconnUrl;
    }

    var ws=new WebSocket(_url);
    /**WebSocket的异常是异步的，你要用onerror方法获取异常
     * js中是不能catch住websocket的超时error的，这个是设计的限制。
     * **/
    // try{
    //     ws=new WebSocket(_url);
    // }catch (e) {
    //     console.error("websocket连接失败，请检查浏览器是否支持，以及ip,端口等配置是否正确"+"\n"+e);
    //     isReconnect=false;//关闭自动重连
    //     return null;
    // }
    this.callBackWebsocket = ws;
    // console.log( this.callBackWebsocket);

    ws.binaryType = this.binaryType; // 'arraybuffer'; // 'blob' or 'arraybuffer';//arraybuffer是字节,blob二进制大对象
    var selfTioWs = this;//TioWebsocket

    ws.onopen = function (event) {
        selfTioWs.handler.onopen.call(selfTioWs.handler, event, ws);//调用函数handler,selfTioWs.handler调用自己的onopen方法传入参数event，ws
        selfTioWs.lastInteractionTime(new Date().getTime());//lastInteractionTime

        selfTioWs.pingIntervalId = setInterval(function () {
            selfTioWs.ping(selfTioWs)
        }, selfTioWs.heartbeatSendInterval)
    };
    ws.onmessage = function (event) {
        selfTioWs.handler.onmessage.call(selfTioWs.handler, event, ws);//调用函数handler,selfTioWs.handler调用自己的onmessage方法传入参数event，ws

        selfTioWs.lastInteractionTime(new Date().getTime());//lastInteractionTime
    }
    ws.onclose = function (event) {
        clearInterval(selfTioWs.pingIntervalId) // clear send heartbeat task

        try {
            selfTioWs.handler.onclose.call(selfTioWs.handler, event, ws);//调用函数handler,selfTioWs.handler调用自己的onclose方法传入参数event，ws
        } catch (error) {
        }

        if (isReconnect) {//通过标志flag进行判断是否进行重新连接操作
            selfTioWs.reconnect(event)
        }

    }
    ws.onerror = function (event) {

        selfTioWs.handler.onerror.call(selfTioWs.handler, event, ws);
        isReconnect=false;//关闭自动重连
        console.error("websocket连接失败，请检查浏览器是否支持，以及ip,端口等配置是否正确");
        return null;

    };

    return ws;//返回原生websocket对象
};

/**重新连接TioWebsocket
 * @param {*} Reconnect 是否重新连接
 * */
TioWebsocket.prototype.reconnect=function(event) {//重新连接

    var self = this;
    setTimeout(function () {
        var ws = self.connect(true);
        self.callBackWebsocket = ws;
    }, self.reconnInterval)
};

/**ping 发送心跳
 * */
TioWebsocket.prototype.ping=function() {

    var iv = new Date().getTime() - this.lastInteractionTime(); // 已经多久没发消息了
    // 单位：秒
    if ((this.heartbeatSendInterval + iv) >= this.heartbeatTimeout) {
        this.handler.ping(this.callBackWebsocket)
    }
};

/**send 发送数据
 * */
TioWebsocket.prototype.send=function() {
    this.callBackWebsocket.send(data);
};

/**send 关闭TioWebsocket
 * */
TioWebsocket.prototype.close=function() {
    // debugger
    var ws=this.callBackWebsocket;
    if(ws){
        console.log("调用关闭函数");
        this.callBackWebsocket.close();//调用原生websocket的close关闭TCP连接
    }
};









