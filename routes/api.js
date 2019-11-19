/*global exports */
/*global document, window, process, request, console, require*/

var request = require('request'),
    pusherRef = null,
    userNames = [
        {'name': 'Billie Sue', 'inuse': 0},
        {'name': 'Billy Bob', 'inuse': 0},
        {'name': 'Billy Joe', 'inuse': 0},
        {'name': 'Bobbie Sue', 'inuse': 0},
        {'name': 'Betty Lou', 'inuse': 0},
        {'name': 'Betty Jo', 'inuse': 0},
        {'name': 'Bobby Jo', 'inuse': 0},
        {'name': 'Bubba', 'inuse': 0},
        {'name': 'Bo', 'inuse': 0},
        {'name': 'Bocephus', 'inuse': 0},
        {'name': 'Buck', 'inuse': 0},
        {'name': 'Sue Ellen', 'inuse': 0},
        {'name': 'Bodean', 'inuse': 0},
        {'name': 'Jimbo', 'inuse': 0},
        {'name': 'Jim Bob', 'inuse': 0},
        {'name': 'Lirlene', 'inuse': 0},
        {'name': 'Linda Sue', 'inuse': 0},
        {'name': 'Lori Belle', 'inuse': 0},
        {'name': 'Duke', 'inuse': 0},
        {'name': 'Martha May', 'inuse': 0},
        {'name': 'Mary Beth', 'inuse': 0},
        {'name': 'Mary Ellen', 'inuse': 0},
        {'name': 'Mary Sue', 'inuse': 0},
        {'name': 'Joe Don', 'inuse': 0},
        {'name': 'Woody Buck', 'inuse': 0},
        {'name': 'Jed Clyde', 'inuse': 0}
    ],
    seqNo = 0,
    namesLength = userNames.length,
    wndNameSeqNo = 0,
    nodeMailer = null,
    env = {
        'host': "localhost",
        'port': "3035"
    },
    ARCGIS_CLIENT_ID = process.env.ARCGISCLIENTID,
    ARCGIS_CLIENT_SECRET = process.env.ARCGISCLIENTSECRET,

    MJAPIPUBLICKEY = process.env.MJAPIPUBLICKEY,
    MJAPIPRIVATEKEY = process.env.MJAPIPRIVATEKEY,
    cbport = process.env.PORT || "3000",
    agoToken = "",
    hurl = cbport === '3000' ?
            "http://localhost:3000/auth/arcgis/callback" :
            "https://agopassport.herokuapp.com:" + cbport + "/auth/arcgis/callback",
    mailJet = require('node-mailjet').connect(MJAPIPUBLICKEY, MJAPIPRIVATEKEY);

    console.log("apiKeys");
    console.log(MJAPIPUBLICKEY);
    console.log(MJAPIPRIVATEKEY);

function loadHeaders(req, res) {
    "use strict";
    var responseSettings = {
        "AccessControlAllowOrigin": req.headers.origin,
        "AccessControlAllowHeaders": "Content-Type,X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5,  Date, X-Api-Version, X-File-Name",
        "AccessControlAllowMethods": "POST, GET, PUT, DELETE, OPTIONS",
        "AccessControlAllowCredentials": true
    };

/**
 * Headers
 */
    res.header("Access-Control-Allow-Credentials", responseSettings.AccessControlAllowCredentials);
    // res.header("Access-Control-Allow-Origin",  responseSettings.AccessControlAllowOrigin);
    res.header("Access-Control-Allow-Headers", (req.headers['access-control-request-headers']) || "x-requested-with");
    res.header("Access-Control-Allow-Methods", (req.headers['access-control-request-method']) || responseSettings.AccessControlAllowMethods);

    // if ('OPTIONS' == req.method) {
    //     res.send(200);
    // }
    // else {
    //     console.log("Fell through loadHeaders to next() call");
        // next();
    // }

}

exports.setNodeMailer = function (nm) {
    "use strict";
    nodeMailer = nm;
};

exports.getAuth = function (req, res) {
    "use strict";
    console.log('getAuth');
    console.log('%s %s %s', req.method, req.url, req.path);
    console.log('req.body.socket_id is %s', req.body.socket_id);
    console.log('req.body.channel_name is %s', req.body.channel_name);
    var socketId = req.body.socket_id,
        channel = req.body.channel_name,
        auth = pusherRef.authenticate(socketId, channel);
    // loadHeaders(req, res);
    res.send(auth);
};

exports.getAuthArcGIS = function (req, res) {
    "use strict";
    console.log("route authremote/arcgis");
    console.log(ARCGIS_CLIENT_ID);
    var
        frm = {
            'f': 'json',
            'client_id': ARCGIS_CLIENT_ID,
            'client_secret': ARCGIS_CLIENT_SECRET,
            'grant_type': 'client_credentials',
            'expiration': '1440'
        };
    console.log(frm);
    loadHeaders(req, res);
    request.post({ url: 'https://www.arcgis.com/sharing/rest/oauth2/token/?client_id=' + ARCGIS_CLIENT_ID + '&client_secret=' + ARCGIS_CLIENT_SECRET +  '&grant_type=client_credentials&expiration=1440&redirect_uri=' + hurl},
    // request.post({ url: 'https://www.arcgis.com/sharing/rest/oauth2/token/'
    //     json: true,
    //     form: frm,
    //     'headers' : {'Content-Type': 'application/x-www-form-urlencoded'}
    //   },
        function (error, response, body) {
            var jsresp;
            console.log("returned");
            console.log(response.body);
            console.log(error);
            jsresp = JSON.parse(response.body);
            console.log("\n\ntoken: " + jsresp.access_token);
            console.log("\nexpires_in " + jsresp.expires_in);
            agoToken = jsresp.access_token;
            return res.send(jsresp);
        });
      // console.log("outer return");
      // console.log(this.jsresp);
      // return this.jresp;
};

