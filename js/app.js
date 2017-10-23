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

    // Token creation information
    var sub = 'versutianpolls@appspot.gserviceaccount.com';
    var sPKCS8PEM = '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDFxHJvgqbZBLkh\nAXfZbgs4rh6C2MfvUDvC3S4NwaFBknWgjLGb1VjJu4MFKHAU1kjgZGFSSsawvLK/\n82QpQ1N86WGdcHW830sEDEW+u6AkIsNpj0sS1zbUxTDEImVawiy8Fmm8WLGQuZ1Y\nzojzbneaDmfucNQIIVEEcGl4lI8sxHs1h9vpItOa2SkcTqB+RFCLtZAlnLwKUAUM\nAIGbJquOpCyJ4x0mbBHLpZUi3aoJvIoqB8CMUdzEPjmFdhEbTg4tY3bx49loIN58\nVb4YsUYPmpARRlxQeifRGUgLwvdL0pyjTJ2simlEkDfcga7a8UD4B1zDbYkdOMMx\n71gOEgcvAgMBAAECggEAJchMloou5woUdj5KD9OKuEbnlFbnB4zcBfPsjvs9nAHn\nkAchDWT6g/vbYZpio1B29sumniqj//Lk8XAF5C41HomVuRbZn35HXhwcHP7Kbuzn\nSVzzWkOceZS8ptPtaiPrmPltNOr67WvQqD05A8zIc7mp2G9cyrrWuBLjy4ISQlpn\nED53EiKixTqFrr0i4KxUzH5UNVyy3nupuO69RcjRAB0BbVt9emLnQ4yt4kxpojOe\njwq6KHQhvYH78lgOrdnOUbdowZeZPU8ghCQ9/XFwRPCdi6Cb9pa2Z9vCYl+kHlVP\ntUYGqKSZKfxqWB5OE9ZOqeyGA2TvzAhG291aPapkUQKBgQDu9gaw2Lnh5LQMnUHJ\np9lKw76rhY/z34HUyPtTLw+ziauWt4XBhy1Jf+428yIVhp/oHICDDrMdOe7tAxjq\nkBUCxVSF/e4E5rzFcIP+hMDtXPv7HWS6spGzfdEMPZL5gxa8d6QqCKf3YGaSAeRT\nH9gahv19x8Q4L1/Yr8r0dlXW3wKBgQDT3nmrC/VnMx42YutliZDUJAMGH3GMLwwj\nGkAyJJtnrdP8OG9lIdbZlY9TKpBeLv1qiZI3QtShgwQZAhKKelL6OIQCDnEAyL3f\nIuNMiDQ8EJ/cLEegbUhhDZZF14fuiBVmUW2WdQF58gizrNJfPAk466G6bSvFWhbk\nOnkTfklpsQKBgQDJfiCELCsJBAyh+lQH0wWRWl7DSHrqm1NhdhsduDgYHoTWMGeT\nmQUhzcKzCO57kinx0V63o8R6Z2hE5/CxkM52qKet2EFEVr9kCIz0J0J6o4ZB5zYR\nixL6c6O7G4x74gJg5s1BOE1RdTLn+LprMRXKwHqs/a5B5gh+sTSET+fvpwKBgEUa\ny5R+0gxXIAOdQCpeNF79X/8fQmn27n6EkWvJhObMS9h4j9zsrKdLoPP/bhdKPF4D\ngS2FHtWPZkbB5kpEm8wBow0IqNMYptWhC4Jq6p6szXeC+dnZy0HcrKcbJbsnp9M3\nvAbXIyQjTbNNK1DkxB1MvfOQqDY2rEDE0bkJ9+gBAoGBALKRG0lhdOTugUCKAmUd\nL67rJMq+yblmSVPiiZFht3wzsk6QlgwnsAWi19LxyFQ6xufGDQwd7IuTF5wNRldv\noGS9HBhdoehNRMn3AUaM8SK4S3Ucpfey/BJSBqbLvPaMMhiLHVu9t3fbYS+xh77S\nOC7vlmvPTmXCCd+QDLfTa4/o\n-----END PRIVATE KEY-----\n';
    var kid = '84ab840416adc49a26ecd7e10ff1b1ccff726bb0';

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
                    var oHeader = {alg: 'RS256', kid: kid, typ: 'JWT'},
                    oPayload = {},
                    tNow = KJUR.jws.IntDate.get('now'),
                    tEnd = KJUR.jws.IntDate.get('now + 1hour');
                    oPayload.aud = 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit';
                    oPayload.exp = tEnd;
                    oPayload.iat = tNow;
                    oPayload.iss = sub;
                    oPayload.sub = sub;
                    oPayload.user_id = internalName;
                    oPayload.scope = 'https://www.googleapis.com/auth/identitytoolkit';
                    var sHeader = JSON.stringify(oHeader);
                    var sPayload = JSON.stringify(oPayload);
                    var token = KJUR.jws.JWS.sign(null, sHeader, sPayload, sPKCS8PEM, '67b016a2ff6fb376d9f23a5b0da231ad7134534e45fa6c83d0d31ce426a7bced');
                    firebase.auth().signInWithCustomToken(token).catch(function(error) {
                        console.log(error.message);
                    });
                } else {
                    denyCode();
                }
            };
            request.open("GET", "https://www.nationstates.net/cgi-bin/api.cgi?a=verify&nation=" + nationName + "&checksum=" + verificationCode);
            request.send();
        }
    
    }

    function loginEmbed() {
        "use strict";
        document.getElementById('ns-embed').src = "https://nationstates.net/page=login";
        document.getElementById('embed-switch').removeEventListener('click', loginEmbed, false);
        document.getElementById('embed-text').innerHTML = '<p>Once you have logged in, <button id="embed-switch" class="btn btn-secondary btn-sm">verify your nation</button></p>';
        document.getElementById('embed-switch').addEventListener('click', verifyEmbed, false);
    }
    
    function verifyEmbed() {
        "use strict";
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
