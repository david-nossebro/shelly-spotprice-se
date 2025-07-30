/**
* shelly-spotprice-se
* 
* https://github.com/david-nossebro/shelly-spotprice-se
*
* Special thanks to Jussi isotalo who created the original repo
* available here:
* https://github.com/jisotalo/shelly-porssisahko
* https://github.com/jisotalo/shelly-porssisahko-en
* 
* @license GNU Affero General Public License v3.0 
*/
const CNST={INST_COUNT:"undefined"==typeof INSTANCE_COUNT?3:INSTANCE_COUNT,HIST_LEN:"undefined"==typeof HIST_LEN?24:HIST_LEN,ERR_LIMIT:3,ERR_DELAY:120,DEF_INST_ST:{chkTs:0,st:0,str:"",cmd:-1,configOK:0,fCmdTs:0,fCmd:0},DEF_CFG:{COM:{g:"SE3",vat:25,day:0,night:0,names:[]},INST:{en:0,mode:0,m0:{c:0},m1:{l:0},m2:{p:24,c:0,l:-999,s:0,m:999,ps:0,pe:23,ps2:0,pe2:23,c2:0},b:0,e:0,o:[0],f:0,fc:0,i:0,m:60,oc:0}}};let _={s:{v:"3.2.0",dn:"",configOK:0,timeOK:0,errCnt:0,errTs:0,upTs:0,tz:"+02:00",tzh:0,enCnt:0,p:[{ts:0,now:0,low:0,high:0,avg:0},{ts:0,now:0,low:0,high:0,avg:0}]},si:[CNST.DEF_INST_ST],p:[[],[]],h:[],c:{c:CNST.DEF_CFG.COM,i:[CNST.DEF_CFG.INST]}},_i=0,_j=0,_k=0,_inc=0,_cnt=0,_start=0,_end=0,cmd=[],prevEpoch=0,loopRunning=!1;function getKvsKey(e){let t="sptprc-se";return t=0<=e?t+"-"+(e+1):t}function isCurrentHour(e,t){t-=e;return 0<=t&&t<3600}function limit(e,t,s){return Math.min(s,Math.max(e,t))}function epoch(e){return Math.floor((e?e.getTime():Date.now())/1e3)}function getDate(e){return e.getDate()}function updateTz(e){let t=e.toString(),s=0;"+0000"==(t=t.substring(3+t.indexOf("GMT")))?(t="Z",s=0):(s=+t.substring(0,3),t=t.substring(0,3)+":"+t.substring(3)),t!=_.s.tz&&(_.s.p[0].ts=0),_.s.tz=t,_.s.tzh=s}function log(e){console.log("shelly-spotprice-se: "+e)}function reqLogic(){for(let e=0;e<CNST.INST_COUNT;e++)_.si[e].chkTs=0}function updateState(){var e=new Date,t=(_.s.timeOK=null!=Shelly.getComponentStatus("sys").unixtime&&2e3<e.getFullYear(),_.s.dn=Shelly.getComponentConfig("sys").device.name,epoch(e));for(_.s.timeOK&&300<Math.abs(t-prevEpoch)&&(log("Time changed 5 min+ -> refresh"),_.s.p[0].ts=0,_.s.p[0].now=0,_.s.p[1].ts=0,_.p[0]=[],_.p[1]=[]),prevEpoch=t,_.s.enCnt=0,_i=0;_i<CNST.INST_COUNT;_i++)_.c.i[_i].en&&_.s.enCnt++;!_.s.upTs&&_.s.timeOK&&(_.s.upTs=epoch(e))}function getConfig(p){var e=getKvsKey(p);Shelly.call("KVS.Get",{key:e},function(t,e,s){p<0?_.c.c=t?JSON.parse(t.value):{}:_.c.i[p]=t?JSON.parse(t.value):{},"function"==typeof USER_CONFIG&&USER_CONFIG(p,!0);{t=p;var n=function(e){p<0?_.s.configOK=e?1:0:(log("config for #"+(p+1)+" read, enabled: "+_.c.i[p].en),_.si[p].configOK=e?1:0,_.si[p].chkTs=0),loopRunning=!1,Timer.set(500,!1,loop)};let e=0;if(CNST.DEF_CFG.COM||CNST.DEF_CFG.INST){var i,o=t<0?CNST.DEF_CFG.COM:CNST.DEF_CFG.INST,r=t<0?_.c.c:_.c.i[t];for(i in o)if(void 0===r[i])r[i]=o[i],e++;else if("object"==typeof o[i])for(var c in o[i])void 0===r[i][c]&&(r[i][c]=o[i][c],e++);t>=CNST.INST_COUNT-1&&(CNST.DEF_CFG.COM=null,CNST.DEF_CFG.INST=null),0<e?(t=getKvsKey(t),Shelly.call("KVS.Set",{key:t,value:JSON.stringify(r)},function(e,t,s,n){t&&log("failed to set config: "+t+" - "+s),n(0==t)},n)):n(!0)}else n(!0)}})}function loop(){try{if(!loopRunning)if(loopRunning=!0,updateState(),_.s.configOK)if(pricesNeeded(0))getPrices(0);else if(pricesNeeded(1))getPrices(1);else{for(let e=0;e<CNST.INST_COUNT;e++)if(!_.si[e].configOK)return void getConfig(e);for(let e=0;e<CNST.INST_COUNT;e++)if(function(e){var t=_.si[e],s=_.c.i[e];if(1!=s.en)return void(_.h[e]=[]);var e=new Date,n=new Date(1e3*t.chkTs);return 0==t.chkTs||n.getHours()!=e.getHours()||n.getFullYear()!=e.getFullYear()||0<t.fCmdTs&&t.fCmdTs-epoch(e)<0||0==t.fCmdTs&&s.m<60&&e.getMinutes()>=s.m&&t.cmd+s.i==1}(e))return void Timer.set(500,!1,logic,e);"function"==typeof USER_LOOP?USER_LOOP():loopRunning=!1}else getConfig(-1)}catch(e){log("error at main loop:"+e),loopRunning=!1}}function pricesNeeded(e){var t=new Date;let s=!1;return s=1==e?_.s.timeOK&&0===_.s.p[1].ts&&14<=t.getHours():((e=getDate(new Date(1e3*_.s.p[0].ts))!==getDate(t))&&(_.s.p[1].ts=0,_.p[1]=[]),_.s.timeOK&&(0==_.s.p[0].ts||e)),_.s.errCnt>=CNST.ERR_LIMIT&&epoch(t)-_.s.errTs<CNST.ERR_DELAY?s=!1:_.s.errCnt>=CNST.ERR_LIMIT&&(_.s.errCnt=0),s}function getPrices(m){log("Fetching prices for "+_.c.c.g);try{log("fetching prices for day "+m);let g=new Date,e=(updateTz(g),g);var t=1+(e=1===m?new Date(g.getFullYear(),g.getMonth(),1+g.getDate()):e).getMonth(),n=(t<10?"0":"")+t,i=(e.getDate()<10?"0":"")+e.getDate();let s={url:"https://www.elprisetjustnu.se/api/v1/prices/"+e.getFullYear()+"/"+n+"-"+i+"_"+_.c.c.g+".json",timeout:5,ssl_ca:"*"};log("Request url: "+s.url),e=null,Shelly.call("HTTP.GET",s,function(e,t,n){s=null;try{if(0!==t||null==e||200!==e.code||!e.body)throw Error(t+"("+n+") - "+JSON.stringify(e));{e.headers=null,n=e.message=null,_.p[m]=[],_.s.p[m].avg=0,_.s.p[m].high=-999,_.s.p[m].low=999;var i=JSON.parse(e.body);e.body=null;let s=0;for(let t=0;t<i.length;t++){var o=i[t];let e=o.SEK_per_kWh;var r,c=new Date(o.time_start.slice(0,-5)),p=c.getHours(),l=Math.floor(c.getTime()/1e3);0<e&&(r=(100+_.c.c.vat)/100,e*=r),e+=7<=p&&p<22?_.c.c.day:_.c.c.night,_.p[m].push([l,e]),_.s.p[m].high<e&&(_.s.p[m].high=e),_.s.p[m].low>e&&(_.s.p[m].low=e),s+=e}if(e=null,_.s.p[m].avg=0<i.length?s/i.length:0,_.s.p[m].ts=epoch(g),_.p[m].length<23)throw Error("invalid data received")}}catch(t){log("error getting prices: "+t),_.s.errCnt+=1,_.s.errTs=epoch(),_.s.p[m].ts=0,_.p[m]=[]}0==m&&reqLogic(),loopRunning=!1,Timer.set(500,!1,loop)})}catch(e){log("error getting prices: "+e),_.s.errCnt+=1,_.s.errTs=epoch(),_.s.p[m].ts=0,_.p[m]=[],0==m&&reqLogic(),loopRunning=!1,Timer.set(500,!1,loop)}}function logic(c){try{"function"==typeof USER_CONFIG&&USER_CONFIG(c,!1),cmd[c]=!1;var e,t,s=new Date;updateTz(s),!function(){if(_.s.timeOK&&0!=_.s.p[0].ts){var t=epoch();for(let e=0;e<_.p[0].length;e++)if(isCurrentHour(_.p[0][e][0],t))return _.s.p[0].now=_.p[0][e][1];_.s.timeOK=!1,_.s.p[0].ts=0,_.s.errCnt+=1,_.s.errTs=epoch()}else _.s.p[0].ts,_.s.p[0].now=0}();let o=_.si[c],r=_.c.i[c];function n(e){if(null==e)loopRunning=!1;else if(cmd[c]!=e&&(o.st=12),cmd[c]=e,r.i&&(cmd[c]=!cmd[c]),log("logic for #"+(c+1)+" done, cmd: "+e+" -> output: "+cmd[c]),1==r.oc&&o.cmd==cmd[c])log("outputs already set for #"+(c+1)),o.cmd=cmd[c]?1:0,o.chkTs=epoch(),loopRunning=!1;else{let n=0,i=0;for(let e=0;e<r.o.length;e++)!function(e,i,o){e="{id:"+i+",on:"+(cmd[e]?"true":"false")+"}",Shelly.call("Switch.Set",e,function(e,t,s,n){0!=t&&log("setting output "+i+" failed: "+t+" - "+s),o(0==t)},o)}(c,r.o[e],function(e){if(n++,e&&i++,n==r.o.length){if(i==n){if(o.cmd!=cmd[c]){for(var t=c,s=0<_.s.enCnt?CNST.HIST_LEN/_.s.enCnt:CNST.HIST_LEN;0<CNST.HIST_LEN&&_.h[t].length>=s;)_.h[t].splice(0,1);_.h[t].push([epoch(),cmd[t]?1:0,_.si[t].st])}o.cmd=cmd[c]?1:0,o.chkTs=epoch(),Timer.set(500,!1,loop)}loopRunning=!1}})}}0===r.mode?(cmd[c]=1===r.m0.c,o.st=1):_.s.timeOK&&0<_.s.p[0].ts&&getDate(new Date(1e3*_.s.p[0].ts))===getDate(s)?1===r.mode?(cmd[c]=_.s.p[0].now<=("avg"==r.m1.l?_.s.p[0].avg:r.m1.l),o.st=cmd[c]?2:3):2===r.mode&&(cmd[c]=function(e){var t=_.c.i[e],s=(t.m2.ps=limit(0,t.m2.ps,23),t.m2.pe=limit(t.m2.ps,t.m2.pe,24),t.m2.ps2=limit(0,t.m2.ps2,23),t.m2.pe2=limit(t.m2.ps2,t.m2.pe2,24),t.m2.c=limit(0,t.m2.c,0<t.m2.p?t.m2.p:t.m2.pe-t.m2.ps),t.m2.c2=limit(0,t.m2.c2,t.m2.pe2-t.m2.ps2),[]);for(_inc=t.m2.p<0?1:t.m2.p,_i=0;_i<_.p[0].length;_i+=_inc)if(!((_cnt=-2==t.m2.p&&1<=_i?t.m2.c2:t.m2.c)<=0)){var n=[];for(_start=_i,_end=_i+t.m2.p,t.m2.p<0&&0==_i?(_start=t.m2.ps,_end=t.m2.pe):-2==t.m2.p&&1==_i&&(_start=t.m2.ps2,_end=t.m2.pe2),_j=_start;_j<_end&&!(_j>_.p[0].length-1);_j++)n.push(_j);if(t.m2.s){for(_avg=999,_startIndex=0,_j=0;_j<=n.length-_cnt;_j++){for(_sum=0,_k=_j;_k<_j+_cnt;_k++)_sum+=_.p[0][n[_k]][1];_sum/_cnt<_avg&&(_avg=_sum/_cnt,_startIndex=_j)}for(_j=_startIndex;_j<_startIndex+_cnt;_j++)s.push(n[_j])}else{for(_j=0,_k=1;_k<n.length;_k++){var i=n[_k];for(_j=_k-1;0<=_j&&_.p[0][i][1]<_.p[0][n[_j]][1];_j--)n[_j+1]=n[_j];n[_j+1]=i}for(_j=0;_j<_cnt;_j++)s.push(n[_j])}if(-1==t.m2.p||-2==t.m2.p&&1<=_i)break}let o=epoch(),r=!1;for(let e=0;e<s.length;e++)if(isCurrentHour(_.p[0][s[e]][0],o)){r=!0;break}return r}(c),o.st=cmd[c]?5:4,!cmd[c]&&_.s.p[0].now<=("avg"==r.m2.l?_.s.p[0].avg:r.m2.l)&&(cmd[c]=!0,o.st=6),cmd[c])&&_.s.p[0].now>("avg"==r.m2.m?_.s.p[0].avg:r.m2.m)&&(cmd[c]=!1,o.st=11):_.s.timeOK?(o.st=7,e=1<<s.getHours(),(r.b&e)==e&&(cmd[c]=!0)):(cmd[c]=1===r.e,o.st=8),_.s.timeOK&&0<r.f&&(t=1<<s.getHours(),(r.f&t)==t)&&(cmd[c]=(r.fc&t)==t,o.st=10),cmd[c]&&_.s.timeOK&&s.getMinutes()>=r.m&&(o.st=13,cmd[c]=!1),_.s.timeOK&&0<o.fCmdTs&&(0<o.fCmdTs-epoch(s)?(cmd[c]=1==o.fCmd,o.st=9):o.fCmdTs=0),"function"==typeof USER_OVERRIDE?USER_OVERRIDE(c,cmd[c],n):n(cmd[c])}catch(e){log("error running logic: "+JSON.stringify(e)),loopRunning=!1}}let _avg=999,_startIndex=0,_sum=0;log("v."+_.s.v),log("URL: http://"+(Shelly.getComponentStatus("wifi").sta_ip??"192.168.33.1")+"/script/"+Shelly.getCurrentScriptId()),_.c.i.pop(),_.si.pop();for(let e=0;e<CNST.INST_COUNT;e++)_.si.push(Object.assign({},CNST.DEF_INST_ST)),_.c.i.push(Object.assign({},CNST.DEF_CFG.INST)),_.c.c.names.push("-"),_.h.push([]),cmd.push(!1);CNST.DEF_INST_ST=null,prevEpoch=epoch(),HTTPServer.registerEndpoint("",function(s,n){try{if(loopRunning)return s=null,n.code=503,void n.send();var i=function(e){var t={},s=e.split("&");for(let e=0;e<s.length;e++){var n=s[e].split("=");t[n[0]]=n[1]}return t}(s.query),o=parseInt(i.i);s=null;let e="application/json",t=(n.code=200,!0);var r="text/html",c="text/javascript";if("s"===i.r)updateState(),0<=o&&o<CNST.INST_COUNT&&(n.body=JSON.stringify({s:_.s,si:_.si[o],c:_.c.c,ci:_.c.i[o],p:_.p})),t=!1;else if("c"===i.r)updateState(),0<=o&&o<CNST.INST_COUNT?n.body=JSON.stringify(_.c.i[o]):n.body=JSON.stringify(_.c.c),t=!1;else if("h"===i.r)0<=o&&o<CNST.INST_COUNT&&(n.body=JSON.stringify(_.h[o])),t=!1;else if("r"===i.r){if(0<=o&&o<CNST.INST_COUNT)log("config changed for #"+(o+1)),_.si[o].configOK=!1;else{log("config changed");for(let e=0;e<CNST.INST_COUNT;e++)_.si[e].configOK=!1}_.s.configOK=!1,reqLogic(),loopRunning||(loopRunning=!0,getConfig(o)),_.s.p[0].ts=0,_.s.p[1].ts=0,n.code=204,t=!1}else"f"===i.r&&i.ts?(0<=o&&o<CNST.INST_COUNT&&(_.si[o].fCmdTs=+(""+i.ts),_.si[o].fCmd=+(""+i.c),_.si[o].chkTs=0),n.code=204,t=!1):i.r?"s.js"===i.r?(n.body=atob("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"),e=c):"s.css"===i.r?(n.body=atob("H4sIAAAAAAAACpVW247bNhD9lUEWARLHsqW9xZHQRds0G6BoggJF+1L0gZJGEiOKFMiRLcfYv2l+YX/AP1aQulj2ehH0xbDIuZ6ZOcPlbAYzMAUKsfVMrajWPEHPINjzgqg24XKZcyqaeJGoapmyNU89qYzBWKvlc5p/1JhwJoAKJksDpODXxhgO3ChiQsGmUJBoZIQpUIGgNM+5ZAI01gpmwNaMCxYLhAI1hudj+dJbG6KolTaGG1aU6n8reChd4L/xBKXBED5+/hN+yjLUCj6iRM0E/N7EgieDCKyvFj7MljCDHcSq9Qz/ymUeQqx0itqLVRvBA8Qq3c6BwQ4SJZQO4eL+l/sP9x+GO6vMkjLXqpFpCBe+f/nz9U0Egkv0CuR5QSEEi2usIsiUJOsGQ/AX78aTjFVcbEP4C3XKJIugYq234SkVIVy/01au/wp8/6W91jmXIfjAGlIR1CxNXeQ3dQuBX7u4L4iTQNhNnfZhdPperIhU5bScQqLq7bG8v1hZeSZ4Lj2DIgshE9h6KNMICFvy3FUI2qZpjSwy0cIOUm5qwbaduDsnFhvYQa0MJ66sCgpGfI3RKXy3jL0dVcIwxkxpnA+fLCPUrhiSUFIIL15EB3dkW26iPEoLZNpWlorh1mYqFKMQBGZd7GTmsCim4UslR3OeYDGK6W0sVFKeVPpy8fbGYjbWxIdgcWlP+rbSvVzdglGCpzbl62wVR5A02tgGqxWXhHr026cKu+MuOEDJYqNEQxjBV4/LFNsQgghI1YdwbI4h+JO4AtdXR9hnWRaNXT70sapZwmnrlB1GYVJgUmL65giU7xvq8j9jx5l4c5Lq6DaYZHXZqap6WoVc8zRyvx5hVQtG6CVKNJU0IQSZdkNi/zhlU8sJkItLh8JhTLvvMVT33deJNJOmZholjcU85Nh1bX9Mqh6v7u/fv718fyg/S3ljQrixJWSSV6yroY0rMK6XmAYuMy65reiYJpeuz/qee4AfS9xmmlVooMvJdgXsujAzpasQtCJG+Orq1k8xfw0P8NANyCJJ7shy1x3pO0rDjGtDXlJwkc5hEefzXsxUQHp6O7DDpscrViKNYI2aeMLEQAak6ueHOhOtVylbaeEmEFsv5RqTnhTUxuVWYcrZqykNrvy6fQ278yx1a4s25aNupHuec4Pgrep20j3faZdB8g5CSUWX/Ksr6385g0+s5DJ3a+9Kp9ApQ67slpTYkivibNn56G5DCGAJXhCNJaimFZjDRVzePccvR1N/Vv+kRn3e/czbvA996eZv3HDdAvAnZp9WfKobPGWt79a0Q+BU8C7l6zHUPoQ+iINPY0nAkeh04gSr7YIf/j0F6BD12Yin67IrdGLnZtI+CY4EnPEp8b6MYFNwQhcZ2v2w0ax2gptg5U8kV4PxigL/UJMOxX5FWzyCHjFHdFZc30xhcSvd7zmzEjen1R28xHO4MF5SPTOip2S0nMHHrRAo80ZAtv9X55DtHzVgS5rBmpfEc4eIfR89AJd1Q3/TtsYf4oZIyX9O3xXB8TJ5wn5HDmNW5rqRqTV+uiXsfO0fdRmL/bcuAhdYqSRpZlw8Z0qLfuxfrpz25/23XBFU1gjTCNZhyeREc+TgawuedfilKRkU+0ctrdTYHyv7nLodhFCDaDJn58mmPgO54+F+QZ8CYxeLAWS2eXv/sH9co87332T+HOZhodbuNXMG5wkAn4bM1zyFTsUZHDl9d+Yd2rftwH0H/rcNNQJyZbE4PyimqSqmLTM/fcb8B6RmEe+lDAAA"),e="text/css"):"status"===i.r?(n.body=atob("H4sIAAAAAAAACpWSzU7DMBCEX8XKCSrl74DEwfUFTggEEk/geB3kyvYGe5OUt0f5qVugRXCxZH2zM7OWOcnGaqasjHGbOaZUJjgFwQnEvR6M0kx6YAo9BbScgBnYxhz8QbWOjvVtJZ576npiHsckVA7EI0ow/q0oiqNzVMF0ZNAnZaQU/BKm3FMbj2OiTwg6AYegE3klSUdkfIuCl/OCgoMZDlu2ds9au88dNrlCm32BpCZWMxdufgBHdZUJ3iwFIyME+cHLRvASzCD48pZzeGeqs9mnLnfLo16wWQZIrX4ndovqXGf7l84OQ8DxUu36H7V/daq/F17O2Hdis8FBh2BA83K6z0nz1JDWTvr5o4ig3x/iVUayySNJ6mOxi9k1L1f8Ce8QLX7HAgAA"),e=r):"status.js"===i.r?(n.body=atob("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"),e=c):"history"===i.r?(n.body=atob("H4sIAAAAAAAACmWNOw7CMBBEr2K5giJY6TdbUdHQcAH/AoscHLybKLk9IgSElGaKefOBQKPyyTI3uk2TatNUddlVPieN8AfFv1mtEcS6FBGkIEj4YeWuGi/UxY15HqQfZGMfI/tCvVB+gFnGXA6zotBwdSMWBLM+mUDjVz8dLPF54p0W65ZsLvPhznoPZuUvUGxSH9cAAAA="),e=r):"history.js"===i.r?(n.body=atob("H4sIAAAAAAAAClWSUW/TMBDHv4p3KsgmabZR8dLUqYAx7WFs0hqeooi57qW18OxiXzZVWb47Sgqok/xwtny/++tndxaJRVnVufYuEltLkkX3O3KI052JBCIzzmG4Kb/fSlhQKBa0YdrbuFdOzoo7z4ZrPhwW57QpFucUCujzZxWYlioenGYDcNgHeYrNKRw603B6fXWttVJGUoQiILXBsTUXuWk4kFpP//JBSqXJPGOp1mIEYqqkelGG2BbpSpHiPx5uVwksg9y9NxIS4yKNHJX5X2KYdsajVNlGkRKZRbel3cnEHm1EZhr+6WJ2JqXKtN+8SRROXUDe+MCR+YbFLPpAnFMahCxCdVFPqbqoxTGmO3qD1Ek+rEQ+jg6tilFCYwiKSdf48KSoNE/IHb6wK0XIL3H2AUdOP8p9FMnYGelgUYL21of5pMPqsl7CNiA6mEPADfQD8Xh839K+JXZ/B/P/9fU1vAEWk25Vfi6//VyVDxVWH+t6mQXcW6WRA+OtI2PZuyggBfgXJYHjU586SaTr+14r0jtOohs+lLeYYQg+cBLpqT7q+1xzkX79ssr2bdxxLfo/Hd7yEYwCAAA="),e=c):"config"===i.r?(n.body=atob("H4sIAAAAAAAACpVWXW/iOBT9K1ZWo2kfAsRlZyoULLEMs2W2kKqh02fjXIgXx05tB4b99auQBJJQOu0LQj7X557cT/sR3yIeDdlq7QrEBDVmaBm5VzTict3pdPxuxLfEP5khY/cChhE3qaD7gVQSCri47FiGlk5hs1LSuob/BwOvgyEh42A2C+YonCwW0/nfYUlt6VJAdTtBjDnEt5r4NiJjlUmr9/lf34AAZnMRa+Kr1HIl0ZaKDIbhxCPhDiKQ6Cqc9LzrNozrMD6Db+rwzRncr8P9a79bKKlElsp33m2P/BwtDlq5TLOD1C21KA/A8IagT9VXLTSVZgUarQBMftD76mI8QKdrEd0fr/kmpbJ0kmrOwM0ktySc/NPdPMd+N4frCUis1yMYu72vdUbJ17H9IGeRnu4hP+0U517eyPN88Rjcoz8KP3ndcNJkvZz0ejwnMjeLDjEVdAmiCq3dpzBkMbDNUv3KHYAkKJh3g+/f/W5pWUZ7ThNoJkUesZmKoFVciYqAtHNMwhiE2COV2TSzpkmnMmuKyPaP9s+aW2iYnzwo1qrfHhmJHd2b5qlHAumymMo1nMkZK2m1EijhMrPQ0pNweUx0wmV1Zyq3oG0ZzAtR5HJ79PEXZZssRbHKdO4gh5ebIzpJQK9Bsv17cqP1peQEW9CaR+UnRGApF6YqZPEn8U2WJFTvSRirXTfmUR6L8qisIR4NV3FVSSY5VKZzKttuSfpqIZdVTGaj+dPoHs2Cb5MP1WdwSPA7QpD0XJZEZ1F4Q9LD43Q8QffT2XTxIUkPeTsjwRNuW2XhuYInHx0BlwWO7yajh0m4QHfB0+PvZ3ld44IngFLQXEXt7sNuCrrVH7hPcD9udQcmHm6d3ZLb1skX8qV10idtphty0zrBpM3seoRlxqoEXXml8NaacPHRApcW5rQqGtGOic2/X+edPagCbXVV9dhlRY8f6Fo5xG5qqhQOej3koiYINbDqsTuVacTyTXpGxuRpJ8RNDbgmAuFXZOA3deCmkDPik6hXyJm0uKGrmMHwkoG0nIq3RliCXfNynC/FYEVKnnVEQV/eEDx5b0dUm4P+6qD01V5rML+b9/KadWrBMXQLxTcvM2tPjxS6BVJ7qZ3t6cPTazT/Fp4ZWVbRn54PDQ/5fFWaQenKmVGZUYFUObkd4i/1byiUZIKzzfDzjstI7ToqBXnldJ3rzyVnuV6fYfk0dY4Pj8OvYZqnlmh4+WGuHEuXLlNyxdedf42TN1gB/w87MAIYxwoAAA=="),e=r):"config.js"===i.r?(n.body=atob("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"),e=c):n.code=404:(n.body=atob("H4sIAAAAAAAACqVTTW/bMAz9K5p2SbDYXm/DKqmHNtiwa4FeB0ViYq6KpImMg2DYfx/8kbVu163ALrRJPj4+PdnqjU+OTxla3gej+iiCjTsN0ag9sBWutYWA9YG31QejGDmAuc2Jc0EH4natmrE2wqPdg+4QjjkVFi5FhshaHtFzqz106KAakhVGZLShImcD6AtplMdOuGCJNKc8puj1HzZOHcoYpwHK0ajGY3eOQyAI4LiHYiQ2KmXGFEVnwwH0e3OdIpcUxNsL1YzQR9P9lEv5ZJQVbYGtbpkzfWyaHXJ72NQu7RtvO/RVTESwKamhFkI4VXSWWhEItmUHrL9ugo335tMwKwrkpBr7TPH59HZDT3KjMOYDi/6qdLEe0+i0HRyym4rY8oGEa8Hdg9fT80xARqhgNxDENpUZ/rygGtrmdiirZszmGqrpNgdnqgeSvxzjn7JbJE7l9LLOJ4DfQj+P9dcqnWj+R6pLcYu7l5XO+w+OAjPG3as9HWnmQsdIrmBm41IkFjfrO33E6NOxDsnZ/ruuU8EdxhqjCwcPtJB9J7SJWC4vA7Dw2id32EPklStgGdYB+kyDNr6elRawXNmcIfrrFoMfEZvkT/Wjag8q8P0L9e0fnS2C9JxFjqLl8pJqKk7frO+u4KO8Klq+g7pADtbBQvYHlyspZzsXtPy5cvSMMmC8l8tLR1QXCFoSnwJQC8Cyh9fD39ovklQ7IjmsG19n9I5okr+QVH8juVTN5PEv6C6PuxcFAAA="),e=r);n.headers=[["Content-Type",e]],t&&n.headers.push(["Content-Encoding","gzip"])}catch(e){log("server error: "+e),n.code=500}n.send()}),Timer.set(1e4,!0,loop),loop();
//end

