const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const atob = require('atob');
const credentials = require('./credentials');
const gmail = google.gmail('v1');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @return {OAuth2} an oauth2 object with the credentials set
 */

let authorize = async (credentials) => {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    // Check if we previously have stored a token
    // if the token file isn't there, then we should store this token for subsequent uses
    try {
        let token = fs.readFileSync(TOKEN_PATH);
        oAuth2Client.setCredentials(JSON.parse(token));
        return oAuth2Client
    }
    catch(err){
        try{
            return await getAccessToken(oAuth2Client);
        }
        catch(err){
            console.log(err);
            throw err;
        }
    }
}

/**
 * Get and store new token after prompting for user authorization, and then
 * return the oAuth client with the token credentials to use for later API call
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @return {Promise} The promise that contains the OAuth2 client with the token credentials
 */
function getAccessToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve, reject) => {
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) reject(console.error('Error retrieving access token', err));
                oAuth2Client.setCredentials(token);
                console.log(token);
                try{
                    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
                    resolve(oAuth2Client);
                }
                catch(err){
                    console.err(err);
                    reject(err);
                }
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) reject(console.error(err));
                    console.log('Token stored to', TOKEN_PATH);
                });
            });
        });
    });
}



/**
 * Click latest acxiom optout email
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @return {Promise} a promise which contains the URL to be clicked by the driver to proceed to the optout
 */
let getAxiomOptoutLink = async () => {
    try{
        let auth = await authorize(credentials);
        let list_response = await gmail.users.messages.list({auth: auth, userId: 'bocautomation12@gmail.com', q: 'from:noreply-optout@acxiom.com is:unread', maxResults: 1});
        if(list_response['data']['messages']) {
            let msgId = list_response['data']['messages'][0]['id'];
            let optout_email = await gmail.users.messages.get({auth: auth, id: msgId, userId: 'bocautomation12@gmail.com'});
            if (!optout_email.data) {
                throw "No data within the message"
            }
            let email_body = atob(optout_email['data']['payload']['body']['data']);
            let optout_link = email_body.split(' ').filter(word => word.startsWith('https://'))[0];
            console.log(optout_link);
            // mark as read
            let result = await gmail.users.messages.modify({auth: auth, userId: 'bocautomation12@gmail.com', id: msgId, requestBody: {
                removeLabelIds: ['UNREAD']
            }});
            console.log(result);
            return optout_link;
        }
    }
    catch (error) {
        console.log("Error occured ", error);
    }
};

    
/**
 * Look for the link from BeenVerified, click on it to confirm removal
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @return {String} the confirm URL to be clicked by the driver
 */
let emailConfirmBeenVerified = async () => {
    try {
        let auth = await authorize(credentials);
        let result = await gmail.users.messages.list({auth: auth, userId: 'me', q: "from:support@email.beenverified.com is:unread subject:Action required"});
        // data.messages field will not be in result if no messages with this criteria is found, so first check if exist
        //console.log(result);
        if(result.data){
            if(result.data.resultSizeEstimate == 0){
                throw "No new email received from support@email.beenverified.com"
            }
            // get the latest email (first in list) and execute the task
            else {
                //console.log(result.data.messages);
                let message = result.data.messages[0];
                let messageId = message.id;
                let contentQuery = await gmail.users.messages.get({auth: auth, userId: 'me', id: message.id});
                // BeenVerified message come as an HTML attachment, so we need to parse the HTML document
                let messageParts = contentQuery.data.payload.parts;
                //console.log(messageParts);
                let messageContent = messageParts.filter(part => part.mimeType == 'text/html')
                // making sure the body is not empty (prevent MIME empty)
                if(messageContent.length > 0){
                    let htmlDoc = Buffer.from(messageContent[0].body.data, 'base64').toString('utf-8').split("\n");
                    let confirmUrl = htmlDoc.filter(htmlLine => htmlLine.includes("<strong>Verify Opt-Out"))[0]
                                    .split(' ').filter(text => text.startsWith("href="))[0].slice(6,-1);
                    console.log(confirmUrl)
                    //opn(confirmUrl, {app: 'chrome'});
                    // if we receive a result, then go ahead and mark mail as read (aka remove unread label)
                    let result = await gmail.users.messages.modify({auth: auth, userId: 'bocautomation12@gmail.com', id: messageId, requestBody: {
                        removeLabelIds: ['UNREAD']
                    }});
                    console.log("Successfully retrieved the confirmURL");
                    return confirmUrl
                    
                }
                else {
                    throw "Receive no text/html parts from the email"
                }
            }
        }
        else {
            throw "Data field is not presented in the listing result"
        }
    }
    catch(err) {
        console.log("Encountered an exception while trying to list files: ", err)
    }
};


module.exports = {
    emailConfirmBeenVerified,
    getAxiomOptoutLink
};

