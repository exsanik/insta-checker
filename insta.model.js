const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdminSchema = new Schema({
	username: {
		type: String,
		required: true
	},
	chatid: {
		type: String,
		required: true
	},
	title: {
		type: String,
		required: true
	}
})

const VipSchema = new Schema({
	username: {
		type: String,
		required: true
	},
	chatid: {
		type: String,
		required: true
	},
	title: {
		type: String,
		required: true
	}
})

const LinkSchema = new Schema({
	link: {
		type: String,
		required: true
	},
	chatid: {
		type: String,
		required: true
	},
	title: {
		type: String,
		required: true
	}
})

mongoose.model('admin', AdminSchema)
mongoose.model('vip', VipSchema)
mongoose.model('link', LinkSchema)