/**
 * This user script uses the Open-Meteo service's weather forecast to select the number of cheapest hours
 * The colder the temperature, the more cheaper hours are controlled and at the same time the number of control minutes is increased.
 * 
 * Edit your location coordinates below - Tampere as an example
 * You can find the coordinates e.g. at https://www.openstreetmap.org/ - right-click and select "show address"
 * 
 * After that, edit the logic below to your liking
 */
let LATITUDE = "59.5342";
let LONGITUDE = "13.6246";

// What control is fine-tuned (0 = control #1, 1 = control #2 etc.)
let INSTANCE = 0;

/** 
 * Original settings
 */
let originalConfig = {
  hours: 0,
  minutes: 60
};

/** 
 * The day for which the temperatures have been fetched
 */
let activeDay = -1;

/** 
 * The lowest and highest temperature of the day
 */ 
let tempData = {
  min: null,
  max: null
};

/**
 * Use USER_CONFIG to save the original settings
 */
function USER_CONFIG(inst, initialized) {
  // If it is someone else's settings, do nothing
  if (inst != INSTANCE) {
    return;
  }

  // A few helper variables
  const state = _;
  const config = state.c.i[inst];

  // If settings are not yet available, skip (new installation)
  if (typeof config.m2 == "undefined") {
    console.log("Save the settings once for the user script");
    return;
  }

  // Save original settings to memory
  if (initialized) { 
    // Executing temperature logic
    activeDay = -1;

    originalConfig.hours = config.m2.c;
    originalConfig.minutes = config.m;

    console.log("Original settings:", originalConfig);
  }
}

