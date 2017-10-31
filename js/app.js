function signOut() {
    // sign out from firebase auth
    firebase.auth().signOut();
}

function app() {
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyBmCjNVn97PxEFbrnaLQAxwx8FiEQQ77t4",
        authDomain: "versutianpolls.firebaseapp.com",
        databaseURL: "https://versutianpolls.firebaseio.com",
        projectId: "versutianpolls",
        storageBucket: "versutianpolls.appspot.com",
        messagingSenderId: "123573167787"
    };
    firebase.initializeApp(config);

    // user's nation display name
    var nationName = "Unknown Nation";
    // user's nation flag image URL
    var yourNationFlag = "https://www.nationstates.net/images/flags/Default.png";
    // lowercase name with underscores, for database and internal logic
    var internalName;
    var verificationCode;
    // Map(string:nation, Map(string:key, string:value))
    var nationCache = new Map();
    // cloud firestore
    var db = firebase.firestore();
    // main content
    var content = document.getElementById('content');

    // https://stackoverflow.com/a/37510735
    function getPropertyValue(object, property) {
        return property
          .split('.') // split string based on
          .reduce(function(o, k) {
            return o && o[k]; // get inner property if `o` is defined else get `o` and return
          }, object); // set initial value as object
      }

    function request(url, callback, xml) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            // check if we are on NS API cooldown
            if (url.startsWith('https://www.nationstates.net/cgi-bin/api.cgi?nation=')) {
                // notify the user that they're on API cooldown
                if (xhr.status === 429) {
                    // notify the user once
                    if (!nsBan) {
                        alert('You have been banned for ' + xhr.getResponseHeader('x-retry-after') + ' seconds by the NationStates API');
                        nsBan = true;
                    }
                    // don't callback, we didn't data
                    return;
                } else {
                    // reset ban notification tracker
                    nsBan = false;
                }
            }
            // give our callback XML if it requested it
            callback(xml ? xhr.responseXML : xhr.responseText);
        };
        xhr.open("GET", url);
        xhr.send();
    }

    function nsNation(nation, data, callback) {
        // check if we have a cache entry for this nation at all
        if (!nationCache.has(nation)) {
            nationCache.set(nation, new Map());
        }
        // get the cache map for this nation
        var nationData = nationCache.get(nation);
        // check data that has been cached and skip getting it from the API
        var requestString = "";
        var requests = [];
        for (var i = 0; i < data.length; i++) {
            if (!nationData.has(data[i]) || nationData.get(data[i]).length === 0) {
                requests.push(data[i]);
                if (requestString.length === 0) {
                    requestString = data[i];
                } else {
                    requestString += "+" + data[i];
                }
            }
        }
        // check if we have data to get from the API
        if (requestString.length !== 0) {
            // request the data
            request("https://www.nationstates.net/cgi-bin/api.cgi?nation=" + nation + "&q=" + requestString, function(nationRes) {
                for (var i = 0; i < requests.length; i++) {
                    // check if we got data from the API
                    if (nationRes === null) {
                        // blank data since callbacks expect non-null
                        nationData.set(request[i], "");
                    } else {
                        // cache data we got from the API
                        nationData.set(requests[i], nationRes.getElementsByTagName(requests[i].toUpperCase()).item(0).textContent);
                    }
                }
                // give freshly cached data to the callback
                callback(nationData);
            }, true);
        } else {
            // give cached data to the callback
            callback(nationData);
        }
    }

    function denyCode() {
        // user did not input valid verification code
        $('#spinner').remove();
        document.getElementById('verification-code-group').classList.add('has-warning');
        document.getElementById('verification-code-feedback').innerHTML = '<div class="form-control-feedback">Your verification code was not approved. Generate a new code.</div>';
    }

    function verify() {
        // reset form warnings
        document.getElementById('nation-name-feedback').innerHTML = '';
        document.getElementById('nation-name-group').classList.remove('has-warning');
        document.getElementById('verification-code-feedback').innerHTML = '';
        document.getElementById('verification-code-group').classList.remove('has-warning');
        // set nation name
        nationName = document.getElementById('nation-name').value;
        // check if user entered a nation name
        if (nationName === null || nationName.length < 2) {
            document.getElementById('nation-name-group').classList.add('has-warning');
            document.getElementById('nation-name-feedback').innerHTML = '<div class="form-control-feedback">Something\'s not right about that nation name.</div>';
            return;
        }
        // set internal name
        internalName = nationName.toLowerCase().replace(/ /g, "_");
        verificationCode = document.getElementById('verification-code').value;
        // check if user entered a verification code
        if (verificationCode === null || verificationCode === "") {
            denyCode();
            return;
        } else {
            // check verification API
            document.getElementById('login-form').innerHTML += '<div id="spinner" class="text-center"><span class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></span><span class="sr-only">Loading...</span></div>';
            request("https://www.nationstates.net/cgi-bin/api.cgi?a=verify&nation=" + nationName + "&checksum=" + verificationCode, function(verifyRes) {
                if (verifyRes != 0) {
                    // verified, get our sign in token
                    request("https://api.versutian.site/token?nation=" + internalName, function(tokenRes) {
                        firebase.auth().signInWithCustomToken(tokenRes).catch(function(error) {
                            console.log(error.message);
                        });
                    });
                } else {
                    // code did not match
                    denyCode();
                }
            });
        }
    }

    function loginEmbed() {
        // embed the login page
        document.getElementById('ns-embed').src = "https://nationstates.net/page=login";
        document.getElementById('embed-switch').removeEventListener('click', loginEmbed, false);
        document.getElementById('embed-text').innerHTML = '<p>Once you have logged in, <button id="embed-switch" class="btn btn-secondary btn-sm">verify your nation</button></p>';
        document.getElementById('embed-switch').addEventListener('click', verifyEmbed);
    }

    function verifyEmbed() {
        // embed the verification page
        document.getElementById('ns-embed').src = "https://embed.nationstates.net/page=verify_login#proof_of_login_checksum";
        document.getElementById('embed-switch').removeEventListener('click', verifyEmbed, false);
        document.getElementById('embed-text').innerHTML = '<p>If there is an error, or you need to switch nations, <button id="embed-switch" class="btn btn-secondary btn-sm">login first</button></p>';
        document.getElementById('embed-switch').addEventListener('click', loginEmbed);
    }

    function recordSubmission(pollsOuter, selected, poll, nation) {
        var submissionContainer = document.getElementById('submission-container');
        if (!submissionContainer) {
            pollsOuter.appendChild(document.createElement('br'));
        }
        var thanks = document.createElement('p');
        thanks.classList.add('lead');
        thanks.innerText = 'Thank you. Your ' + (selected ? 'submission' : 'abstention') + ' has been recorded.';
        (submissionContainer ? submissionContainer : pollsOuter).appendChild(thanks);
        var reset = document.createElement('button');
        reset.setAttribute('class', 'btn btn-primary btn-sm');
        reset.innerText = 'Reset poll';
        (submissionContainer ? submissionContainer : pollsOuter).appendChild(reset);
        reset.addEventListener('click', function() {
            var deleteObj = {};
            Object.defineProperty(deleteObj, poll.id + ".selection", {
                value: -1,
                writable: true,
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(deleteObj, poll.id + ".submitted", {
                value: false,
                writable: true,
                enumerable: true,
                configurable: true
            });
            nation.ref.update(deleteObj);
            fillInPolls();
        });
        if (!submissionContainer) {
            pollsOuter.appendChild(document.createElement('br'));
            pollsOuter.appendChild(document.createElement('br'));
        }
    }

    function selectPoll(unsubscribe, poll) {
        // unsubscribe from all polls since we are selecting a specific one
        unsubscribe();
        // set poll header and add back button
        var pollsOuter = document.getElementById('polls-outer');
        pollsOuter.innerHTML = '<button id="poll-list-btn" class="btn btn-secondary"><i class="fa fa-angle-left" aria-hidden="true"></i> Back</button><br><br><h1 class="display-4">' + poll.data().name + '</h1>';
        document.getElementById('poll-list-btn').addEventListener('click', fillInPolls);
        // get poll questions
        Object.values(poll.data().questions).forEach(function (question, questionIndex) {
            // question header
            var questionHeader = document.createElement('h2');
            questionHeader.innerText = question.question;
            pollsOuter.appendChild(questionHeader);
            // list of options
            var optionsList = document.createElement('div');
            optionsList.classList.add('list-group');
            pollsOuter.appendChild(optionsList);
            db.collection("nations").doc(internalName).get().then(function(test) {
                // ensure the nation and poll data exists
                if (!test.exists || !getPropertyValue(test.data(), poll.id)) {
                    var nationBlankTemplate = {};
                    Object.defineProperty(nationBlankTemplate, poll.id, {
                        value: {},
                        writable: true,
                        enumerable: true,
                        configurable: true
                    });
                    Object.defineProperty(getPropertyValue(nationBlankTemplate, poll.id), "selection", {
                        value: -1,
                        writable: true,
                        enumerable: true,
                        configurable: true
                    });
                    Object.defineProperty(getPropertyValue(nationBlankTemplate, poll.id), "submitted", {
                        value: false,
                        writable: true,
                        enumerable: true,
                        configurable: true
                    });
                    if (!test.exists) {
                        db.collection("nations").doc(internalName).set(nationBlankTemplate);
                    } else if (!getPropertyValue(test.data(), poll.id)) {
                        db.collection("nations").doc(internalName).update(nationBlankTemplate);
                    }
                }
                // requery
                db.collection("nations").doc(internalName).get().then(function(nation) {
                    // check if the nation has locked in
                    var nationObj;
                    nationObj = getPropertyValue(nation.data(), poll.id);
                    var showResults = nationObj.submitted;
                    // check if the nation selected an option already
                    var selection = nationObj.selection;
                    var selectedOption = selection !== -1;
                    // badges to be added once locked in
                    var counts = [];
                    Object.values(question.options).forEach(function(option, optionIndex) {
                        // create a new item in the options list
                        var optionListItem = document.createElement('a');
                        optionListItem.setAttribute('class', 'list-group-item list-group-item-action d-flex justify-content-between align-items-center');
                        // make a clickable anchor that doesn't go anywhere
                        optionListItem.href = "#";
                        optionListItem.onclick = "return false";
                        optionListItem.innerText = option.option;
                        optionsList.appendChild(optionListItem);
                        // add invis badge for count
                        var optionListItemCount = document.createElement('span');
                        optionListItemCount.setAttribute('class', 'badge badge-primary badge-pill');
                        optionListItemCount.innerText = option.count;
                        // show it if the nation has already opted into locking in their results
                        if (showResults) {
                            optionListItem.appendChild(optionListItemCount);
                        } else {
                            // else, queue it in case they lock in later
                            var index = counts.push([]) - 1;
                            counts[index] = [optionListItem, optionListItemCount];
                        }
                        // they haven't selected an option and haven't locked in
                        if (!selectedOption && !showResults) {
                            optionListItem.addEventListener('click', function() {
                                if (!selectedOption) {
                                    // prevent further selections
                                    selectedOption = true;
                                    // highlight user's selection
                                    optionListItem.classList.add('active');
                                    // update the nation's selection in database
                                    var nationMerge = {};
                                    Object.defineProperty(nationMerge, poll.id + ".selection", {
                                        value: optionIndex,
                                        writable: true,
                                        enumerable: true,
                                        configurable: true
                                    });
                                    nation.ref.update(nationMerge);
                                    // increase option count on poll
                                    option.count += 1;
                                    optionListItemCount.innerText = option.count;
                                    var optionMerge = {};
                                    Object.defineProperty(optionMerge, "questions." + questionIndex + ".options." + optionIndex + ".count", {
                                        value: option.count,
                                        writable: true,
                                        enumerable: true,
                                        configurable: true
                                    });
                                    poll.ref.update(optionMerge);
                                }
                            });
                        } else if (selection === optionIndex) { 
                            // they've previously selected an option, highlight it
                            optionListItem.classList.add('active');
                        }
                    });
                    if (!document.getElementById('submit-btn') && !showResults) {
                        // add submit button
                        pollsOuter.appendChild(document.createElement('br'));
                        var submitBtn = document.createElement('button');
                        submitBtn.setAttribute('class', 'btn btn-primary btn-lg');
                        submitBtn.id = "submit-btn";
                        submitBtn.innerText = 'See results';
                        submitBtn.addEventListener('click', function() {
                            // lock the nation in on the database
                            var nationSubmitted = {};
                            Object.defineProperty(nationSubmitted, poll.id + ".submitted", {
                                value: true,
                                writable: true,
                                enumerable: true,
                                configurable: true
                            });
                            nation.ref.update(nationSubmitted);
                            // make the results visible
                            showResults = true;
                            counts.forEach(function(pair) {
                                pair[0].appendChild(pair[1]);
                            });
                            // thank user for submission
                            submitBtn.remove();
                            recordSubmission(pollsOuter, selectedOption, poll, nation);
                        });
                        var submissionContainer = document.createElement('div');
                        submissionContainer.id = 'submission-container';
                        submissionContainer.appendChild(submitBtn);
                        pollsOuter.appendChild(submissionContainer);
                        pollsOuter.appendChild(document.createElement('br'));
                        pollsOuter.appendChild(document.createElement('br'));
                    } else if (showResults) {
                        // thank user for submission
                        recordSubmission(pollsOuter, selectedOption, poll, nation);
                    }
                });
            });
        });
    }

    function getPolls() {
        var unsubscribe = db.collection("polls").onSnapshot(function () {});
        // get all polls and collect them into a list
        db.collection("polls").onSnapshot(function(polls) {
            var pollsContainer = document.getElementById('polls');
            if (pollsContainer) {
                pollsContainer.innerHTML = '<div id="polls-list" class="list-group"></div>';
                var pollsList = document.getElementById('polls-list');
                polls.forEach(function(poll) {
                    var pollItem = document.createElement('a');
                    pollItem.setAttribute('class', 'list-group-item list-group-item-action');
                    pollItem.innerText = poll.data().name;
                    pollItem.addEventListener('click', function() {
                        selectPoll(unsubscribe, poll);
                    });
                    pollsList.appendChild(pollItem);
                });
            }
        });
    }

    function fillInPolls() {
        // fill in polls
        var pollsOuter = document.getElementById('polls-outer');
        if (pollsOuter) {
            pollsOuter.innerHTML = '<h1 class="display-4">Polls</h1><div id="polls"></div>';
        } else {
            content.innerHTML += '<div id="polls-outer"><h1 class="display-4">Polls</h1><div id="polls"></div></div>';
        }
        getPolls();
    }

    function collapseHeader() {
        document.getElementById('header-toggle').removeEventListener('click', collapseHeader, false);
        document.getElementById('header-toggle').innerHTML = '<span class="fa fa-arrow-down" aria-hidden="true"></span> Expand <span class="fa fa-arrow-down" aria-hidden="true"></span>';
        document.getElementById('header-additional').style.display = 'none';
        document.getElementById('header').classList.remove('jumbotron');
        document.getElementById('header').classList.remove('jumbotron-fluid');
        document.getElementById('header').style.paddingTop = "1rem";
        document.getElementById('header').style.paddingBottom = "1rem";
        document.getElementById('header-toggle').addEventListener('click', expandHeader, false);
    }
    
    function expandHeader() {
        document.getElementById('header-toggle').removeEventListener('click', expandHeader, false);
        document.getElementById('header-toggle').innerHTML = '<span class="fa fa-arrow-up" aria-hidden="true"></span> Collapse <span class="fa fa-arrow-up" aria-hidden="true"></span>';
        document.getElementById('header-additional').style.display = 'block';
        document.getElementById('header').classList.add('jumbotron');
        document.getElementById('header').classList.add('jumbotron-fluid');
        document.getElementById('header').style.paddingTop = null;
        document.getElementById('header').style.paddingBottom = null;
        document.getElementById('header-toggle').addEventListener('click', collapseHeader, false);
    }

    document.getElementById('header-toggle').addEventListener('click', collapseHeader);

    firebase.auth().onAuthStateChanged(function (user) {
        // are we logged in?
        if (user) {
            // set our nation name
            internalName = user.uid;
            // set up the site
            content.innerHTML = '<p class="lead">Welcome <img id="welcome-flag" style="max-height: 13px; max-width: 20px; margin-right: 4px" src="' + yourNationFlag + '"><span id="welcome-name">' + nationName + '</span>.</p><small> Not <span id="signout-name">' + nationName + '</span> or on a public device? </small> <button id="signout-btn" class="btn btn-secondary btn-sm" onclick="signOut()">sign out</button></p><hr>';
            // fill in data from NationStates API as it becomes available
            nsNation(internalName, ['flag', 'name'], function(data) {
                nationName = data.get('name');
                yourNationFlag = data.get('flag')
                document.getElementById('welcome-flag').src = yourNationFlag;
                document.getElementById('welcome-name').innerText = nationName;
                document.getElementById('signout-name').innerText = nationName;
            });
            fillInPolls();
        } else {
            // login form
            content.innerHTML = '<h1>Login with NationStates</h1><div id="login-form"><form><div class="form-group" id="nation-name-group"><input type="text" class="form-control form-control-lg" id="nation-name" aria-describedby="nationHelpBlock" placeholder="Nation name"><div id="nation-name-feedback"></div><p id="nationHelpBlock" class="form-text text-muted">Your nation\'s short name, as it is displayed on NationStates, for example, <b>Valturus</b>.</p></div></form><br><iframe src="https://embed.nationstates.net/page=verify_login#proof_of_login_checksum" style="border:none; height: 33vh; width: 100%" id="ns-embed"></iframe><div id="embed-text"><p>If there is an error, or you need to switch nations, <button id="embed-switch" class="btn btn-secondary btn-sm">login first</button></p></div><br><form><div class="form-group" id="verification-code-group"><input type="text" class="form-control" id="verification-code" aria-describedby="codeHelpBlock" placeholder="Code"><div id="verification-code-feedback"></div><p id="codeHelpBlock" class="form-text text-muted">Copy the code you see from the NationStates.net page into this box.</p></div></form><br><button class="btn btn-primary" id="login-btn">Login</button></div><br><br>';
            document.getElementById('login-btn').addEventListener('click', verify);
            document.getElementById('embed-switch').addEventListener('click', loginEmbed);
        }
    });
}

// load the app when page has loaded
window.onload = function() {
    app();
}
