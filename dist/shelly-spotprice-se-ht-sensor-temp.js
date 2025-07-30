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
const CNST={INST_COUNT:"undefined"==typeof INSTANCE_COUNT?3:INSTANCE_COUNT,HIST_LEN:"undefined"==typeof HIST_LEN?24:HIST_LEN,ERR_LIMIT:3,ERR_DELAY:120,DEF_INST_ST:{chkTs:0,st:0,str:"",cmd:-1,configOK:0,fCmdTs:0,fCmd:0},DEF_CFG:{COM:{g:"SE3",vat:25,day:0,night:0,names:[]},INST:{en:0,mode:0,m0:{c:0},m1:{l:0},m2:{p:24,c:0,l:-999,s:0,m:999,ps:0,pe:23,ps2:0,pe2:23,c2:0},b:0,e:0,o:[0],f:0,fc:0,i:0,m:60,oc:0}}};let _={s:{v:"3.2.0",dn:"",configOK:0,timeOK:0,errCnt:0,errTs:0,upTs:0,tz:"+02:00",tzh:0,enCnt:0,p:[{ts:0,now:0,low:0,high:0,avg:0},{ts:0,now:0,low:0,high:0,avg:0}]},si:[CNST.DEF_INST_ST],p:[[],[]],h:[],c:{c:CNST.DEF_CFG.COM,i:[CNST.DEF_CFG.INST]}},_i=0,_j=0,_k=0,_inc=0,_cnt=0,_start=0,_end=0,cmd=[],prevEpoch=0,loopRunning=!1;function getKvsKey(e){let t="sptprc-se";return t=0<=e?t+"-"+(e+1):t}function isCurrentHour(e,t){t-=e;return 0<=t&&t<3600}function limit(e,t,n){return Math.min(n,Math.max(e,t))}function epoch(e){return Math.floor((e?e.getTime():Date.now())/1e3)}function getDate(e){return e.getDate()}function updateTz(e){let t=e.toString(),n=0;"+0000"==(t=t.substring(3+t.indexOf("GMT")))?(t="Z",n=0):(n=+t.substring(0,3),t=t.substring(0,3)+":"+t.substring(3)),t!=_.s.tz&&(_.s.p[0].ts=0),_.s.tz=t,_.s.tzh=n}function log(e){console.log("shelly-spotprice-se: "+e)}function reqLogic(){for(let e=0;e<CNST.INST_COUNT;e++)_.si[e].chkTs=0}function updateState(){var e=new Date,t=(_.s.timeOK=null!=Shelly.getComponentStatus("sys").unixtime&&2e3<e.getFullYear(),_.s.dn=Shelly.getComponentConfig("sys").device.name,epoch(e));for(_.s.timeOK&&300<Math.abs(t-prevEpoch)&&(log("Time changed 5 min+ -> refresh"),_.s.p[0].ts=0,_.s.p[0].now=0,_.s.p[1].ts=0,_.p[0]=[],_.p[1]=[]),prevEpoch=t,_.s.enCnt=0,_i=0;_i<CNST.INST_COUNT;_i++)_.c.i[_i].en&&_.s.enCnt++;!_.s.upTs&&_.s.timeOK&&(_.s.upTs=epoch(e))}function getConfig(p){var e=getKvsKey(p);Shelly.call("KVS.Get",{key:e},function(t,e,n){p<0?_.c.c=t?JSON.parse(t.value):{}:_.c.i[p]=t?JSON.parse(t.value):{},"function"==typeof USER_CONFIG&&USER_CONFIG(p,!0);{t=p;var i=function(e){p<0?_.s.configOK=e?1:0:(log("config for #"+(p+1)+" read, enabled: "+_.c.i[p].en),_.si[p].configOK=e?1:0,_.si[p].chkTs=0),loopRunning=!1,Timer.set(500,!1,loop)};let e=0;if(CNST.DEF_CFG.COM||CNST.DEF_CFG.INST){var s,o=t<0?CNST.DEF_CFG.COM:CNST.DEF_CFG.INST,r=t<0?_.c.c:_.c.i[t];for(s in o)if(void 0===r[s])r[s]=o[s],e++;else if("object"==typeof o[s])for(var c in o[s])void 0===r[s][c]&&(r[s][c]=o[s][c],e++);t>=CNST.INST_COUNT-1&&(CNST.DEF_CFG.COM=null,CNST.DEF_CFG.INST=null),0<e?(t=getKvsKey(t),Shelly.call("KVS.Set",{key:t,value:JSON.stringify(r)},function(e,t,n,i){t&&log("failed to set config: "+t+" - "+n),i(0==t)},i)):i(!0)}else i(!0)}})}function loop(){try{if(!loopRunning)if(loopRunning=!0,updateState(),_.s.configOK)if(pricesNeeded(0))getPrices(0);else if(pricesNeeded(1))getPrices(1);else{for(let e=0;e<CNST.INST_COUNT;e++)if(!_.si[e].configOK)return void getConfig(e);for(let e=0;e<CNST.INST_COUNT;e++)if(function(e){var t=_.si[e],n=_.c.i[e];if(1!=n.en)return void(_.h[e]=[]);var e=new Date,i=new Date(1e3*t.chkTs);return 0==t.chkTs||i.getHours()!=e.getHours()||i.getFullYear()!=e.getFullYear()||0<t.fCmdTs&&t.fCmdTs-epoch(e)<0||0==t.fCmdTs&&n.m<60&&e.getMinutes()>=n.m&&t.cmd+n.i==1}(e))return void Timer.set(500,!1,logic,e);"function"==typeof USER_LOOP?USER_LOOP():loopRunning=!1}else getConfig(-1)}catch(e){log("error at main loop:"+e),loopRunning=!1}}function pricesNeeded(e){var t=new Date;let n=!1;return n=1==e?_.s.timeOK&&0===_.s.p[1].ts&&14<=t.getHours():((e=getDate(new Date(1e3*_.s.p[0].ts))!==getDate(t))&&(_.s.p[1].ts=0,_.p[1]=[]),_.s.timeOK&&(0==_.s.p[0].ts||e)),_.s.errCnt>=CNST.ERR_LIMIT&&epoch(t)-_.s.errTs<CNST.ERR_DELAY?n=!1:_.s.errCnt>=CNST.ERR_LIMIT&&(_.s.errCnt=0),n}function getPrices(g){log("Fetching prices for "+_.c.c.g);try{log("fetching prices for day "+g);let a=new Date,e=(updateTz(a),a);var t=1+(e=1===g?new Date(a.getFullYear(),a.getMonth(),1+a.getDate()):e).getMonth(),i=(t<10?"0":"")+t,s=(e.getDate()<10?"0":"")+e.getDate();let n={url:"https://www.elprisetjustnu.se/api/v1/prices/"+e.getFullYear()+"/"+i+"-"+s+"_"+_.c.c.g+".json",timeout:5,ssl_ca:"*"};log("Request url: "+n.url),e=null,Shelly.call("HTTP.GET",n,function(e,t,i){n=null;try{if(0!==t||null==e||200!==e.code||!e.body)throw Error(t+"("+i+") - "+JSON.stringify(e));{e.headers=null,i=e.message=null,_.p[g]=[],_.s.p[g].avg=0,_.s.p[g].high=-999,_.s.p[g].low=999;var s=JSON.parse(e.body);e.body=null;let n=0;for(let t=0;t<s.length;t++){var o=s[t];let e=o.SEK_per_kWh;var r,c=new Date(o.time_start.slice(0,-5)),p=c.getHours(),l=Math.floor(c.getTime()/1e3);0<e&&(r=(100+_.c.c.vat)/100,e*=r),e+=7<=p&&p<22?_.c.c.day:_.c.c.night,_.p[g].push([l,e]),_.s.p[g].high<e&&(_.s.p[g].high=e),_.s.p[g].low>e&&(_.s.p[g].low=e),n+=e}if(e=null,_.s.p[g].avg=0<s.length?n/s.length:0,_.s.p[g].ts=epoch(a),_.p[g].length<23)throw Error("invalid data received")}}catch(t){log("error getting prices: "+t),_.s.errCnt+=1,_.s.errTs=epoch(),_.s.p[g].ts=0,_.p[g]=[]}0==g&&reqLogic(),loopRunning=!1,Timer.set(500,!1,loop)})}catch(e){log("error getting prices: "+e),_.s.errCnt+=1,_.s.errTs=epoch(),_.s.p[g].ts=0,_.p[g]=[],0==g&&reqLogic(),loopRunning=!1,Timer.set(500,!1,loop)}}function logic(c){try{"function"==typeof USER_CONFIG&&USER_CONFIG(c,!1),cmd[c]=!1;var e,t,n=new Date;updateTz(n),!function(){if(_.s.timeOK&&0!=_.s.p[0].ts){var t=epoch();for(let e=0;e<_.p[0].length;e++)if(isCurrentHour(_.p[0][e][0],t))return _.s.p[0].now=_.p[0][e][1];_.s.timeOK=!1,_.s.p[0].ts=0,_.s.errCnt+=1,_.s.errTs=epoch()}else _.s.p[0].ts,_.s.p[0].now=0}();let o=_.si[c],r=_.c.i[c];function i(e){if(null==e)loopRunning=!1;else if(cmd[c]!=e&&(o.st=12),cmd[c]=e,r.i&&(cmd[c]=!cmd[c]),log("logic for #"+(c+1)+" done, cmd: "+e+" -> output: "+cmd[c]),1==r.oc&&o.cmd==cmd[c])log("outputs already set for #"+(c+1)),o.cmd=cmd[c]?1:0,o.chkTs=epoch(),loopRunning=!1;else{let i=0,s=0;for(let e=0;e<r.o.length;e++)!function(e,s,o){e="{id:"+s+",on:"+(cmd[e]?"true":"false")+"}",Shelly.call("Switch.Set",e,function(e,t,n,i){0!=t&&log("setting output "+s+" failed: "+t+" - "+n),o(0==t)},o)}(c,r.o[e],function(e){if(i++,e&&s++,i==r.o.length){if(s==i){if(o.cmd!=cmd[c]){for(var t=c,n=0<_.s.enCnt?CNST.HIST_LEN/_.s.enCnt:CNST.HIST_LEN;0<CNST.HIST_LEN&&_.h[t].length>=n;)_.h[t].splice(0,1);_.h[t].push([epoch(),cmd[t]?1:0,_.si[t].st])}o.cmd=cmd[c]?1:0,o.chkTs=epoch(),Timer.set(500,!1,loop)}loopRunning=!1}})}}0===r.mode?(cmd[c]=1===r.m0.c,o.st=1):_.s.timeOK&&0<_.s.p[0].ts&&getDate(new Date(1e3*_.s.p[0].ts))===getDate(n)?1===r.mode?(cmd[c]=_.s.p[0].now<=("avg"==r.m1.l?_.s.p[0].avg:r.m1.l),o.st=cmd[c]?2:3):2===r.mode&&(cmd[c]=function(e){var t=_.c.i[e],n=(t.m2.ps=limit(0,t.m2.ps,23),t.m2.pe=limit(t.m2.ps,t.m2.pe,24),t.m2.ps2=limit(0,t.m2.ps2,23),t.m2.pe2=limit(t.m2.ps2,t.m2.pe2,24),t.m2.c=limit(0,t.m2.c,0<t.m2.p?t.m2.p:t.m2.pe-t.m2.ps),t.m2.c2=limit(0,t.m2.c2,t.m2.pe2-t.m2.ps2),[]);for(_inc=t.m2.p<0?1:t.m2.p,_i=0;_i<_.p[0].length;_i+=_inc)if(!((_cnt=-2==t.m2.p&&1<=_i?t.m2.c2:t.m2.c)<=0)){var i=[];for(_start=_i,_end=_i+t.m2.p,t.m2.p<0&&0==_i?(_start=t.m2.ps,_end=t.m2.pe):-2==t.m2.p&&1==_i&&(_start=t.m2.ps2,_end=t.m2.pe2),_j=_start;_j<_end&&!(_j>_.p[0].length-1);_j++)i.push(_j);if(t.m2.s){for(_avg=999,_startIndex=0,_j=0;_j<=i.length-_cnt;_j++){for(_sum=0,_k=_j;_k<_j+_cnt;_k++)_sum+=_.p[0][i[_k]][1];_sum/_cnt<_avg&&(_avg=_sum/_cnt,_startIndex=_j)}for(_j=_startIndex;_j<_startIndex+_cnt;_j++)n.push(i[_j])}else{for(_j=0,_k=1;_k<i.length;_k++){var s=i[_k];for(_j=_k-1;0<=_j&&_.p[0][s][1]<_.p[0][i[_j]][1];_j--)i[_j+1]=i[_j];i[_j+1]=s}for(_j=0;_j<_cnt;_j++)n.push(i[_j])}if(-1==t.m2.p||-2==t.m2.p&&1<=_i)break}let o=epoch(),r=!1;for(let e=0;e<n.length;e++)if(isCurrentHour(_.p[0][n[e]][0],o)){r=!0;break}return r}(c),o.st=cmd[c]?5:4,!cmd[c]&&_.s.p[0].now<=("avg"==r.m2.l?_.s.p[0].avg:r.m2.l)&&(cmd[c]=!0,o.st=6),cmd[c])&&_.s.p[0].now>("avg"==r.m2.m?_.s.p[0].avg:r.m2.m)&&(cmd[c]=!1,o.st=11):_.s.timeOK?(o.st=7,e=1<<n.getHours(),(r.b&e)==e&&(cmd[c]=!0)):(cmd[c]=1===r.e,o.st=8),_.s.timeOK&&0<r.f&&(t=1<<n.getHours(),(r.f&t)==t)&&(cmd[c]=(r.fc&t)==t,o.st=10),cmd[c]&&_.s.timeOK&&n.getMinutes()>=r.m&&(o.st=13,cmd[c]=!1),_.s.timeOK&&0<o.fCmdTs&&(0<o.fCmdTs-epoch(n)?(cmd[c]=1==o.fCmd,o.st=9):o.fCmdTs=0),"function"==typeof USER_OVERRIDE?USER_OVERRIDE(c,cmd[c],i):i(cmd[c])}catch(e){log("error running logic: "+JSON.stringify(e)),loopRunning=!1}}let _avg=999,_startIndex=0,_sum=0;log("v."+_.s.v),log("URL: http://"+(Shelly.getComponentStatus("wifi").sta_ip??"192.168.33.1")+"/script/"+Shelly.getCurrentScriptId()),_.c.i.pop(),_.si.pop();for(let e=0;e<CNST.INST_COUNT;e++)_.si.push(Object.assign({},CNST.DEF_INST_ST)),_.c.i.push(Object.assign({},CNST.DEF_CFG.INST)),_.c.c.names.push("-"),_.h.push([]),cmd.push(!1);CNST.DEF_INST_ST=null,prevEpoch=epoch(),HTTPServer.registerEndpoint("",function(n,i){try{if(loopRunning)return n=null,i.code=503,void i.send();var s=function(e){var t={},n=e.split("&");for(let e=0;e<n.length;e++){var i=n[e].split("=");t[i[0]]=i[1]}return t}(n.query),o=parseInt(s.i);n=null;let e="application/json",t=(i.code=200,!0);var r="text/html",c="text/javascript";if("s"===s.r)updateState(),0<=o&&o<CNST.INST_COUNT&&(i.body=JSON.stringify({s:_.s,si:_.si[o],c:_.c.c,ci:_.c.i[o],p:_.p})),t=!1;else if("c"===s.r)updateState(),0<=o&&o<CNST.INST_COUNT?i.body=JSON.stringify(_.c.i[o]):i.body=JSON.stringify(_.c.c),t=!1;else if("h"===s.r)0<=o&&o<CNST.INST_COUNT&&(i.body=JSON.stringify(_.h[o])),t=!1;else if("r"===s.r){if(0<=o&&o<CNST.INST_COUNT)log("config changed for #"+(o+1)),_.si[o].configOK=!1;else{log("config changed");for(let e=0;e<CNST.INST_COUNT;e++)_.si[e].configOK=!1}_.s.configOK=!1,reqLogic(),loopRunning||(loopRunning=!0,getConfig(o)),_.s.p[0].ts=0,_.s.p[1].ts=0,i.code=204,t=!1}else"f"===s.r&&s.ts?(0<=o&&o<CNST.INST_COUNT&&(_.si[o].fCmdTs=+(""+s.ts),_.si[o].fCmd=+(""+s.c),_.si[o].chkTs=0),i.code=204,t=!1):s.r?"s.js"===s.r?(i.body=atob("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"),e=c):"s.css"===s.r?(i.body=atob("H4sIAAAAAAAACpVW247bNhD9lUEWARLHsqW9xZHQRds0G6BoggJF+1L0gZJGEiOKFMiRLcfYv2l+YX/AP1aQulj2ehH0xbDIuZ6ZOcPlbAYzMAUKsfVMrajWPEHPINjzgqg24XKZcyqaeJGoapmyNU89qYzBWKvlc5p/1JhwJoAKJksDpODXxhgO3ChiQsGmUJBoZIQpUIGgNM+5ZAI01gpmwNaMCxYLhAI1hudj+dJbG6KolTaGG1aU6n8reChd4L/xBKXBED5+/hN+yjLUCj6iRM0E/N7EgieDCKyvFj7MljCDHcSq9Qz/ymUeQqx0itqLVRvBA8Qq3c6BwQ4SJZQO4eL+l/sP9x+GO6vMkjLXqpFpCBe+f/nz9U0Egkv0CuR5QSEEi2usIsiUJOsGQ/AX78aTjFVcbEP4C3XKJIugYq234SkVIVy/01au/wp8/6W91jmXIfjAGlIR1CxNXeQ3dQuBX7u4L4iTQNhNnfZhdPperIhU5bSiQ3L3799evncGElVvj/X9xcrqM8Fz6RkUWQiZwNZDmUZA2JLnrkLQNm1rZJGJFnaQclMLtu3E3Tmx2MAOamU4cWVVUDDia4xO4bxl7O2oEoYxZkrjfPhkGaF2xZGEkkJ48SI6uCPbghPlUVog07bSVAy3NlOhGIUgMOtiJzOHRTENXyo5mvMEi1FMb2OhkvKk8peLtzcWs7FGPgSLS3vSt5nu5eoWjBI8tSlfZ6s4gqTRxtakVlwS6tFvnyrsjrviACWLjRINYQRfPS5TbEMIIiBVH8KxOYbgT+IKXJ8dYZ9l2aExhr5WNUs4bZ2ywyhMCkxKTN8cgfJ9Q13+Z+w4E29OUh3dBpOsLjtVVU+rkGueRu7XI6xqwQi9RImmkiaEINNuaOwfp2xqOQFycelQOIxt9z2G6r77OpFm0tRMo6SxmIccu67tj0nV3umADeVnKW9MCDe2hEzyinU1tHEFxvUS08BlxiW3FR3T5NL1Wd9zD/BjidtMswoNdDnZroBdF2amdBWCVsQIX13d+inmr+EBHroBWSTJHVkuuyN9R2mYcW3ISwou0jks4nzei5kKSE9vB3bY9HjFSqQRrFETT5gYyIBU/fxQZ6L1KmUrLdwEYuulXGPSk4LauNwqTDl7NaXFlV+3r2F3nqVubdGmfNSNdM97bhC8Vd1Ouuc77TJI3kEoqeiSf3Vl/S9n8ImVXOZuDV7pFDplyJXdmhJbckWcLTsf3W0IASzBC6KxBNW0AnO4iMu75/jlaOrP6p/UqM+7n3mb96Ev3fyNG69bCP7E7NOKT3WDp6z13Zp2CJwK3qV8PYbah9AHcfBpLAk4Ep1OnGC1XfjDv6cAHaI+G/F0fXaFTuzcTNonwZGAMz4l3pcRbApO6CJDux82mtVOcBOs/InkajBeUeAfatKh2K9si0fQI+aIzorrmyksbsX7PWdW4ua0uoOXeA4XxkuqZ0b0lIyWM/i4FQJl3gjI9v/qHLL9owZsSTNY85J47hCx76UH4LJu6G/a1vhD3BAp+c/pOyM4XiZP2O/IYczKXDcytcZPt4Sdr/2jLmOx/9ZF4AIrlSTNjIvnTGnRj/3LldP+vP+WK4LKGmEawTosmZxojhx8bcGzDr80JYNi/6illRr7Y2WfV7eDEGoQTebsPNnUZyB3PNwv6FNg7GIxgMw2b+8f9o9r1Pn+m8yfwzws1Nq9Zs7gPAHg05D5mqfQqTiDI6fvzrxL+7YduO/A/7ahRkCuLBbnB8U0VcW0Zeanz5j/ABA2kfe1DAAA"),e="text/css"):"status"===s.r?(i.body=atob("H4sIAAAAAAAACpWSzU7DMBCEX8XKCSrl74DEwfUFTggEEk/geB3kyvYGe5OUt0f5qVugRXCxZH2zM7OWOcnGaqasjHGbOaZUJjgFwQnEvR6M0kx6YAo9BbScgBnYxhz8QbWOjvVtJZ576npiHsckVA7EI0ow/q0oiqNzVMF0ZNAnZaQU/BKm3FMbj2OiTwg6AYegE3klSUdkfIuCl/OCgoMZDlu2ds9au88dNrlCm32BpCZWMxdufgBHdZUJ3iwFIyME+cHLRvASzCD48pZzeGeqs9mnLnfLo16wWQZIrX4ndovqXGf7l84OQ8DxUu36H7V/daq/F17O2Hdis8FBh2BA83K6z0nz1JDWTvr5o4ig3x/iVUayySNJ6mOxi9k1L1f8Ce8QLX7HAgAA"),e=r):"status.js"===s.r?(i.body=atob("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"),e=c):"history"===s.r?(i.body=atob("H4sIAAAAAAAACmWNOw7CMBBEr2K5giJY6TdbUdHQcAH/AoscHLybKLk9IgSElGaKefOBQKPyyTI3uk2TatNUddlVPieN8AfFv1mtEcS6FBGkIEj4YeWuGi/UxY15HqQfZGMfI/tCvVB+gFnGXA6zotBwdSMWBLM+mUDjVz8dLPF54p0W65ZsLvPhznoPZuUvUGxSH9cAAAA="),e=r):"history.js"===s.r?(i.body=atob("H4sIAAAAAAAAClWSUW/TMBDHv4p3KsgmabZR8dLUqYAx7WFs0hqeooi57qW18OxiXzZVWb47Sgqok/xwtny/++tndxaJRVnVufYuEltLkkX3O3KI052JBCIzzmG4Kb/fSlhQKBa0YdrbuFdOzoo7z4ZrPhwW57QpFucUCujzZxWYlioenGYDcNgHeYrNKRw603B6fXWttVJGUoQiILXBsTUXuWk4kFpP//JBSqXJPGOp1mIEYqqkelGG2BbpSpHiPx5uVwksg9y9NxIS4yKNHJX5X2KYdsajVNlGkRKZRbel3cnEHm1EZhr+6WJ2JqXKtN+8SRROXUDe+MCR+YbFLPpAnFMahCxCdVFPqbqoxTGmO3qD1Ek+rEQ+jg6tilFCYwiKSdf48KSoNE/IHb6wK0XIL3H2AUdOP8p9FMnYGelgUYL21of5pMPqsl7CNiA6mEPADfQD8Xh839K+JXZ/B/P/9fU1vAEWk25Vfi6//VyVDxVWH+t6mQXcW6WRA+OtI2PZuyggBfgXJYHjU586SaTr+14r0jtOohs+lLeYYQg+cBLpqT7q+1xzkX79ssr2bdxxLfo/Hd7yEYwCAAA="),e=c):"config"===s.r?(i.body=atob("H4sIAAAAAAAACpVWXW/iOBT9K1ZWq2kfAsRlZyoULLEMs2W2kKqh22fjXIgXx05tB4b99auQBJJQ+vGCkO/1uSfnftmP+BbxaMhWa1cgJqgxQ8vIvaIRl+tOp+N3I74l/skNGbsXMIy4SQXdD6SSUJiLy45laOkUPislrWv4fzDwOhgSMg5ms2COwsliMZ3/FZbQli4FVLcTxJhDfKuJbyMyVpm0ep//9Q0IYDYnsSa+Si1XEm2pyGAYTjwS7iACia7CSc+7bptx3YzPzDd1882ZuV8396/9bsGkIlky33m3PfLPaHHgymWaHahuqUW5AMMbgn6vvmqhqTQr0GgFYPKD3jcX4wE6XYvo/njNNymVZZBUcwZuJrklrLt5jv1ubqzLn1ivRzB2e9/qeJKvY/spxCI13UNu2unNY7yR4/niMbhHvxVR8prhpIl6OeF1LScyd4sOegq6BFHJavcpDFkMbLNUv/IAIAkK5t3gxw+/W3qWSs9pAs2EyKNtpiJoFVaiIiDt/JIwBiH2SGU2zaxpwqnMmkLX/tH/WXMLDfdTBMVatdsjI7Gje9M89UggXRZTuYYzOmMlrVYCJVxmFlp8Ei6PaU64rO5M5Ra0LcW8oCKX22OMPynbZCmKVabzALl5uTlaJwnoNUi2/0hutL6UnGALWvOo/IQILOXCVGUs/iC+yZKE6j0JY7XrxjzKtSiPyhri0XAVV5VkkkNlOqey7ZagrxZyWcVkNpo/je7RLPg++VR9BocEf0CCpOeyJDpT4Q1KD4/T8QTdT2fTxacoPeTNjARPuG2VhecKnrw3AMLJ340RcJng+G4yepiEC3QXPD2+P8frHBc8AZSC5ipqdx92U9Ct/sB9gvtxqzsw8XDr7Jbctk6+kq+tkz5pI92Qm9YJJm1k1yMsM1Yl6MoribdWhIuPHrj0MKc10VA7Jjb/fp139qAS2uqq6rHLih4/wLVyiN3UVCkc9HrIRU0j1IxVj92pTCOWb9EzMCZPGyFucsA1Egi/QgO/yQM3iZwBn0i9As6kxQ1exQyGlwyk5VS8NcIS7JqX43wpBitS8qwjCvjyhuDJRzui2hz0Vwelr/ZaA/nDuJfXrFMTx9AtFN+8zKw9PVDoFkjtlXa2pw/PrtH8e3jmZFkFf3o8NCLk81VpBmUoZ0ZlRgVS5eR2iL/U70AoyQRnm+GXHZeR2nVUCvLK6TrXX0rMcr0+w/Jp6hwfHodfwzRPLdHw8tNcOZYuXabkiq87/xonb7DC/D9K2xcqwwoAAA=="),e=r):"config.js"===s.r?(i.body=atob("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"),e=c):i.code=404:(i.body=atob("H4sIAAAAAAAACqVTTW/bMAz9K5p2SbDYXm/DKqmHNtiwa4FeB0ViYq6KpImMg2DYfx/8kbVu163ALrRJPj4+PdnqjU+OTxla3gej+iiCjTsN0ag9sBWutYWA9YG31QejGDmAuc2Jc0EH4natmrE2wqPdg+4QjjkVFi5FhshaHtFzqz106KAakhVGZLShImcD6AtplMdOuGCJNKc8puj1HzZOHcoYpwHK0ajGY3eOQyAI4LiHYiQ2KmXGFEVnwwH0e3OdIpcUxNsL1YzQR9P9lEv5ZJQVbYGtbpkzfWyaHXJ72NQu7RtvO/RVTESwKamhFkI4VXSWWhEItmUHrL9ugo335tMwKwrkpBr7TPH59HZDT3KjMOYDi/6qdLEe0+i0HRyym4rY8oGEa8Hdg9fT80xARqhgNxDENpUZ/rygGtrmdiirZszmGqrpNgdnqgeSvxzjn7JbJE7l9LLOJ4DfQj+P9dcqnWj+R6pLcYu7l5XO+w+OAjPG3as9HWnmQsdIrmBm41IkFjfrO33E6NOxDsnZ/ruuU8EdxhqjCwcPtJB9J7SJWC4vA7Dw2id32EPklStgGdYB+kyDNr6elRawXNmcIfrrFoMfEZvkT/Wjag8q8P0L9e0fnS2C9JxFjqLl8pJqKk7frO+u4KO8Klq+g7pADtbBQvYHlyspZzsXtPy5cvSMMmC8l8tLR1QXCFoSnwJQC8Cyh9fD39ovklQ7IjmsG19n9I5okr+QVH8juVTN5PEv6C6PuxcFAAA="),e=r);i.headers=[["Content-Type",e]],t&&i.headers.push(["Content-Encoding","gzip"])}catch(e){log("server error: "+e),i.code=500}i.send()}),Timer.set(1e4,!0,loop),loop();
//end