/**
 * Once the logic has been executed, see if the effect of the temperature has already been checked for this day
 * If not, fetch temperatures and change the number of hours
 */
function USER_OVERRIDE(inst, cmd, callback) {
  // If it is someone else's settings, do nothing
  if (inst != INSTANCE) {
    callback(cmd);
    return;
  }

  // A few helper variables
  const state = _;
  const config = state.c.i[inst];

  // By default, use the number of hours and control minutes stored in the original settings
  // Therefore, if you save the settings from the user interface, they will also be used here
  let hours = originalConfig.hours;
  let minutes = originalConfig.minutes;

  try {
    if (activeDay == new Date().getDate()) {
      console.log("Temperatures already fetched for today -> no changes:", tempData);
      callback(cmd);
      return;
    }

    // Documentation on API can be found here: https://open-meteo.com/en/docs
    // Interesting parameters for different data might be:
    // daily=temperature_2m_max
    // daily=temperature_2m_min
    // daily=temperature_2m_mean
    // daily=apparent_temperature_mean
    let req = {
      url: "https://api.open-meteo.com/v1/forecast?latitude=" + LATITUDE + "&longitude=" + LONGITUDE + "&daily=apparent_temperature_mean&timezone=auto&forecast_days=1",
      timeout: 5,
      ssl_ca: "*"
    };

    console.log("Fetching temperature data:", req.url);
    
    Shelly.call("HTTP.GET", req, function (res, err, msg) {
      try {
        req = null;

        if (err === 0 && res != null && res.code === 200 && res.body) {
          let data = JSON.parse(res.body);
          res.body = null;

          // Check if the response is valid
          if (data.daily.apparent_temperature_mean != undefined) {
            // Now we have the lowest and highest temperature for today
            //tempData.min = data.daily.temperature_2m_min[0];
            //tempData.max = data.daily.temperature_2m_max[0];
            tempData.avg = data.daily.apparent_temperature_mean[0];

            console.log("Temperatures:", tempData);

            //------------------------------
            // Functionality
            // edit as you wish
            //------------------------------

            
            // Set the temperature based on the apparant_avg temperature 
            if (tempData.avg > 10) {
              hours = 1;
              minutes = 60;
            } else if (tempData.avg <= -50) {
              hours = 24;
              minutes = 60;
            } else if (tempData.avg <= -45) {
              hours = 22;
              minutes = 60;
            } else if (tempData.avg <= -40) {
              hours = 20;
              minutes = 60;
            } else if (tempData.avg <= -35) {
              hours = 18;
              minutes = 60;
            } else if (tempData.avg <= -30) {
              hours = 16;
              minutes = 60;
            } else if (tempData.avg <= -25) {
              hours = 14;
              minutes = 60;
            } else if (tempData.avg <= -20) {
              hours = 12;
              minutes = 60;
            } else if (tempData.avg <= -15) {
              hours = 10;
              minutes = 60;
            } else if (tempData.avg <= -10) {
              hours = 8;
              minutes = 60;
            } else if (tempData.avg <= -5) {
              hours = 6;
              minutes = 60;
            } else if (tempData.avg <= 0) {
              hours = 4;
              minutes = 60;
            } else if (tempData.avg <= 5) {
              hours = 2;
              minutes = 60;
            }

            //------------------------------
            // Functionality ends
            //------------------------------
            state.si[inst].str = "Average apparent temperature today: " + tempData.avg.toFixed(1) + "°C -> cheap hours: " + hours + " h, control: " + minutes + " min";
            console.log("Average apparent temperature today:", tempData.avg.toFixed(1), "°C -> set number of cheapest hours to ", hours, "h and control minutes to", minutes, "min");

            // No need to fetch again today
            activeDay = new Date().getDate();

          } else {
            throw new Error("Invalid temperature data");
          }
        } else {
          throw new Error("Failed to fetch temperatures:" + msg);
        }

      } catch (err) {
        state.si[inst].str = "Error in temperature control:" + err;
        console.log("Error processing temperatures:", err);
      }

      // Set values to settings
      //NOTE: If you use "custom selection (2 periods)", you can set the hours for the 2nd period in the variable "state.c.m2.cnt2"
      config.m2.c = hours;
      config.m = minutes;

      // Request to run the logic again
      callback(null);
      return;
    });

  } catch (err) {
    state.si[inst].str = "Error in temperature control:" + err;
    console.log("An error occurred in the USER_OVERRIDE function. Error:", err);
    
    config.m2.c = hours;
    config.m = minutes;

    callback(cmd);
  }
}