const bcrypt = require("bcrypt"),
saltRounds = 10;

module.exports.createPasswordHash = async (password)=>{
	try {
		let hashpassword = await bcrypt.hash(password,saltRounds);
        return hashpassword;
	} catch (e) {
		throw e;
	}
}

module.exports.verifyPasswordHash = async (password,hash)=>{
	try {
		return await bcrypt.compareSync(password, hash);
	} catch (e) {
		throw e;
	}
}