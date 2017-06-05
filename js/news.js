$(window).scroll(function() {
    var scroll = $(window).scrollTop();
    var padding = scroll > 30 ? 0 : 30 - scroll;
    $(".timeline-progress ul").css("padding-top", padding);
})

var LOGIN = false,
    USERID = '',
    USERNAME = '',
    EMAIL = '';

function test() {
    toggleFixedLoading(".content-loading");
    setTimeout(showPage, 1000);
}

function showPage() {
    toggleFixedLoading(".content-loading");
    $(".content").css("visibility", "visible");

    $(".hello-msg").show();

    var hash = window.location.hash;
    window.location.hash = "";
    window.location.hash = hash;
}

$(function() {
    // Show loading spinner
    toggleFixedLoading(".loading");

    initDB();

    $('body').scrollspy({ target: ".timeline-progress", offset: 200 });

    // $('.timeline-progress').scrollspy({
    //     offset: 500
    // });

    var aver_bandwidth = [
        ["세종관", 61, 15.9, 13.6, "wGcNI2L"],
        ["희망관", 41, 34.3, 50.9, "9BaU2z5"],
        ["아름관", 26, 39.0, 45.8, "Q0b0V2W"],
        ["갈릴레이관", 14, 12.4, 15.7, "imZl4og"],
        ["미르관", 13, 12.8, 6.2, "LLJqfXf"]
    ];

    /* Overall stat */
    for (var b in aver_bandwidth) {
        var item = aver_bandwidth[b];

        $(".overall-stat tbody").append(
            '<tr onclick="handleOutboundLinkClicks(this)" href="./timeline.html?id=' + item[4] + '"' + '>\
            <td>' + item[0] + '</td>\
            <td>' + item[1] + '</td>\
            <td>' + item[2] + '</td>\
            <td>' + item[3] + '</td>\
          </tr>'
        );
    }

    $('[data-spy="scroll"]').each(function() {
        var $spy = $(this).scrollspy('refresh')
            // alert();
    })

    $('body').on('activate.bs.scrollspy', function() {
        // do something…
        // console.log("test");
    })

    $(".timeline-progress a").on('click', function(event) {
        // Make sure this.hash has a value before overriding default behavior
        if (this.hash !== "") {
            // Prevent default anchor click behavior
            event.preventDefault();

            // Store hash
            var hash = this.hash;

            // Using jQuery's animate() method to add smooth page scroll
            // The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area
            $('html, body').animate({
                scrollTop: $(hash).offset().top
            }, 800, function() {
                // Add hash (#) to URL when done scrolling (default click behavior)
                window.location.hash = hash;
            });

        } // End if

    });

    // fb share button listener
    $(".fb-share").click(function() {
        window.open(
            "http://www.facebook.com/sharer/sharer.php?u=" + (window.location.origin + window.location.pathname) + "&sharing=true"
        );
    })
    $(".link-share").click(function() {
        var share_url = window.location.origin + window.location.pathname;

        /* iOS case (it does not support clipboard copy) */
        if (detectOS() == "ios") {
            $("#ios-url").val(share_url);
            $('#ios-prompt-modal').modal();
            setTimeout(function() {
                $("#ios-url").select();
            }, 500);
            return;
        }

        var $temp = $("<input>");
        $("body").append($temp);
        $temp.val(share_url).select();
        document.execCommand("copy");
        $temp.remove();
        var alert = '<div id="clip-alert" class="alert alert-warning alert-dismissible ' +
            'col-lg-4 col-lg-offset-4 col-md-4 col-md-offset-4 col-xs-10 col-xs-offset-1" role="alert">' +
            '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
            '<span aria-hidden="true">&times;</span>' +
            '</button>클립보드에 복사되었습니다</div>'
        var a_div = document.createElement("div");
        a_div.innerHTML = alert;
        $("body").append(a_div);
        setTimeout(function() {
            $("#clip-alert").fadeOut("normal", function() {
                $(this).remove();
            });
        }, 1000);
    })

    drawBarChart();

    // Check whether the user is authenticated at firebase
    var user = firebase.auth().currentUser;
    if (!user) {
        firebase.auth().signInAnonymously().then(function(user) {
            setFirebaseID(user.uid)
        });
    } else setFirebaseID(user.uid);
    /* Flow: fb sdk install -> check login status -> fetch comments from DB then append and bind events */
});

