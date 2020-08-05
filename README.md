# TioWebSocket
解耦型TioWebsocket，重新封装原生websocket,解决原作者tiows.js,无法关闭websoket以及重复推图bug


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
 
 var handler = new Handler();//TioWebSocket处理引擎,请参考handler的函数注释
 
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
  
  var Handler= function () {
  
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
                   
            ws.close(event);
            
        }
        
         // 发送心跳，本框架会自动定时调用该方法，请在该方法中发送心跳
         
         this.ping = function (ws) {
         
            ws.send('心跳内容')
        }
    }
 **/