/**
 * This user script utilizes the temperature sent by Shelly H&T (Gen 1, Plus, Gen 3) in the electricity spot price control settings
 * The colder the temperature, the more cheaper hours are controlled, and at the same time, the number of control minutes is increased.
 * 
 * This only changes the settings for control #1, others are not affected.
 * 
 * Setup:
 * -----
 * Shelly H&T gen 1
 * -----
 * In the Shelly H&T settings, add the following address to "actions >- sensor reports"
 *    http://ip-address/script/1/update-temp
 * where ip-address is the address of this Shelly. 
 * Remember to also enable the "sensor reports" feature
 * 
 * -----
 * Shelly H&T Plus and H&T gen 3
 * -----
 * Add a new Action->Temperature
 * Under "Then Do", add the new address below
 *    http://ip-address/script/1/update-temp?temp=$temperature
 * where ip-address is the address of this Shelly. 
 */

// What control is fine-tuned (0 = control #1, 1 = control #2 etc.)
let INSTANCE = 0;

// How old temperature data is allowed in the control (in hours)
let TEMPERATURE_MAX_AGE_HOURS = 12;

// Latest known temperature data
let data = null;

// Original unmodified settings
let originalConfig = {
  hours: 0,
  minutes: 60
};

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
    originalConfig.hours = config.m2.c;
    originalConfig.minutes = config.m;

    console.log("Original settings:", originalConfig);
  }

  // By default, use the number of hours and control minutes stored in the original settings
  // Therefore, if you save the settings from the user interface, they will also be used here
  let hours = originalConfig.hours;
  let minutes = originalConfig.minutes;

  try {

    if (data == null) {
      console.log("Temperature data is not available");
      state.si[inst].str = "Temperature unknown -> cheap hours: " + hours + " h, control: " + minutes + " min";

    } else {
      let age = (Date.now() - data.ts) / 1000.0 / 60.0 / 60.0;
      console.log("Temperature is known (updated " + age.toFixed(2) + " h ago):", data);

      if (age <= TEMPERATURE_MAX_AGE_HOURS * 60) {
        //------------------------------
        // Functionality
        // edit as you wish
        //------------------------------

        // Change the number of heating hours and minutes based on the temperature
        if (data.temp <= -15) {
          hours = 8;
          minutes = 60;

        } else if (data.temp <= -10) {
          hours = 7;
          minutes = 45;

        } else if (data.temp <= -5) {
          hours = 6;
          minutes = 45;

        } else {
          // Do nothing --> use the user interface settings
        }

        //------------------------------
        // Functionality ends
        //------------------------------
        state.si[inst].str = "Temperature " + data.temp.toFixed(1) + "°C (" + age.toFixed(1) + "h ago) -> cheap hours: " + hours + " h, control: " + minutes + " min";
        console.log("Temperature:", data.temp.toFixed(1), "°C -> set number of cheapest hours to ", hours, "h and control minutes to", minutes, "min");

      } else {
        console.log("Temperature data is too old -> not used");
        state.si[inst].str = "Temperature data too old (" + age.toFixed(1) + " h) -> cheap hours: " + hours + " h, control: " + minutes + " min";
      }
    }
  } catch (err) {
    state.si[inst].str = "Error in temperature control:" + err;
    console.log("An error occurred in the USER_CONFIG function:", err);
  }

  // Set values to settings
  config.m2.c = hours;
  config.m = minutes;
}

/** 
 * Helper function that collects parameters from the address
 */
function parseParams(params) {
  let res = {};
  let splitted = params.split("&");

  for (let i = 0; i < splitted.length; i++) {
    let pair = splitted[i].split("=");

    res[pair[0]] = pair[1];
  }

  return res;
}

/**
 * Callback that is executed when an HTTP request is received
 */
function onHttpRequest(request, response) {
  try {
    let params = parseParams(request.query);
    request = null;

    if (params.temp != undefined) {
      data = {
        temp: Number(params.temp),
        ts: Math.floor(Date.now())
      };


      _.si[INSTANCE].chkTs = 0; //Requesting to run logic again

      response.code = 200;

    } else {
      console.log("Failed to update temperature data, 'temp' is missing from parameters:", params);
      response.code = 400;
    }

    response.send();

  } catch (err) {
    console.log("Error:", err);
  }
}

//Register the /script/x/update-temp address
HTTPServer.registerEndpoint('update-temp', onHttpRequest);