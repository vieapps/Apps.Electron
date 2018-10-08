const CryptoJS = require("crypto-js");
const RSA = require("./rsa");

module.exports = function() {

	this.keys = {
		rsa: {
			exponent: "",
			modulus: ""
		},
		aes:{
			key: undefined,
			iv: undefined
		},
		jwt: ""
	};

	this.rsa = new RSA();

	this.getBase64Url = function(text) {
		return text.replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
	}

	this.getBase64Str = function(text) {
		let result = text.replace(/\-/g, "+").replace(/\_/g, "/");
		switch (result.length % 4) {
			case 0:
				break;
			case 2:
				result += "==";
				break;
			case 3:
				result += "=";
				break;
			default:
				throw new Error("Base64-url string is not well-form!");
		}
		return result;
	}

	this.md5 = function(text) {
		return CryptoJS.MD5(text).toString();
	}

	this.hash = function(obj) {
		return this.md5(JSON.stringify(obj || {}));
	}

	this.hmacSign = function(text, key) {
		return CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(text, key || this.keys.jwt));
	}

	this.urlSign = function(text, key) {
		return this.getBase64Url(this.hmacSign(text, key || this.keys.jwt));
	}

	this.urlEncode = function(text) {
		return this.getBase64Url(CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text)));
	}

	this.urlDecode = function(text) {
		return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(this.getBase64Str(text)));
	}

	this.jwtEncode = function(jwt, key) {
		jwt = jwt || {};
		jwt.iat = Math.round(+new Date() / 1000);
		const encoded = this.urlEncode(JSON.stringify({ typ: "JWT", alg: "HS256" })) + "." + this.urlEncode(JSON.stringify(jwt));
		return encoded + "." + this.urlSign(encoded, key || this.keys.jwt);
	}

	this.jwtDecode = function(jwt, key) {
		const elements = jwt.split(".");
		return this.urlSign(elements[0] + "." + elements[1], key || this.keys.jwt) === elements[2]
			? JSON.parse(this.urlDecode(elements[1]))
			: undefined;
	}

	this.rsaEncrypt = function(text) {
		return this.rsa.encrypt(text);
	}

	this.aesEncrypt = function(text, key, iv) {
		return CryptoJS.AES.encrypt(text, key || this.keys.aes.key, { iv: iv || this.keys.aes.iv }).ciphertext.toString(CryptoJS.enc.Base64);
	}

	this.aesDecrypt = function(text, key, iv) {
		return CryptoJS.AES.decrypt(text, key || this.keys.aes.key, { iv: iv || this.keys.aes.iv }).toString(CryptoJS.enc.Utf8);
	}

	this.initAES = function(keys) {
		this.keys.aes.key = CryptoJS.enc.Hex.parse(keys.key);
		this.keys.aes.iv = CryptoJS.enc.Hex.parse(keys.iv);
	}

	this.initRSA = function(keys) {
		this.keys.rsa = keys;
		this.rsa.init(this.keys.rsa.exponent, this.keys.rsa.modulus);
	}

	this.init = function(keys) {
		if (keys.rsa !== undefined) {
			this.initRSA(keys.rsa);
		}
		if (keys.aes !== undefined) {
			this.initAES(keys.aes);
		}
		if (keys.jwt !== undefined) {
			this.keys.jwt = keys.jwt;
		}
	}

};