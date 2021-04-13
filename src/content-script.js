//1.项目重构
//2.取消缓存机制以及基于时间的认证方式
//3.增强稳定性
//此版本由于取消了缓存及时间验证，即每次访问moodle域名都将执行。


//入口函数
function main(){
    try {
        console.log("try")//&&&&&
        var login= new URL(document.querySelector("a[href*='login/logout.php']").href).searchParams.get("sesskey");
    }
    catch(e){
        tip("未登录");
        return;
    }
    finally{
        console.log("fina")//&&&&&
        update_linkid()
        console.log("mmmm")//&&&&&
        verify()
        console.log("nnnn")//&&&&&
    }
}

//主函数
function update_linkid(){
    var httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', 'https://moodle.telt.unsw.edu.au/search/index.php?q=Daily+Check-in', true);
    httpRequest.send();
    /**
	 * 获取数据后的处理程序 (关键字搜索)
	 */
    httpRequest.onreadystatechange = function () {
		if (httpRequest.readyState == 4 && httpRequest.status == 200) {
			var s = httpRequest.responseText;
			var n=s.indexOf("mod/questionnaire/view.php?id=");
			var end=s.indexOf("\"",n);
			var id=s.slice(n+30,end);
			console.log(n+30,end,id);
            if (id!=null){
                localStorage.setItem('link_id',id);
            }
            else{
                console.log('Func> update_linkid: ','未找到id(值为null)');
            }
            console.log('Func> update_linkid: ','当前存储，id：',localStorage.getItem('link_id'));
		}
	};
}

function verify(link_id=localStorage.getItem('link_id')){
    console.log('Func> verify: ','link id is ',link_id)
    if (link_id==null){return;} // 检查id合法性
    var httpRequest = new XMLHttpRequest(); // 建立http请求对象
    const url ='https://moodle.telt.unsw.edu.au/mod/questionnaire/view.php?id=' + link_id; // 设置打卡检查页面链接
    httpRequest.open('GET', url, true); // 初始化请求
    httpRequest.send(); // 发送请求
    /**
	 * 获取数据后的处理程序
	 */
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            var r = httpRequest.responseText;
            console.log(r)
            //获取必要参数
            //var html = httpRequest.responseText;

            //BEGIN
            if (r.indexOf("You have already filled out this questionnaire for us today") != -1) {
                tip("今日已打卡")
            }
            else if (r.indexOf("Answer the questions") != -1){ 
                tip("未打卡，现在开始打卡...")
                get_para(); // 打卡
            }
            else{
                console.log('Func> verify: ','未知错误，为避免占用，不再继续执行');
                tip("未知错误");
            }
        }
    }
}

function get_para(){
    var link_id=localStorage.getItem('link_id')
    var httpRequest = new XMLHttpRequest(); // 建立http请求对象
    var url= 'https://moodle.telt.unsw.edu.au/mod/questionnaire/complete.php?id='+link_id; // 设置打卡页面链接
    httpRequest.open('GET', url, true); // 初始化请求
    httpRequest.send(); // 发送请求
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            var r = httpRequest.responseText;
            var com= document.implementation.createHTMLDocument('');
            com.documentElement.innerHTML = r;
            var referer=com.getElementsByName("referer")[0].value
            var a=com.getElementsByName("a")[0].value
            var sid=com.getElementsByName("sid")[0].value
            var rid=com.getElementsByName("rid")[0].value
            var sec=com.getElementsByName("sec")[0].value
            var sesskey=com.getElementsByName("sesskey")[0].value
            var q=com.getElementById("auto-rb0001").name
            console.log((referer,a,sid,rid,sec,sesskey,q))
            check_in_now(referer,a,sid,rid,sec,sesskey,q)
        }
    }
}

function check_in_now(referer,a,sid,rid,sec,sesskey,q){
    var link_id=localStorage.getItem('link_id')
    //const sesskey = new URL(document.querySelector("a[href*='login/logout.php']").href).searchParams.get("sesskey");
    console.log('Func> check_in_now ','link id is ',link_id);
    console.log('Func> check_in_now ','sesskey id is ',sesskey);
    var httpRequest = new XMLHttpRequest(); // 建立http请求对象
    var url= 'https://moodle.telt.unsw.edu.au/mod/questionnaire/complete.php?id='+link_id; // 设置打卡页面链接
    httpRequest.open('POST', url, true); // 初始化请求
    httpRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded"); // 设置请求头 注：post方式必须设置请求头
    httpRequest.send('referer='+referer+'&a='+a+'&sid='+sid+'&rid='+rid+'&sec='+sec+'&sesskey='+sesskey+'&'+q+'=y&submittype=Submit+Survey&submit=Submit+questionnaire'); // 发送请求 将情头体写在send中
    /**
	 * 获取数据后的处理程序
	 */
    httpRequest.onreadystatechange = function () {//请求后的回调接口，可将请求成功后要执行的程序写在其中
		if (httpRequest.readyState == 4 && httpRequest.status == 200) {//验证请求是否发送成功
			var r = httpRequest.responseText;//获取到服务端返回的数据
			console.log(r);
		}
        else{
            console.log('Func> check_in_now ','出错！ 代码：',httpRequest.status);
        }
    };
}

//功能函数
//消息通知
var tipCount = 0;
function tip(info) {
	info = info || '';
	var ele = document.createElement('div');
	ele.className = 'unsw-moodle-assistant-tip';
	ele.style.top = tipCount * 70 + 20 + 'px';
    ele.style.zIndex = 100000
	ele.innerHTML = `<div>${info}</div>`;
    var first=document.body.firstChild; //得到第一个元素
    document.body.insertBefore(ele,first); //在第原来的第一个元素之前插入
	//document.body.appendChild(ele);
	ele.classList.add('animated');
	tipCount++;
	setTimeout(() => {
		ele.style.top = '-100px';
		setTimeout(() => {
			ele.remove();
			tipCount--;
		}, 400);
	}, 3000);
}

//
main()