const crypto = require('crypto');
const App = require('./../app.js')
const aesWrapper = {};

// get list of supportable encryption algorithms
aesWrapper.getAlgorithmList = () => {
    console.log(crypto.getCiphers());
};

aesWrapper.generateKey = () => crypto.randomBytes(32);

aesWrapper.generateIv = () => crypto.randomBytes(16);

// separate initialization vector from message
aesWrapper.separateVectorFromData = data => {
    //console.log(data);
    //console.log('data');
    //TODO: Debug - INVALID IV LENGTH ERROR when decrypting message (Should be 16 bytes instead?)
    let iv = data.slice(-24);
    let message = data.substring(0, data.length - 24);

    return {
        iv: iv,
        message: message
    };
};

aesWrapper.encrypt = (key, iv, text) => {
    let encrypted = '';
    let cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    encrypted += cipher.update(Buffer.from(text), 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return encrypted;
};

aesWrapper.decrypt = (key, text) => {
    let dec = '';
    let data = aesWrapper.separateVectorFromData(text);
    App.webSocketSend("AES IV of the data: "+ data.iv);
    let cipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(data.iv, 'base64'));
    dec += cipher.update(Buffer.from(data.message, 'base64'), 'base64', 'hex');
    dec += cipher.final('hex');
    // sha265 implementation for integrity checking
    App.webSocketSend("Checking data integrity...");
    let hashedMessage = Buffer.from(dec,'hex');
    let message = " ";
    let hashValue = hashedMessage.slice(hashedMessage.byteLength - 32, hashedMessage.byteLength).toString('base64');
    App.webSocketSend("SHA265 hash value of the data: " + hashValue);
    message = hashedMessage.slice(0, hashedMessage.byteLength - 32);
    let computedHash = crypto.createHash('sha256').update(message).digest('base64');
    if(computedHash === hashValue){
        App.webSocketSend("Integrity check completed, got expected hash value: " + computedHash);
    }else{
        App.webSocketSend("The data was corrupted, expected hashed value: " + hashValue + "but get: " + computedHash);
    }
    return message;
};

// add initialization vector to message
aesWrapper.addIvToBody = (iv, encryptedBase64) => encryptedBase64 + iv.toString('base64');

aesWrapper.createAesMessage = (aesKey, message) => {
    let aesIv = aesWrapper.generateIv();
    App.webSocketSend("Using AES IV: " + aesIv.toString('base64'));

    // sha265 implementation for integrity checking
    let hashMessage = Buffer.from(crypto.createHash('sha256').update(message).digest('hex'),'hex');
    App.webSocketSend("SHA265 hash value of the data:  " + hashMessage.toString('base64'));

    //append sha265 hash value to the message
    let encryptedMessage = aesWrapper.encrypt(aesKey, aesIv, Buffer.concat([message,hashMessage]));
    encryptedMessage = aesWrapper.addIvToBody(aesIv, encryptedMessage);

    return encryptedMessage;
};

module.exports = aesWrapper;