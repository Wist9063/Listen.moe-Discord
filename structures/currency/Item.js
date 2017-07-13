module.exports = class Item {
	constructor(name, price, data) {
		this.name = name;
		this.price = price;
		this._data = data || {};
		this.type = 'none';
	}
};