function displayBldgList() {
    toggleFixedLoading(".locaiton-loader");
    // Try HTML5 geolocation.
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
                center = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // DEBUGGING purpose
                // center = {
                //     "lat": 36.374,
                //     "lng": 127.3655
                // };

                // center = {
                //     "lat": 36.374,
                //     "lng": 127.360
                // };

                fetchBldgList(center);

            },
            function() { //error callback
                console.log("Error geolocation");
                // alert('브라우저의 위치정보 수집이 불가합니다. 설정에서 승인 후 다시 시도해주세요.');
                $("#loc-msg").text("위치 검색이 불가해 자동으로 현재 건물을 찾을 수 없습니다. 현재 위치한 건물을 선택해주세요.");
                fetchBldgList();
                // handleLocationError(true, infoWindow, map.getCenter());
            }, {
                timeout: 10000
            });


    } else {
        // Browser doesn't support Geolocation
        console.log("Error geolocation; brower doesn't support");
        // alert('브라우저의 위치정보 수집이 불가합니다. 다른 브라우저에서 다시 시도해주세요.');
        $("#loc-msg").text("위치 검색이 불가해 자동으로 현재 건물을 찾을 수 없습니다. 현재 위치한 건물을 선택해주세요.");

        fetchBldgList();
        // handleLocationError(false, infoWindow, map.getCenter());
    }
}

/* Should call this function every time new comments appended. */
function prettifyTweet(inSelector) {
    tweetParser(inSelector, {
        urlClass: "tweet_link", //this is default
        userClass: "tweet_user",
        hashtagClass: "tweet_hashtag", //this is default
        target: "_blank", //this is default
        searchWithHashtags: false, //this is default
        parseUsers: true,
        parseHashtags: true,
        parseUrls: true
    });
}

function fetchBldgList(inCenter) {
    function nextChar(c) {
        return String.fromCharCode(c.charCodeAt(0) + 1);
    }

    var list = [],
        cnt = 0,
        alphabet = 'A';

    var bldgRef = firebase.database().ref("bldg/");
    // Attach an asynchronous callback to read the data at our posts reference
    bldgRef.once("value").then(function(snapshot) {
        BLDG = snapshot.val();

        for (var l in BLDG) {
            if (center) {
                if (Math.abs(center.lat - BLDG[l].lat) < 0.001 && Math.abs(center.lng - BLDG[l].lng) < 0.001) {
                    $('.building-list-ul').append(
                        '<li bldg=' + l + '><a>' + alphabet + '. ' + BLDG[l].name + '</a></li>');

                    list.push({ "lat": BLDG[l].lat, "lng": BLDG[l].lng, label: alphabet, name: BLDG[l].name });

                    alphabet = nextChar(alphabet);
                }
            }

        }

        if (list.length == 0)
            for (var l in BLDG) {
                $('.building-list-ul').append(
                    '<li bldg=' + l + '><a>' + alphabet + '. ' + BLDG[l].name + '</a></li>');


                list.push({ "lat": BLDG[l].lat, "lng": BLDG[l].lng, label: alphabet, name: BLDG[l].name });

                alphabet = nextChar(alphabet);
            }

        toggleFixedLoading(".locaiton-loader");
    });
}

