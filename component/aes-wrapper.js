const crypto = require('crypto');

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
    let cipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(data.iv, 'base64'));
    dec += cipher.update(Buffer.from(data.message, 'base64'), 'base64', 'hex');
    dec += cipher.final('hex');

    return dec;
};

// add initialization vector to message
aesWrapper.addIvToBody = (iv, encryptedBase64) => encryptedBase64 + iv.toString('base64');

aesWrapper.createAesMessage = (aesKey, message) => {
    let aesIv = aesWrapper.generateIv();
    let encryptedMessage = aesWrapper.encrypt(aesKey, aesIv, message);
    encryptedMessage = aesWrapper.addIvToBody(aesIv, encryptedMessage);

    return encryptedMessage;
};

module.exports = aesWrapper;