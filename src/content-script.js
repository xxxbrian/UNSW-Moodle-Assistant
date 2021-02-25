function update_tomorrow(){
    var day = new Date();
    var time = new Date();
    day.setDate(day.getDate() + 1);
    day.setHours(0);
    day.setMinutes(0);
    day.setSeconds(0);
    day.setMilliseconds(0);
    localStorage.setItem('tomorrow',day.getTime());
    console.log('tomorrow is',day);
}

function update_verify_time(){
    var day = new Date();
    localStorage.setItem('last_verify_time',day.getTime());
    console.log('last verify time is ',day);
}

function getWeekOfYear(){
	var today = new Date();
	var firstDay = new Date(today.getFullYear(),0, 1);
	var dayOfWeek = firstDay.getDay(); 
	var spendDay= 1;
	if (dayOfWeek !=0) {
	  spendDay=7-dayOfWeek+1;
	}
	firstDay = new Date(today.getFullYear(),0, 1+spendDay);
	var d =Math.ceil((today.valueOf()- firstDay.valueOf())/ 86400000);
	var result =Math.ceil(d/7);
	return result+1;
}

function check_in_now(link_id=localStorage.getItem('link_id')){
    const sesskey = new URL(document.querySelector("a[href*='login/logout.php']").href).searchParams.get("sesskey");
    console.log('Func> check_in_now ','link id is ',link_id);
    console.log('Func> check_in_now ','sesskey id is ',sesskey);
    var httpRequest = new XMLHttpRequest(); // 建立http请求对象
    var url= 'https://moodle.telt.unsw.edu.au/mod/questionnaire/complete.php?id='+link_id; // 设置打卡页面链接
    httpRequest.open('POST', url, true); // 初始化请求
    httpRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded"); // 设置请求头 注：post方式必须设置请求头
    httpRequest.send('referer=&a=12938&sid=12813&rid=0&sec=1&sesskey='+sesskey+'&q135490=y&submittype=Submit+Survey&submit=Submit+questionnaire'); // 发送请求 将情头体写在send中
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
            //console.log('Func> check_in_now ','重试');
            //check_in_now() // 无限尝试
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
            if (r.indexOf("You have already filled out this questionnaire for us today") != -1) {
                console.log("已打卡,更新日志...");
                tip("今日已打卡")
                //chrome.browserAction.setBadgeText({text: 'OK'});
                //chrome.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 255]});
                update_verify_time(); // 更新最后验证时间
                update_tomorrow(); // 更新下次打卡时间
            }
            else if (r.indexOf("Answer the questions") != -1){ 
                console.log("未打卡，现在开始打卡...");
                tip("未打卡，现在开始打卡...")
                check_in_now(); // 打卡
            }
            else{
                console.log('Func> verify: ','未知错误，为避免占用，不再继续执行');
                tip("未知错误");
            }
        }
    }
}

function update_linkid(){
    console.log('Func> update_linkid: ','开始查询link_id');
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
                console.log('Func> update_linkid: ','正在存储，id：',id);
                localStorage.setItem('link_id',id);
                tip('new link_id：',localStorage.getItem('link_id'))
                const week=getWeekOfYear();
                console.log('Func> update_linkid: ','更新week，week：',week);
                localStorage.setItem('id_week',week);
            }
            else{
                console.log('Func> update_linkid: ','未找到id(值为null)');
                //console.log('Func> update_linkid: ','重试');
                //update_linkid(); // 无限重试
            }
            console.log('Func> update_linkid: ','当前存储，id：',localStorage.getItem('link_id'));
		}
        else {
            console.log('Func> update_linkid: ','出错！ 代码：',httpRequest.status);
            //console.log('Func> update_linkid: ','重试');
            //update_linkid(); // 无限重试
        }
	};
}

var tipCount = 0;
// 简单的消息通知
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

const now_week=getWeekOfYear();
if (((localStorage.getItem('tomorrow')-localStorage.getItem('last_verify_time'))<0) || (localStorage.getItem('tomorrow')==null)){
    tip('new day!')
    if (localStorage.getItem('id_week')!=now_week){
        console.log('本周第一次运行，检查并更新link_id');
        tip('本周第一次运行，更新link_id');
        update_linkid();
    }
    verify();
}
else{
    tip('不要担心，今日已打卡')
}