function fetchComments() {
    var commentsRef = firebase.database().ref('news/comments');
    commentsRef.once("value").then(function(snapshot) {
        var news_json = snapshot.val(); // data is here
        append_nested_comment("nested-comment", news_json);

        if (getLogin())
            fetchUserLog();

        /* Styling for hash,@,url */
        prettifyTweet('.tweet p');

        /* Suggest login when the user attempts to vote before */
        if (!getLogin())
            init_popover($(".tweet .fa-chevron-up"));

        toggleFixedLoading(".loading");
    });
}

function fetchUserLog() {
    var userRef = firebase.database().ref('news/like/' + USERID);
    userRef.once("value").then(function(snapshot) {
        var user_json = snapshot.val(); // data is here

        for (var l in user_json) {
            $(".comment-" + l + " .fa-chevron-up").addClass("active");
        }
    });
}

function fetchReport() {
    var report_display = $(".report-display");
    var recent_report = report_display.find('.recent-report');
    $('.recent-report .radio').remove();

    var uRef = firebase.database().ref("users/" + [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()].join("-"));
    uRef.once("value").then(function(snapshot) {
        var report = snapshot.val(); // bldg/activity/OS/ping/down/up

        if (!report) { // no recent report
            var answer = confirm("오늘 인터넷 불편 제보가 없습니다. 지금 제보(1분)하러 가시겠어요?")
            if (answer)
                window.location = "./collect.html";

            else return;
        }

        var report_radio = "";
        for (var r in report) {
            var report_txt;
            if (report[r].activity) {
                report_txt = [BLDG[report[r].bldg].name, report[r].activity, report[r].download + "Mbps", report[r].upload + "Mbps"].join(", ");
                report_radio += ("<div class='radio'><label><input type='radio' name='report-radio' " + "value='" + report_txt + "'/> " + '<i class="fa fa-building-o" aria-hidden="true"></i> ' + report_txt + "</label></div>");
            } else {
                report_txt = [BLDG[report[r].bldg].name, "연결불능", report[r].os, report[r].web].join(", ");
                report_radio += ("<div class='radio'><label><input type='radio' name='report-radio' " + "value='" + report_txt + "'/> " + '<i class="fa fa-building-o" aria-hidden="true"></i> ' + report_txt + "</label></div>");
            }
        }

        recent_report.append(report_radio);


    });
}

function handleOutboundLinkClicks(event) {
    ga('send', 'event', 'news', 'click', event.getAttribute("href"), {
        'transport': 'beacon',
        'hitCallback': function() {
            document.location = event.getAttribute("href");
        }
    });
}

function countLetter(inElement) {
    var postLength = detectBrowser() == 'ie' ? inElement.textContent.length : inElement.textLength;
    var charactersLeft = 140 - postLength;
    inElement.getElementsByClassName("status-box");

    inElement.parentElement.parentElement.parentElement.getElementsByClassName("counter")[0].innerHTML = charactersLeft;

    if (charactersLeft < 0) {
        inElement.parentElement.parentElement.parentElement.getElementsByClassName("comments-post")[0].classList += " disabled";
    } else if (charactersLeft == 140) {
        inElement.parentElement.parentElement.parentElement.getElementsByClassName("comments-post")[0].classList += " disabled";
    } else {
        inElement.parentElement.parentElement.parentElement.getElementsByClassName("comments-post")[0].classList.remove("disabled");
    }
}

function getLogin() { return LOGIN; }

function setLogin(inVal) { LOGIN = inVal; }

function getFirebaseID() {
    if (firebase.auth().currentUser.uid) return firebase.auth().currentUser.uid;
    return null;
}

function setFirebaseID(inID) {
    FIREBASE_ID = inID;
}

// This function is called when someone finishes with the Login
// Button.  See the onlogin handler attached to it in the sample
// code below.
function checkLoginState() {
    if (detectBrowser() == 'firefox') {
        var request = indexedDB.open("MyTestDatabase");
        request.onerror = function(event) {
            //private Mode
            alert("현재 웹 브라우저가 프라이빗 모드로 되어있어 포럼 참여 기능에 제약이 있을 수 있습니다. ");

            //turn off loader
            toggleFixedLoading(".loading");

            $("#nested-comment").append("<li style='color:red;'>파이어폭스 프라이빗 모드에선 포럼 참여 기능이 지원되지 않습니다.</li>");
        };
    }

    FB.getLoginStatus(function(response) {
        checkLoginStateCallback(response);
    });
}

