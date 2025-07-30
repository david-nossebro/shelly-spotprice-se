/**
 * @license
 * 
 * shelly-porssisahko
 * shelly-porssisahko-en
 * 
 * (c) Jussi isotalo - http://jisotalo.fi
 * https://github.com/jisotalo/shelly-porssisahko
 * https://github.com/jisotalo/shelly-porssisahko-en
 * 
 * License: GNU Affero General Public License v3.0 
 */
const CNST={INST_COUNT:"undefined"==typeof INSTANCE_COUNT?3:INSTANCE_COUNT,HIST_LEN:"undefined"==typeof HIST_LEN?24:HIST_LEN,ERR_LIMIT:3,ERR_DELAY:120,DEF_INST_ST:{chkTs:0,st:0,str:"",cmd:-1,configOK:0,fCmdTs:0,fCmd:0},DEF_CFG:{COM:{g:"fi",vat:25.5,day:0,night:0,names:[]},INST:{en:0,mode:0,m0:{c:0},m1:{l:0},m2:{p:24,c:0,l:-999,s:0,m:999,ps:0,pe:23,ps2:0,pe2:23,c2:0},b:0,e:0,o:[0],f:0,fc:0,i:0,m:60,oc:0}}};let _={s:{v:"3.2.0",dn:"",configOK:0,timeOK:0,errCnt:0,errTs:0,upTs:0,tz:"+02:00",tzh:0,enCnt:0,p:[{ts:0,now:0,low:0,high:0,avg:0},{ts:0,now:0,low:0,high:0,avg:0}]},si:[CNST.DEF_INST_ST],p:[[],[]],h:[],c:{c:CNST.DEF_CFG.COM,i:[CNST.DEF_CFG.INST]}},_i=0,_j=0,_k=0,_inc=0,_cnt=0,_start=0,_end=0,cmd=[],prevEpoch=0,loopRunning=!1;function getKvsKey(e){let t="porssi";return t=0<=e?t+"-"+(e+1):t}function isCurrentHour(e,t){t-=e;return 0<=t&&t<3600}function limit(e,t,n){return Math.min(n,Math.max(e,t))}function epoch(e){return Math.floor((e?e.getTime():Date.now())/1e3)}function getDate(e){return e.getDate()}function updateTz(e){let t=e.toString(),n=0;"+0000"==(t=t.substring(3+t.indexOf("GMT")))?(t="Z",n=0):(n=+t.substring(0,3),t=t.substring(0,3)+":"+t.substring(3)),t!=_.s.tz&&(_.s.p[0].ts=0),_.s.tz=t,_.s.tzh=n}function log(e){console.log("shelly-porssisahko: "+e)}function reqLogic(){for(let e=0;e<CNST.INST_COUNT;e++)_.si[e].chkTs=0}function updateState(){var e=new Date,t=(_.s.timeOK=null!=Shelly.getComponentStatus("sys").unixtime&&2e3<e.getFullYear(),_.s.dn=Shelly.getComponentConfig("sys").device.name,epoch(e));for(_.s.timeOK&&300<Math.abs(t-prevEpoch)&&(log("Time changed 5 min+ -> refresh"),_.s.p[0].ts=0,_.s.p[0].now=0,_.s.p[1].ts=0,_.p[0]=[],_.p[1]=[]),prevEpoch=t,_.s.enCnt=0,_i=0;_i<CNST.INST_COUNT;_i++)_.c.i[_i].en&&_.s.enCnt++;!_.s.upTs&&_.s.timeOK&&(_.s.upTs=epoch(e))}function getConfig(p){var e=getKvsKey(p);Shelly.call("KVS.Get",{key:e},function(t,e,n){p<0?_.c.c=t?JSON.parse(t.value):{}:_.c.i[p]=t?JSON.parse(t.value):{},"function"==typeof USER_CONFIG&&USER_CONFIG(p,!0);{t=p;var o=function(e){p<0?_.s.configOK=e?1:0:(log("config for #"+(p+1)+" read, enabled: "+_.c.i[p].en),_.si[p].configOK=e?1:0,_.si[p].chkTs=0),loopRunning=!1,Timer.set(500,!1,loop)};let e=0;if(CNST.DEF_CFG.COM||CNST.DEF_CFG.INST){var s,i=t<0?CNST.DEF_CFG.COM:CNST.DEF_CFG.INST,r=t<0?_.c.c:_.c.i[t];for(s in i)if(void 0===r[s])r[s]=i[s],e++;else if("object"==typeof i[s])for(var c in i[s])void 0===r[s][c]&&(r[s][c]=i[s][c],e++);t>=CNST.INST_COUNT-1&&(CNST.DEF_CFG.COM=null,CNST.DEF_CFG.INST=null),0<e?(t=getKvsKey(t),Shelly.call("KVS.Set",{key:t,value:JSON.stringify(r)},function(e,t,n,o){t&&log("failed to set config: "+t+" - "+n),o(0==t)},o)):o(!0)}else o(!0)}})}function loop(){try{if(!loopRunning)if(loopRunning=!0,updateState(),_.s.configOK)if(pricesNeeded(0))getPrices(0);else if(pricesNeeded(1))getPrices(1);else{for(let e=0;e<CNST.INST_COUNT;e++)if(!_.si[e].configOK)return void getConfig(e);for(let e=0;e<CNST.INST_COUNT;e++)if(function(e){var t=_.si[e],n=_.c.i[e];if(1!=n.en)return void(_.h[e]=[]);var e=new Date,o=new Date(1e3*t.chkTs);return 0==t.chkTs||o.getHours()!=e.getHours()||o.getFullYear()!=e.getFullYear()||0<t.fCmdTs&&t.fCmdTs-epoch(e)<0||0==t.fCmdTs&&n.m<60&&e.getMinutes()>=n.m&&t.cmd+n.i==1}(e))return void Timer.set(500,!1,logic,e);"function"==typeof USER_LOOP?USER_LOOP():loopRunning=!1}else getConfig(-1)}catch(e){log("error at main loop:"+e),loopRunning=!1}}function pricesNeeded(e){var t=new Date;let n=!1;return n=1==e?_.s.timeOK&&0===_.s.p[1].ts&&15<=t.getHours():((e=getDate(new Date(1e3*_.s.p[0].ts))!==getDate(t))&&(_.s.p[1].ts=0,_.p[1]=[]),_.s.timeOK&&(0==_.s.p[0].ts||e)),_.s.errCnt>=CNST.ERR_LIMIT&&epoch(t)-_.s.errTs<CNST.ERR_DELAY?n=!1:_.s.errCnt>=CNST.ERR_LIMIT&&(_.s.errCnt=0),n}function getPrices(e){if("fi"===_.c.c.g||"ee"===_.c.c.g||"lv"===_.c.c.g||"lt"===_.c.c.g){var c=e;log("Fetching prices for "+_.c.c.g);try{log("fetching prices for day "+c);let i=new Date;updateTz(i);var t=1==c?new Date(864e5+new Date(i.getFullYear(),i.getMonth(),i.getDate()).getTime()):i;let e=t.getFullYear()+"-"+(t.getMonth()<9?"0"+(1+t.getMonth()):1+t.getMonth())+"-"+(getDate(t)<10?"0"+getDate(t):getDate(t))+"T00:00:00"+_.s.tz.replace("+","%2b");var n=e.replace("T00:00:00","T23:59:59");let r={url:"https://dashboard.elering.ee/api/nps/price/csv?fields="+_.c.c.g+"&start="+e+"&end="+n,timeout:5,ssl_ca:"*"};i=null,e=null,Shelly.call("HTTP.GET",r,function(t,e,n){r=null;try{if(0!==e||null==t||200!==t.code||!t.body_b64)throw Error(e+"("+n+") - "+JSON.stringify(t));{t.headers=null,n=t.message=null,_.p[c]=[],_.s.p[c].avg=0,_.s.p[c].high=-999,_.s.p[c].low=999,t.body_b64=atob(t.body_b64),t.body_b64=t.body_b64.substring(1+t.body_b64.indexOf("\n"));let e=0;for(;0<=e;){t.body_b64=t.body_b64.substring(e);var o=[e=0,0];if(0===(e=1+t.body_b64.indexOf('"',e)))break;o[0]=+t.body_b64.substring(e,t.body_b64.indexOf('"',e)),e=2+t.body_b64.indexOf('"',e),e=2+t.body_b64.indexOf(';"',e),o[1]=+(""+t.body_b64.substring(e,t.body_b64.indexOf('"',e)).replace(",",".")),o[1]=o[1]/10*(100+(0<o[1]?_.c.c.vat:0))/100;var s=new Date(1e3*o[0]).getHours();o[1]+=7<=s&&s<22?_.c.c.day:_.c.c.night,_.p[c].push(o),_.s.p[c].avg+=o[1],o[1]>_.s.p[c].high&&(_.s.p[c].high=o[1]),o[1]<_.s.p[c].low&&(_.s.p[c].low=o[1]),e=t.body_b64.indexOf("\n",e)}if(t=null,_.s.p[c].avg=0<_.p[c].length?_.s.p[c].avg/_.p[c].length:0,_.s.p[c].ts=epoch(i),_.p[c].length<23)throw Error("invalid data received")}}catch(e){log("error getting prices: "+e),_.s.errCnt+=1,_.s.errTs=epoch(),_.s.p[c].ts=0,_.p[c]=[]}0==c&&reqLogic(),loopRunning=!1,Timer.set(500,!1,loop)})}catch(e){log("error getting prices: "+e),_.s.errCnt+=1,_.s.errTs=epoch(),_.s.p[c].ts=0,_.p[c]=[],0==c&&reqLogic(),loopRunning=!1,Timer.set(500,!1,loop)}}else if("SE1"===_.c.c.g||"SE2"===_.c.c.g||"SE3"===_.c.c.g||"SE4"===_.c.c.g){var a=e;log("Fetching prices for "+_.c.c.g);try{log("fetching prices for day "+a);let g=new Date,e=(updateTz(g),g),n={url:"https://www.elprisetjustnu.se/api/v1/prices/"+(e=1===a?new Date(g.getFullYear(),g.getMonth(),1+g.getDate()):e).getFullYear()+"/"+function(e){e=1+e.getMonth(),e=(e<10?"0":"")+e;return e}(e)+"-"+e.getDate()+"_SE3.json",timeout:5,ssl_ca:"*"};e=null,Shelly.call("HTTP.GET",n,function(e,t,o){n=null;try{if(0!==t||null==e||200!==e.code||!e.body)throw Error(t+"("+o+") - "+JSON.stringify(e));{e.headers=null,o=e.message=null,_.p[a]=[],_.s.p[a].avg=0,_.s.p[a].high=-999,_.s.p[a].low=999;var s=JSON.parse(e.body);e.body=null;let n=0;for(let t=0;t<s.length;t++){var i=s[t];let e=i.SEK_per_kWh;var r,c=new Date(i.time_start.slice(0,-5)),p=c.getHours(),l=Math.floor(c.getTime()/1e3);0<e&&(r=(100+_.c.c.vat)/100,e*=r),e+=7<=p&&p<22?_.c.c.day:_.c.c.night,_.p[a].push([l,e]),_.s.p[a].high<e&&(_.s.p[a].high=e),_.s.p[a].low>e&&(_.s.p[a].low=e),n+=e}if(e=null,_.s.p[a].avg=0<s.length?n/s.length:0,_.s.p[a].ts=epoch(g),_.p[a].length<23)throw Error("invalid data received")}}catch(t){log("error getting prices: "+t),_.s.errCnt+=1,_.s.errTs=epoch(),_.s.p[a].ts=0,_.p[a]=[]}0==a&&reqLogic(),loopRunning=!1,Timer.set(500,!1,loop)})}catch(e){log("error getting prices: "+e),_.s.errCnt+=1,_.s.errTs=epoch(),_.s.p[a].ts=0,_.p[a]=[],0==a&&reqLogic(),loopRunning=!1,Timer.set(500,!1,loop)}}}function logic(c){try{"function"==typeof USER_CONFIG&&USER_CONFIG(c,!1),cmd[c]=!1;var e,t,n=new Date;updateTz(n),!function(){if(_.s.timeOK&&0!=_.s.p[0].ts){var t=epoch();for(let e=0;e<_.p[0].length;e++)if(isCurrentHour(_.p[0][e][0],t))return _.s.p[0].now=_.p[0][e][1];_.s.timeOK=!1,_.s.p[0].ts=0,_.s.errCnt+=1,_.s.errTs=epoch()}else _.s.p[0].ts,_.s.p[0].now=0}();let i=_.si[c],r=_.c.i[c];function o(e){if(null==e)loopRunning=!1;else if(cmd[c]!=e&&(i.st=12),cmd[c]=e,r.i&&(cmd[c]=!cmd[c]),log("logic for #"+(c+1)+" done, cmd: "+e+" -> output: "+cmd[c]),1==r.oc&&i.cmd==cmd[c])log("outputs already set for #"+(c+1)),i.cmd=cmd[c]?1:0,i.chkTs=epoch(),loopRunning=!1;else{let o=0,s=0;for(let e=0;e<r.o.length;e++)!function(e,s,i){e="{id:"+s+",on:"+(cmd[e]?"true":"false")+"}",Shelly.call("Switch.Set",e,function(e,t,n,o){0!=t&&log("setting output "+s+" failed: "+t+" - "+n),i(0==t)},i)}(c,r.o[e],function(e){if(o++,e&&s++,o==r.o.length){if(s==o){if(i.cmd!=cmd[c]){for(var t=c,n=0<_.s.enCnt?CNST.HIST_LEN/_.s.enCnt:CNST.HIST_LEN;0<CNST.HIST_LEN&&_.h[t].length>=n;)_.h[t].splice(0,1);_.h[t].push([epoch(),cmd[t]?1:0,_.si[t].st])}i.cmd=cmd[c]?1:0,i.chkTs=epoch(),Timer.set(500,!1,loop)}loopRunning=!1}})}}0===r.mode?(cmd[c]=1===r.m0.c,i.st=1):_.s.timeOK&&0<_.s.p[0].ts&&getDate(new Date(1e3*_.s.p[0].ts))===getDate(n)?1===r.mode?(cmd[c]=_.s.p[0].now<=("avg"==r.m1.l?_.s.p[0].avg:r.m1.l),i.st=cmd[c]?2:3):2===r.mode&&(cmd[c]=function(e){var t=_.c.i[e],n=(t.m2.ps=limit(0,t.m2.ps,23),t.m2.pe=limit(t.m2.ps,t.m2.pe,24),t.m2.ps2=limit(0,t.m2.ps2,23),t.m2.pe2=limit(t.m2.ps2,t.m2.pe2,24),t.m2.c=limit(0,t.m2.c,0<t.m2.p?t.m2.p:t.m2.pe-t.m2.ps),t.m2.c2=limit(0,t.m2.c2,t.m2.pe2-t.m2.ps2),[]);for(_inc=t.m2.p<0?1:t.m2.p,_i=0;_i<_.p[0].length;_i+=_inc)if(!((_cnt=-2==t.m2.p&&1<=_i?t.m2.c2:t.m2.c)<=0)){var o=[];for(_start=_i,_end=_i+t.m2.p,t.m2.p<0&&0==_i?(_start=t.m2.ps,_end=t.m2.pe):-2==t.m2.p&&1==_i&&(_start=t.m2.ps2,_end=t.m2.pe2),_j=_start;_j<_end&&!(_j>_.p[0].length-1);_j++)o.push(_j);if(t.m2.s){for(_avg=999,_startIndex=0,_j=0;_j<=o.length-_cnt;_j++){for(_sum=0,_k=_j;_k<_j+_cnt;_k++)_sum+=_.p[0][o[_k]][1];_sum/_cnt<_avg&&(_avg=_sum/_cnt,_startIndex=_j)}for(_j=_startIndex;_j<_startIndex+_cnt;_j++)n.push(o[_j])}else{for(_j=0,_k=1;_k<o.length;_k++){var s=o[_k];for(_j=_k-1;0<=_j&&_.p[0][s][1]<_.p[0][o[_j]][1];_j--)o[_j+1]=o[_j];o[_j+1]=s}for(_j=0;_j<_cnt;_j++)n.push(o[_j])}if(-1==t.m2.p||-2==t.m2.p&&1<=_i)break}let i=epoch(),r=!1;for(let e=0;e<n.length;e++)if(isCurrentHour(_.p[0][n[e]][0],i)){r=!0;break}return r}(c),i.st=cmd[c]?5:4,!cmd[c]&&_.s.p[0].now<=("avg"==r.m2.l?_.s.p[0].avg:r.m2.l)&&(cmd[c]=!0,i.st=6),cmd[c])&&_.s.p[0].now>("avg"==r.m2.m?_.s.p[0].avg:r.m2.m)&&(cmd[c]=!1,i.st=11):_.s.timeOK?(i.st=7,e=1<<n.getHours(),(r.b&e)==e&&(cmd[c]=!0)):(cmd[c]=1===r.e,i.st=8),_.s.timeOK&&0<r.f&&(t=1<<n.getHours(),(r.f&t)==t)&&(cmd[c]=(r.fc&t)==t,i.st=10),cmd[c]&&_.s.timeOK&&n.getMinutes()>=r.m&&(i.st=13,cmd[c]=!1),_.s.timeOK&&0<i.fCmdTs&&(0<i.fCmdTs-epoch(n)?(cmd[c]=1==i.fCmd,i.st=9):i.fCmdTs=0),"function"==typeof USER_OVERRIDE?USER_OVERRIDE(c,cmd[c],o):o(cmd[c])}catch(e){log("error running logic: "+JSON.stringify(e)),loopRunning=!1}}let _avg=999,_startIndex=0,_sum=0;log("v."+_.s.v),log("URL: http://"+(Shelly.getComponentStatus("wifi").sta_ip??"192.168.33.1")+"/script/"+Shelly.getCurrentScriptId()),_.c.i.pop(),_.si.pop();for(let e=0;e<CNST.INST_COUNT;e++)_.si.push(Object.assign({},CNST.DEF_INST_ST)),_.c.i.push(Object.assign({},CNST.DEF_CFG.INST)),_.c.c.names.push("-"),_.h.push([]),cmd.push(!1);CNST.DEF_INST_ST=null,prevEpoch=epoch(),HTTPServer.registerEndpoint("",function(n,o){try{if(loopRunning)return n=null,o.code=503,void o.send();var s=function(e){var t={},n=e.split("&");for(let e=0;e<n.length;e++){var o=n[e].split("=");t[o[0]]=o[1]}return t}(n.query),i=parseInt(s.i);n=null;let e="application/json",t=(o.code=200,!0);var r="text/html",c="text/javascript";if("s"===s.r)updateState(),0<=i&&i<CNST.INST_COUNT&&(o.body=JSON.stringify({s:_.s,si:_.si[i],c:_.c.c,ci:_.c.i[i],p:_.p})),t=!1;else if("c"===s.r)updateState(),0<=i&&i<CNST.INST_COUNT?o.body=JSON.stringify(_.c.i[i]):o.body=JSON.stringify(_.c.c),t=!1;else if("h"===s.r)0<=i&&i<CNST.INST_COUNT&&(o.body=JSON.stringify(_.h[i])),t=!1;else if("r"===s.r){if(0<=i&&i<CNST.INST_COUNT)log("config changed for #"+(i+1)),_.si[i].configOK=!1;else{log("config changed");for(let e=0;e<CNST.INST_COUNT;e++)_.si[e].configOK=!1}_.s.configOK=!1,reqLogic(),loopRunning||(loopRunning=!0,getConfig(i)),_.s.p[0].ts=0,_.s.p[1].ts=0,o.code=204,t=!1}else"f"===s.r&&s.ts?(0<=i&&i<CNST.INST_COUNT&&(_.si[i].fCmdTs=+(""+s.ts),_.si[i].fCmd=+(""+s.c),_.si[i].chkTs=0),o.code=204,t=!1):s.r?"s.js"===s.r?(o.body=atob("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"),e=c):"s.css"===s.r?(o.body=atob("H4sIAAAAAAAACpVWTW/jNhD9K4MNFki8liwl6zSh0KA9LVB0i17aS9EDRY0s1hRJkONEXsP/vSD1YTlxsO3FMMkZzpt584ZaLRawAN+gUvvEGue99LzZmoubCWoI5tfiBn7ZeS9BekNcGUigIbJstfpn2ElrCYu46dlqtZHU7MpUmHYyWF2M+f8cRjy/SoHaI4Mvv/0BP9c1OgNfUKPjCn7flUqK0QSe79IMFitYwAFK0yVefpN6w6A0rkKXlKYr4AilqfZL4HAAYZRxDK5Q1Fmdj2fBmYvtxpmdrhhc3Yo7XGcFKKkxaVBuGmKQp5+xLaA2mkIYZJClj9NOzVup9gz+RFdxzQtoeZe8yIoaBp8fXbAbVnmWfQzHbiM1gwz4jkwBlldVRL62HeSZjbivSJJCOMyDDjB6/6Q0RKaNXtFBGLs/t8/Sh2DPldzoxKOqGdQKuwR1VQBhR0k8YuBCmuGStFYdHKCS3iq+783jPvHSwwGs8ZKkCS6oOMlnLM7Ll/NSPIrJhbESa+NwOS55TegiGZpQE4MPH4pTOOKlwpnzZK2Qu8AsNeNpyFQZTgwU1j128ktImzl8bfR0XaJ4iWp+Wiojtq+Yvk1/WIeaTZxkkKe3YWdoKzfY2Q68UbKCq/yeZw/rAsTO+dBg1khN6Ka4Q6pwOO+CUyl56Y3aERbwLZG6wo5BXgAZe4ITcmSQzXDlsa/Oal/XdTF1+djHxnIhaR+dY42YaFBssfp0VpTvX9Tnf+GeeMWnV6lOYfNZVre9q7FzFjZOVkX8TQhbqzhhIozatdozyGsXRRL+RGdv9ayQ6W2swkmm/XqCGtcDT+S49pY71DSROeY4du2wTcaORy+NDMSM5PNK7jyDdSCQa9nynsGAKvexk7gDqWupo9uUpNSxy4aOO8JPW9zXjrfooc8o9AQcepC1cS0DZ4gTXt/dZxVubuAIx14eqRBPFCbXE7knqlgtnadENFJVS0jLzXIw8y2Qm5+Os+FlqFZpVFXAMzqSgqtxFJCx70u6Vl3SmsCzivrDLqmkQzGMBPMSc2uxkvx6PgQfMtvdwOHyjLoPlM2nUS/oYcpFGSQPtpv1zneaZbR8Aqap6ZO/vgvxVwv4yrdSb4AahDtXQe8MGwNkQGNHkcTFqo/RnzLIYQVJfDL62rZzBpZwVW6f3psuZ5q/6P+KoyHvQfEh71NXRvVN71s//rPZtW8Zn/vmtoNScbHtFfEfGO3zf234VMnnCegAYIBwiujDAIgDdK42xW143Md/b8tzwnwB7/yh7EkWQTOz1hE4jd5azkfux6KXcsSF4WV4cdxGw5f8IZtZPoyXt5RnJz76Cg6Pc6hGPtQrjrhg7tbzosTHPBumZavWr5kdo5RLuPKJaN+R5xGktjv6i/YWfyx3REb//fqjIA8COp5kf7jwoTJkN8rjNCJC3KmudwHU5Xr6XdtyF8T79p37F+1MBlZ6CgAA"),e="text/css"):"status"===s.r?(o.body=atob("H4sIAAAAAAAACpWSzU7DMBCEX8XKCSrl74DEwfUFTggEEk/geB3kyvYGe5OUt0f5qVugRXCxZH2zM7OWOcnGaqasjHGbOaZUJjgFwQnEvR6M0kx6YAo9BbScgBnYxhz8QbWOjvVtJZ576npiHsckVA7EI0ow/q0oiqNzVMF0ZNAnZaQU/BKm3FMbj2OiTwg6AYegE3klSUdkfIuCl/OCgoMZDlu2ds9au88dNrlCm32BpCZWMxdufgBHdZUJ3iwFIyME+cHLRvASzCD48pZzeGeqs9mnLnfLo16wWQZIrX4ndovqXGf7l84OQ8DxUu36H7V/daq/F17O2Hdis8FBh2BA83K6z0nz1JDWTvr5o4ig3x/iVUayySNJ6mOxi9k1L1f8Ce8QLX7HAgAA"),e=r):"status.js"===s.r?(o.body=atob("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"),e=c):"history"===s.r?(o.body=atob("H4sIAAAAAAAACmWNOw7CMBBEr2K5giJY6TdbUdHQcAH/AoscHLybKLk9IgSElGaKefOBQKPyyTI3uk2TatNUddlVPieN8AfFv1mtEcS6FBGkIEj4YeWuGi/UxY15HqQfZGMfI/tCvVB+gFnGXA6zotBwdSMWBLM+mUDjVz8dLPF54p0W65ZsLvPhznoPZuUvUGxSH9cAAAA="),e=r):"history.js"===s.r?(o.body=atob("H4sIAAAAAAAAClWSUW/TMBDHv4p3KsgmabZR8dLUqYAx7WFs0hqeooi57qW18OxiXzZVWb47Sgqok/xwtny/++tndxaJRVnVufYuEltLkkX3O3KI052JBCIzzmG4Kb/fSlhQKBa0YdrbuFdOzoo7z4ZrPhwW57QpFucUCujzZxWYlioenGYDcNgHeYrNKRw603B6fXWttVJGUoQiILXBsTUXuWk4kFpP//JBSqXJPGOp1mIEYqqkelGG2BbpSpHiPx5uVwksg9y9NxIS4yKNHJX5X2KYdsajVNlGkRKZRbel3cnEHm1EZhr+6WJ2JqXKtN+8SRROXUDe+MCR+YbFLPpAnFMahCxCdVFPqbqoxTGmO3qD1Ek+rEQ+jg6tilFCYwiKSdf48KSoNE/IHb6wK0XIL3H2AUdOP8p9FMnYGelgUYL21of5pMPqsl7CNiA6mEPADfQD8Xh839K+JXZ/B/P/9fU1vAEWk25Vfi6//VyVDxVWH+t6mQXcW6WRA+OtI2PZuyggBfgXJYHjU586SaTr+14r0jtOohs+lLeYYQg+cBLpqT7q+1xzkX79ssr2bdxxLfo/Hd7yEYwCAAA="),e=c):"config"===s.r?(o.body=atob("H4sIAAAAAAAACpVWbW/iOBD+K1ZOq20/hBfD7VYoWOJYeuXES1Xo9rNxBuLDsVPbCcv9+lNIAnkp3fYLQjPjZybPPOOx5/MEcX/ItjtXICaoMUPLyExRn8tdq9Xy2j5PiHcJQ8YeBQx9biJBjwOpJGTu7LBjGdo4WcxWSesa/h8Mui0MIRkv5/PlAq0m6/V08fcqh7Z0I6A4HSLGHOJZTTzrk7GKpdXH9K9nQACzaRE74qnIciVRQkUMwy0n91wKKv2qHYBMjFWS06pdJGRGbdIwWzLjNohp48Bq0iWrA/gg0c1q0une1t247MYNd6/s7jXc/bK7f+u1s08tWMipOXTvOuTnaH0ig8soPnGRUItShoc9gr4UtK01lWYLGm0BTGrofHcxHqDLMZ8ez8c8E1GZJ4k0Z+DGklvC2vuXwGunznJ/Q9vtEIzdzvcynuS7wH4KMet9+9T8un7SHO+IaLF+Ws7QH1mWVJScVFGvK6rM5USmYf6JT0E3IApa7TGCIQuA7TfqV5oAJEHLRXt5f++188ic6QUNodoQefbNlQ815YbKB1LvL1kFIMQRqdhGsTVVOBVbk/HaP8e/aG6hEn7JoFhtODpkJA70aKrWLllKlwVU7qBRzlhJq5VAIZexhVo9IZfnNodcFmemMgFtczKvsMhlcs7xF2X7OEKBinWaIHVv9mfvJAS9A8mOH+mN1teas0xAa+7nn+CDpVyYQsbiT+KZOAypPpJVoA7tgPspF7kp1xD3h9ugUJIJT8p0LrJt56BvCjlXMZmPFs+jGZovf0w+pc/lqcEfoCDsuCz0Gyy8U9Lj03Q8QbPpfLr+VEmP6TAjwUNua7LouoKHn7sArpc3fpiMHierNXpYPj/9fk2UK1zzEFAEmiu/PnvYjUDXpgP3Ce4HtdnApItrtjtyV7N8I99qlj6pI/VIr2bBpI7sdgmLjVUhuunmhdcWhIvPETiPMJclUeE6IDb9fp3O9aAg2upC89hl2YSf4GodxG5kigYOOh3koqoTSs5iwh5UrBFLl3QDjMnLPgiqNeBSEQi/UQZ+tw5cLaQBfCnqDXAmLa7Uld3A8BqDtJyK9y6wELvm9Xy7ZNcqUrIxDxl8fkLw8GPzUGwN+quFojfnrIL7QdTrC9YpEWNoAtn3bmJrL08TmgApPQAbG/r0ohstfqwaQZYV8JdnQyVDerMqzSBP5cypjKlAKr+zHeJt9G8glGSCs/3w64FLXx1aKgJ547Sd2685Zr5YX2DzPHXOT47Tr2GaR5ZoeP3H3DiWblym5JbvWv8aJx2uzP0/n5sJwx4LAAA="),e=r):"config.js"===s.r?(o.body=atob("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"),e=c):o.code=404:(o.body=atob("H4sIAAAAAAAACqVTS27bMBC9CssChY1aUrMrYpJZJAHarAoUyLagybE1MU2qnLENo+hteoZcIBcr9HFjJQ2QopuRZubNm8dHSb3xyfGhgZo3wag2imDjSkM0agNshattJmC95WXx0ShGDmC+PNxnIqSHX/X64V5VfbUfiHYDeoewb1Jm4VJkiKzlHj3X2sMOHRRdMsOIjDYU5GwAfSaN8rgTLlgizanpU/T6rzuHHjUYhxFqolGVx90xdoEggOMWipHYqNQwpih2NmxBfzCXKXJOQbw9U1UPPZlup1xqDuZdG+fiZkuE4jMltiGJibKizrDUNXND51V1h32nXKJgm1fA+tsi2Lg2Jx1VWTN9KvN4aLugJ7lRGJsti/aOdLYeU2+w7Yyxi4LY8paEq8GtwevheSQgI1SwCwhimfIIf1xQdG3ztSurqs/GGorhEjs7ikeSZ27/g+waiVM+vKzzCeCP0E99/bVKB5r/kepSXOLqZaXj/qOjwIxx9WpPe5qx0D6Sy9iwcSkSi6vrW73H6NO+DMnZ9mMuU8YVxhKjC1sPNJFtJ9SJWE7nAVh47ZPbbiDyzGWwDNcB2kyDNr4clSYwndmmgegvawy+RyySP5Qn1RaU4fsNte0fO5sF6TGL7EXL6ZxKyk5fXd9ewLm8yFq+hzJDE6yDiWwPLmdSjnZOaPpz5ugZZcC4ltO5IyozBC2JDwGoBmDZwsvuZ2wXSSodkezW9a8jekc0yJ9IKu9ITlU1ePwbJRfPYBAFAAA="),e=r);o.headers=[["Content-Type",e]],t&&o.headers.push(["Content-Encoding","gzip"])}catch(e){log("server error: "+e),o.code=500}o.send()}),Timer.set(1e4,!0,loop),loop();
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