#解耦型websocket,支持ws协议，wss协议。支持keep alive保活，支持失败自动重连，实现websocket系统高可用
 
 * @author JuniorRay
 
 * @date 2019-6-22重构
 

 
 调用方法：
 ```javascript

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

```