// This is called to get fb Login Status.
function checkLoginStateCallback(response) {
    console.log('statusChangeCallback');
    // The response object is returned with a status field that lets the
    // app know the current login status of the person.
    // Full docs on the response object can be found in the documentation
    // for FB.getLoginStatus().
    if (response.status === 'connected') {
        // Logged into your app and Facebook.
        setLogin(true);
        FB.api('/me', {
            locale: 'en_US',
            fields: 'email,name'
        }, function(response) {
            console.log('Successful login for: ' + response.name);
            USERID = response.id;
            USERNAME = response.name;
            EMAIL = response.email;

            init_comments();
        });
    } else {
        setLogin(false);
        init_comments();
    }
}

function add_reply(clicked_reply) {
    $("#like").remove();
    var $reply_html = $(get_reply_html());
    $media_body = $(clicked_reply).parent();
    $media_body.append($reply_html);

    //Suggest login only when the user is not currently logged in
    if (!getLogin())
        init_popover($reply_html.find(".comments-post"));
}

function add_root_reply() {
    $("#like").remove();
    var $reply_html = $(get_reply_html(1));
    $reply_html.attr("id", "root-like");
    $("#nested-comment").after($reply_html);

    //Suggest login only when the user is not currently logged in
    if (!getLogin())
        init_popover($reply_html.find(".comments-post"));
}

function init_popover($x) {
    var popover_html =
        '<a href="javascript:void(0);" onclick="fbLogin()"><i class="fa fa-facebook-square fa-2x" aria-hidden="true"></i></a>'
        /*+
                '<i class="fa fa-google fa-2x" aria-hidden="true"></i>' +
                '<i class="fa fa-twitter fa-2x" aria-hidden="true"></i>' */

    $x.popover({
        html: true,
        content: popover_html,
        title: '로그인',
        delay: { show: 0, hide: 250 },
    });
}

