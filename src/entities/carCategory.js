const Base = require('./base/base')

class CarCategory extends Base {
    constructor({ id, name, carId, price }) {
        super({ id, name })
        this.carId = carId
        this.price = price
    }
}
module.exports = CarCategory