exports.getItems = function (req, res) {
    "use strict";
    console.log("route listingsremote");
    loadHeaders(req, res);

    var itemsurl = 'https://www.arcgis.com/sharing/rest/content/items/4c3ccb95474c4c4d89ec191d69ba1080?f=json&token='
        + agoToken,
        fetchedItems;
    fetchedItems = request.get({url : itemsurl},
        function (error, response, body) {
            var jsresp;
            console.log("returned");
            console.log(response.body);
            console.log(error);
            jsresp = JSON.parse(response.body);
            return res.send(jsresp);

        });
    // let fetchedItems = await this.httpClient.get('http://localhost:3000/auth/arcgis/callback').toPromise();
    console.log(fetchedItems);
    return fetchedItems;
};

exports.setPusher = function (pshr) {
    "use strict";
    console.log("setPusher");
    pusherRef = pshr;
};

exports.setHostEnvironment = function (host, port) {
    "use strict";
    console.log("setHostEnvironment");
    console.log("host set to " + host + ", port set to " + port);
    env.host = host;
    env.port = port;
    console.log("Host set to " + env.host + ", port set to " + env.port);
};

exports.getHostEnvironment = function (req, res) {
    "use strict";
    console.log("getHostEnvironment returning");
    console.log(env.host + ", " + env.port);
    loadHeaders(req, res);
    res.json(env);
};

exports.getUserName = function (req, res) {
    "use strict";
    console.log("API getUserName");
    console.log('%s %s %s', req.method, req.url, req.path);
    if (seqNo === namesLength) {
        seqNo = 0;
        console.log("reset seqNo to zero");
    }
    console.log("return seqNo %s, name %s", seqNo, userNames[seqNo].name);
    loadHeaders(req, res);
    res.json({'id' : seqNo, 'name' : userNames[seqNo].name});
    seqNo += 1;
};


exports.getUserId = function (req, res) {
    "use strict";
    console.log("API getUserId");
    console.log('%s %s %s', req.method, req.url, req.path);
    if (seqNo === namesLength) {
        seqNo = 0;
        console.log("reset seqNo to zero");
    }
    console.log("return seqNo %s ", seqNo);
    loadHeaders(req, res);
    res.json({'id' : seqNo});
    seqNo += 1;
};
exports.getPusherKeys = function (req, res) {
    "use strict";
    let pusherkeys = {
      appid : process.env.PUSHERAPPID,
      appkey : process.env.PUSHERAPPKEY,
      appsecret : process.env.PUSHERAPPSECRET
    };
    console.log("pusherkeys");
    console.log(pusherkeys);
    loadHeaders(req, res);
    res.json("pusherkeys" : pusherkeys);
};

exports.getNextWindowSeqNo = function (req, res) {
    "use strict";
    console.log("API wndNameSeqNo");

    console.log("return wndNameSeqNo %s ", wndNameSeqNo);
    loadHeaders(req, res);
    res.json({'wndNameSeqNo' : wndNameSeqNo});
    wndNameSeqNo += 1;
};

function handlePostResponse(res, response) {
    "use strict";
    console.log("handlePostResponse");
    console.log(response);
    // console.log('Message sent: %s', response.body);
    res.json({'msg' : 'email sent'});
}

function handleError(res, err) {
    "use strict";
    console.log('Error occurred. ');
    console.log(err);
    return res.json({'err' : err});
}

exports.postEmail = function (req, res) {
    "use strict";
    console.log('in postEmail');
    console.log(req.body);

    let sendEmail = mailJet.post('send'),
        body = req.body,
        message = {
            'FromName' : 'MapLinkr',
            'FromEmail' : 'MapSyncr@gmail.com',
            'Recipients': body.to,
            'Subject' : body.subject,
            // 'Text-part': body.text,
            'Html-part': body.text + '<p><b>MapLinkr</b> click link to open this MapLinkr map in browser</p>'
        };
        console.log('message');
        console.log(message);
        loadHeaders(req, res);
        console.log("now send to mailjet");

        sendEmail
            .request(message)
                .then((result) => handlePostResponse(res, result))
                .catch((err) => handleError(res, err));



    /*
    // Generate SMTP service account from ethereal.email
    nodeMailer.createTestAccount((err, account) => {
        if (err) {
            console.error('Failed to create a testing account. ' + err.message);
            return process.exit(1);
        }

        console.log('Credentials obtained, sending message...');

        // Create a SMTP transporter object
        let transporter = nodeMailer.createTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            socketTimeout: 15000,
            auth: {
                user: account.user,
                pass: account.pass
            }
        });

        // Message object
        let message = {
            from: 'MapLinkr <mapsyncr@gmail.com>',
            to: body.to,
            subject: body.subject,
            text: body.text,
            html: '<p><b>MapLinkr</b> click link to open this MapLinkr map in browser</p>'
        };
          console.log('message');
        console.log(message);
        loadHeaders(req, res);

        transporter.sendMail(message, (err, info) => {
            if (err) {
                console.log('Error occurred. ' + err.message);
                return process.exit(1);
            }

            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodeMailer.getTestMessageUrl(info));
            res.json({'msg' : 'email sent'});
        });
    });
    */
};