function init_comments() {
    fetchComments();

    /* Bind reply-addition event */
    add_root_reply();
    $("body").on("click", ".fa-reply", function() {
        add_reply(this);
    });
    $(".content").click(function(e) {
        if ($(e.target).parents("#like").length == 0 &&
            !$(e.target).is("#like")) {
            $("#like").remove();
        }
    });

    /* Bind like(vote) event */
    $("body").on("click", ".fa.fa-chevron-up", function() {
        if (!getLogin()) return;

        var like_num = 0;
        /* If it's alreay up voted, cancel and decrement the vote. */
        if ($(this).hasClass("active")) { // cancel vote
            /* dehighlight color */
            $(this).removeClass("active");

            /* decrement */
            $(this).text(parseInt($(this).text().replace(" ", "")) - 1);

            like_num = -1;
        } else { // up vote
            /* highlight color */
            $(this).addClass("active");

            /* increment */
            $(this).text(parseInt($(this).text().replace(" ", "")) + 1);

            like_num = 1;
        }

        var parent_id,
            comment_id;

        // if the comment is root
        if ($(this).parent().parent().attr("id").split("_").length == 2) parent_id = '', comment_id = $(this).parent().parent().attr("id").split("_")[1];
        else parent_id = $(this).parent().parent().attr("id").split("_")[1],
            comment_id = $(this).parent().parent().attr("id").split("_")[2];

        // Check whether the user is authenticated at firebase
        var user = firebase.auth().currentUser;
        if (!user) {
            firebase.auth().signInAnonymously().then(function(user) {
                postVote(comment_id, parent_id, like_num);
            });
        } else postVote(comment_id, parent_id, like_num);

    });

    /* Bind seemore event */
    $("body").on("click", ".seemore-btn", function() {
        var media_body_id = $(this).attr("id").replace("seemore-", "");
        $("#" + media_body_id).find(".media").show();
        $(this).remove();
    })

    /* Bind comment category event */
    $('a[data-toggle="pill"]').on('shown.bs.tab', function(e) {
        var target = $(e.target).attr("value") // activated tab

        //if all panel is on
        if (!target)
            $("#nested-comment>.media").show();
        else {
            $(".media").hide();
            $("#nested-comment>.comment-" + target).show();
        }

    });

    $("body").on("click", ".comment-add-report", function() {
        // Remove other element before add new one. 
        $('.recent-report').remove();

        var report_display = $(this).parent().find(".report-display");

        if (report_display.find("div").length) return;

        report_display.append('<div class="recent-report"></div>');
        var recent_report = report_display.find('.recent-report');

        // add close button
        recent_report.append('<button onclick="this.parentElement.remove()" type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>');

        // add navbar for report search
        recent_report.append('<nav class="navbar navbar-default">' +
            '<div class="container-fluid">' +
            '<div class="navbar-header"><a class="navbar-brand">제보 검색</a>' +
            '</div>' +
            '<ul class="nav navbar-nav">' +
            '<li class="dropdown">' +
            '<a class="dropdown-toggle" data-toggle="dropdown" href="#">건물 검색' +
            '<span class="caret"></span></a>' +
            '<ul class="dropdown-menu building-list-ul">' +
            '<li><a onclick="displayBldgList()">내 건물 검색<div style="color: gray"><i class="fa fa-map-marker" aria-hidden="true"></i> 위치정보 수집</div><p id="loc-msg"></p></a></li>' +
            '</ul>' +
            '</li>' +
            '<li class="dropdown">' +
            '<a class="dropdown-toggle" data-toggle="dropdown" href="#">날짜 검색' +
            '<span class="caret"></span></a>' +
            '<ul class="dropdown-menu">' +
            '<li><a href="#">Page 1-1</a></li>' +
            '<li><a href="#">Page 1-2</a></li>' +
            '<li><a href="#">Page 1-3</a></li>' +
            '</ul>' +
            '</li>' +
            '</ul>' +
            '<ul class="nav navbar-nav navbar-right">' +
            '<li><a onclick="fetchReport()"><i class="fa fa-search" aria-hidden="true"></i>검색</a></li>' +
            '</ul>' +
            '</div>' +
            '</nav>');
        // add current location search button
        recent_report.append("<div class='locaiton-loader' style='left:50%;'></div>");

        // add building list table
        // recent_report.append('<div class="building-list-container"><table class="building-list table table-hover"><tbody></tbody></table></div>');

    });

    /* Bind report search pick. */
    $("body").on("click", ".dropdown-menu li a", function(e) {
        if ($(this).parent().attr('bldg')) { // if the user select a building
            $(this).parents(".dropdown").find('.dropdown-toggle')
                .html($(this).text() + ' <span class="caret"></span>');
            $(this).parents(".dropdown").find('.dropdown-toggle')
                .val($(this).data('value'));
        } else { // if user selects search
            e.stopPropagation(); // prevent dropdown to be closed. 
        }

    });
}

function postVote(inCommentID, inParentID, inLikeNum) { // inLikeNum 1 when upvote, -1 when down vote
    var pRef = firebase.database().ref("news/comments/" + (inParentID ? inParentID + "/comments/" + inCommentID : inCommentID) + "/like");
    pRef.transaction(function(searches) {
        return (searches || 0) + inLikeNum;
    });

    var uRef = firebase.database().ref("news/like/" + (USERID ? USERID : firebase.auth().currentUser.uid) + "/" + inCommentID);
    if (inLikeNum == 1)
        uRef.set(true,
            function(error) {
                if (error) {
                    console.log(error);
                } else { // if successfully posted a new comments clear textarea and turn off loading spinner. 

                }
            });

    else uRef.remove();
}

