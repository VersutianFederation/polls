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

    var nationName = "Unknown Nation";
    var yourNationFlag = "https://www.nationstates.net/images/flags/Default.png";
    var internalName;
    var verificationCode;

    // Nation object
    function Nation(name, flag) {
        this.name = name;
        this.flag = flag;
    }

    function denyCode() {
        $('#spinner').remove();
        document.getElementById('verification-code-group').classList.add('has-warning');
        document.getElementById('verification-code-feedback').innerHTML = '<div class="form-control-feedback">Your verification code was not approved. Generate a new code.</div>';
    }

    function verify() {
        document.getElementById('nation-name-feedback').innerHTML = '';
        document.getElementById('nation-name-group').classList.remove('has-warning');
        document.getElementById('verification-code-feedback').innerHTML = '';
        document.getElementById('verification-code-group').classList.remove('has-warning');
        nationName = document.getElementById('nation-name').value;
        internalName = nationName.toLowerCase().replace(/ /g, "_");
        verificationCode = document.getElementById('verification-code').value;
        if (nationName === null || nationName.length < 2) {
            document.getElementById('nation-name-group').classList.add('has-warning');
            document.getElementById('nation-name-feedback').innerHTML = '<div class="form-control-feedback">Something\'s not right about that nation name.</div>';
            return;
        }
        if (verificationCode === null || verificationCode === "") {
            denyCode();
            return;
        } else {
            document.getElementById('login-form').innerHTML += '<div id="spinner" class="text-center"><span class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></span><span class="sr-only">Loading...</span></div>';
            var request = new XMLHttpRequest();
            request.onload = function() {
                if (request.responseText) {
                    var tokenRequest = new XMLHttpRequest();
                    tokenRequest.onload = function() {
                        token = tokenRequest.responseText;
                        firebase.auth().signInWithCustomToken(token).catch(function(error) {
                            console.log(error.message);
                        });
                    }
                    tokenRequest.open("GET", "https://versutian.site/api/token/" + internalName);
                    tokenRequest.send();
                } else {
                    denyCode();
                }
            };
            request.open("GET", "https://www.nationstates.net/cgi-bin/api.cgi?a=verify&nation=" + nationName + "&checksum=" + verificationCode);
            request.send();
        }
    }

    function loginEmbed() {
        document.getElementById('ns-embed').src = "https://nationstates.net/page=login";
        document.getElementById('embed-switch').removeEventListener('click', loginEmbed, false);
        document.getElementById('embed-text').innerHTML = '<p>Once you have logged in, <button id="embed-switch" class="btn btn-secondary btn-sm">verify your nation</button></p>';
        document.getElementById('embed-switch').addEventListener('click', verifyEmbed, false);
    }
    
    function verifyEmbed() {
        document.getElementById('ns-embed').src = "https://embed.nationstates.net/page=verify_login#proof_of_login_checksum";
        document.getElementById('embed-switch').removeEventListener('click', verifyEmbed, false);
        document.getElementById('embed-text').innerHTML = '<p>If there is an error, or you need to switch nations, <button id="embed-switch" class="btn btn-secondary btn-sm">login first</button></p>';
        document.getElementById('embed-switch').addEventListener('click', loginEmbed, false);
    }

    firebase.auth().onAuthStateChanged(function (user) {
        var db = firebase.firestore();
        var content = document.getElementById('content');
        if (user) {
            internalName = user.uid;
        } else {
            content.innerHTML = '<h1>Login with NationStates</h1><div id="login-form"><form><div class="form-group" id="nation-name-group"><input type="text" class="form-control form-control-lg" id="nation-name" aria-describedby="nationHelpBlock" placeholder="Nation name"><div id="nation-name-feedback"></div><p id="nationHelpBlock" class="form-text text-muted">Your nation\'s short name, as it is displayed on NationStates, for example, <b>Valturus</b>.</p></div></form><br><iframe src="https://embed.nationstates.net/page=verify_login#proof_of_login_checksum" style="border:none; height: 33vh; width: 100%" id="ns-embed"></iframe><div id="embed-text"><p>If there is an error, or you need to switch nations, <button id="embed-switch" class="btn btn-secondary btn-sm">login first</button></p></div><br><form><div class="form-group" id="verification-code-group"><input type="text" class="form-control" id="verification-code" aria-describedby="codeHelpBlock" placeholder="Code"><div id="verification-code-feedback"></div><p id="codeHelpBlock" class="form-text text-muted">Copy the code you see from the NationStates.net page into this box.</p></div></form><br><button class="btn btn-primary" id="login-btn">Login</button></div><br><br>';
            document.getElementById('login-btn').addEventListener('click', verify, false);
            document.getElementById('embed-switch').addEventListener('click', loginEmbed, false);
        }
    });
}

window.onload = function() {
    app();
}
