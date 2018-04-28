/**
 * js工具类
 * @author ylg
 * @date 2017.12.5
 */

const Utils = {
    // 数组删除元素
    remove(arr, val) {
        var index = arr.indexOf(val);
        if (index > -1) {
            arr.splice(index, 1);
        }
    },
    // 转义html
    escapeHtml(html) {
        return (html == undefined || html == null || html == "") ? "" : html.replace("<=", "&le;").replace("<", "&lt;").replace(">=", "&ge;").replace(">", "&gt;").replace("</", "&lt;/").replace('"', "&quot;").replace("'", "&apos;");
    },
    //获取地址栏中的参数
    getQueryString(name) {
        const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        const search = window.location.hash.toString();
        const r =search.substr(search.indexOf('?')+1).match(reg);
        return r == null ? "" : decodeURI(r[2]);
    },
    // 日期时间格式化
    formatDateTime(val) {
        let date = "";
        if (val != undefined && val != null && val!="") {
            date = new Date(val);
        } else {
            date = new Date();
        }
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    },
    // 日期格式化
    formatDate(val) {
        let date = "";
        if (val != undefined && val != null && val!="") {
            date = new Date(val);
        } else {
            date = new Date();
        }
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
    },
    objToMap(obj) {
        let strMap = new Map();
        for (let k of Object.keys(obj)) {
            strMap.set(k, obj[k]);
        }
        return strMap;
    },
    validatorCH(rule, value, callback){
        const reg = new RegExp('[^\x00-\xff]');
        if(reg.test(value)){
            callback('error')
        }
        callback();
    }
    
}
export default Utils;