/* post a new comment to DB. */
function postComment(inElement) {
    if (!getLogin()) return; // check fb authentication

    postCommentCallback(inElement);
}

function postCommentCallback(inElement) {
    // turn on loading spinner. 
    toggleFixedLoading(".loading");

    var new_comment_elem = inElement.parentElement.parentElement,
        content = new_comment_elem.getElementsByClassName("status-box")[0].value,
        parent_id = '',
        comment_type;

    // append report if existg
    if (new_comment_elem.querySelector("input[name='report-radio']:checked"))
        content = "<strong>" + new_comment_elem.querySelector("input[name='report-radio']:checked").value + "</strong> " + content;

    // if a new comment is not root comment
    if (new_comment_elem.id != "root-like") {
        parent_id = new_comment_elem.parentElement.id.split("comment_")[1];
        comment_type = 2;
    } else comment_type = new_comment_elem.querySelector("input[name='comment-type']:checked").value;

    var comment_key = generateID(8);
    /* UID for a new comments. */
    var playersRef = firebase.database().ref("news/comments/" + (parent_id ? parent_id + "/comments/" : "") + comment_key);
    var news_json = {
        "type": comment_type,
        "content": content,
        "time": new Date().toString(),
        "email": EMAIL + "/rally/" + USERNAME,
        "like": 0,
        "dislike": 0
    };

    /* Append at front */
    var root_id = "nested-comment"
    var parent_id = (parent_id == '') ? root_id : root_id + "_" + parent_id;
    append_comment_html(parent_id, comment_key, news_json, true);

    prettifyTweet(".comment-" + comment_key + " p");

    console.log(USERNAME, EMAIL, content);
    playersRef.set(news_json, function(error) {
        if (error) {
            console.log(error);
        } else {
            // if successfully posted a new comments clear textarea and turn off loading spinner. 
            new_comment_elem.getElementsByClassName("status-box")[0].value = "";
            toggleFixedLoading(".loading");
        }
    });
}

function get_reply_html(type) {

    var reply_html =
        '<div id="like">' +
        (type == 1 ? // add comment radio only for root comment
            ('<form class="form-inline"><div class="form-group">' +
                '<label class="radio-inline">' +
                '<input type="radio" value="0" name="comment-type" id="comment-question" value="comment-question" checked> 질문' +
                '</label>' +
                '<label class="radio-inline">' +
                '<input type="radio" value="1" name="comment-type" id="comment-suggestion" value="comment-suggestion"> 제안' +
                '</label>' +
                '<label class="radio-inline">' +
                '<input type="radio" value="2" name="comment-type" id="comment-else" value="comment-else"> 그 외' +
                '</label>' +
                '</div></form>') : "") +
        '<form style="margin-top: 10px;">' +
        // '<span class="form-inline">' +
        // '<label for="comment-to"><i class="fa fa-paper-plane-o" aria-hidden="true"></i></label>' +
        // '<input type="text" class="form-control" id="comment-to" placeholder="아무나">' +
        // '</span>' +
        '<p class="comment-add-report">+ 최근 제보 인용하기</p>' +
        '<div class="report-display"></div>' +
        '<div class="form-group">' +
        '<textarea class="form-control status-box" onkeyup="countLetter(this)" rows="2"></textarea>' +
        '</div>' +
        '</form>' +
        '<div class="button-group" style="text-align:right">' +
        '<p class="counter">140</p>' +
        '<a class="btn btn-primary comments-post like-comment disabled" onclick="postComment(this)" tabindex="0" data-container="body" ' +
        'data-toggle="popover" data-trigger="focus" data-placement="top">Post</a>' +
        '</div>' +
        '</div>';

    return reply_html;
}

/* @param {string} nc_id - id of root node. must be <ul>
@param {object} news_json - object from database
Traverse news_json and append recursively comments
which has "content" key */
function append_nested_comment(nc_id, news_json) {

    /* Allow only one nested comment */
    var depth = nc_id.split("_").length - 1;
    if (depth >= 2) {
        return;
    }

    /* deep copy */
    var c_news_json = $.extend(true, {}, news_json);

    /* sort by time.  */
    var keysSorted = Object.keys(c_news_json).sort(function(a, b) {
        return new Date(c_news_json[a].time) - new Date(c_news_json[b].time);
    })

    /* traversal */
    for (var i in keysSorted) {
        var key = keysSorted[i];
        /* if is_comment: append comment */
        if (is_key(c_news_json[key], "content")) {
            append_comment_html(nc_id, key, c_news_json[key], false);
        }
        /* if is_leaf: break; */
        if (typeof(c_news_json[key]) != "object") {
            break;
        }
        /* Recursive call to child json */
        var parent_id = (key != "comments") ? nc_id + "_" + key : nc_id;
        append_nested_comment(parent_id, c_news_json[key])
    }
}

function append_comment_html(parent_id, cid, news_json, visible) {
    var c_news_json = $.extend(true, {}, news_json);
    var new_id = parent_id + "_" + cid;
    var $parent = $(document.getElementById(parent_id));

    var icon = get_comment_icon(c_news_json.type);
    var title = (c_news_json.email.indexOf("jrburuter") != -1 || c_news_json.email.indexOf("kaistusc") != -1) ? "학부총학생회" : c_news_json.email.substring(0, 3) + "****";
    var content = c_news_json.content;

    /* Build comment html */
    var html =
        '<li class="media comment-' + getClassPostfix(c_news_json.type) + (c_news_json.email.indexOf("jrburuter") != -1 || c_news_json.email.indexOf("kaistusc") != -1 ? " media-emphasized" : "") + ' ">' +
        '<div class="media-left">' +
        '<i class="fa fa-2x ' + icon + '" aria-hidden="true"></i>' +
        '</div>' +
        '<div class="media-body" id=' + new_id + '>' +
        '<p class="media-heading">' +
        title +
        '<span class="comment-date"> · ' +
        c_news_json.time.split(" GMT")[0] +
        '</span>' +
        '</p>' +
        '<div id=' + 'comment-' + new_id + ' class=' + '"tweet comment-' + cid + '">' +
        '<p>' + content + '</p>' +
        '<i class="fa fa-reply" aria-hidden="true"></i>' +
        '<i class="fa fa-chevron-up" aria-hidden="true" tabindex="0" ' +
        'data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top">' +
        c_news_json.like +
        '</i>' +
        '</div>' +
        '</div>' +
        '</li>';
    var $html = $(html);

    /* Append html */
    if (is_key(c_news_json, "comments") &&
        $parent.is("ul") /*is root*/ ) {
        var see_more_html =
            '<p class="seemore-btn" id="seemore-' + new_id + '">' +
            '<i class="fa fa-caret-down" aria-hidden="true"></i>' +
            ' 답글 더 보기' +
            '</p>';
        $html.find(".media-body").append($(see_more_html));
    } else if (!$parent.is("ul")) {
        /* Del reply btn at nested comment */
        $html.find(".fa-reply").remove();
        if (!visible) {
            $html.hide();
        }
    }
    $parent.append($html);

}

function get_comment_icon(type) {
    var icon;
    if (type == 0) {
        icon = "fa-lightbulb-o"
    } else if (type == 1) {
        icon = "fa-question"
    } else {
        icon = "fa-comment-o"
    }
    return icon;
}

function getClassPostfix(type) {
    if (type == 0) {
        return "suggest"
    } else if (type == 1) {
        return "question"
    } else {
        return "comment"
    }
}

function is_key(obj, key) {
    /* if is_leaf: break; */
    if (typeof(obj) == "object") return (Object.keys(obj).indexOf(key.toString()) !== -1);

    return false;
}