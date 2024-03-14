const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { join } = require('path');
const { expect } = require('chai');
const sinon = require('sinon');

const CarService = require('./../../src/service/carService');
const Tax = require('../../src/entities/tax');
const Transaction = require('../../src/entities/transaction');
const carsDatabase = join(__dirname, './../../database', 'cars.json');

const mocks = {
    validCarCategory: require('../mocks/valid-carCategory.json'),
    validCar: require('../mocks/valid-car.json'),
    validCustomer: require('../mocks/valid-customer.json'),
};

describe('CarService Suite Tests', () => {
    let carService = {};
    let sandbox = {};

    before(() => {
        carService = new CarService({
            cars: carsDatabase
        });
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    })

    it('should retrieve a random position from an array', () => {
        const data = [0, 1, 2, 3, 4];
        const result = carService.getRandomPositionFromArray(data);

        expect(result).to.be.lessThanOrEqual(data.length).and.be.greaterThanOrEqual(0);
    });

    it('should choose the first id from carIds in carCategory', () => {
        const carCategory = mocks.validCarCategory;
        const carIdIndex = 0;

        sandbox.stub(
            carService,
            carService.getRandomPositionFromArray.name
        ).returns(carIdIndex);

        const result = carService.chooseRandomCar(carCategory);
        const expected = carCategory.carIds[carIdIndex];

        expect(carService.getRandomPositionFromArray.calledOnce).to.be.ok;
        expect(result).to.be.equal(expected);
    });

    it('Given a carCategory it should return an available car', async () => {
        const car = mocks.validCar;
        const carCategory = {
            ...mocks.validCarCategory,
            carIds: [car.id]
        };

        sandbox.stub(
            carService.carRepository,
            carService.carRepository.find.name
        ).resolves(car);

        sandbox.spy(
            carService,
            carService.chooseRandomCar.name
        );

        const result = await carService.getAvailableCar(carCategory);
        const expected = car;

        expect(carService.chooseRandomCar.calledOnce).to.be.ok;
        expect(carService.carRepository.find.calledWithExactly(car.id)).to.be.ok;
        expect(result).to.be.deep.equal(expected);
    });

    it('given a carCategory, customer and numberOfDays it should calculate final amount in real', async () => {
        const customer = Object.create(mocks.validCustomer);
        customer.age = 50;

        const carCategory = Object.create(mocks.validCarCategory);
        carCategory.price = 37.6;

        const numberOfDays = 5;

        sandbox.stub(
            Tax,
            "taxesBasedOnAge"
        ).get(() => [{ from: 40, to: 50, then: 1.3 }]);

        const expectedV = carService.currencyFormat.format(244.40);
        const result = carService.calculateFinalPrice(
            customer,
            carCategory,
            numberOfDays
        );

        expect(result).to.be.deep.equal(expectedV);
    });

    it('should calculate taxes based on customer age', () => {
        const customer = { age: 45 }
        const taxes = carService.taxesBasedOnAge
        const expectedTax = 1.3

        const result = taxes.find(tax => customer.age >= tax.from && customer.age <= tax.to).then;

        expect(result).to.equal(expectedTax);
    });

    it('given a customer and a carCategory it should return a transaction receipt', async () => {
        const car = mocks.validCar
        const carCategory = {
            ...mocks.validCarCategory,
            price: 37.6,
            carIds: [car.id]
        }

        const customer = Object.create(mocks.validCustomer)
        customer.age = 20

        const numberOfDays = 5
        const now = new Date(2024, 2, 14) // 14 de março de 2024
        sandbox.useFakeTimers(now.getTime())

        sandbox.stub(
            carService.carRepository,
            carService.carRepository.find.name,
        ).resolves(car)

        const dueDate = new Date(now)
        dueDate.setDate(dueDate.getDate() + numberOfDays)
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }
        const expectedDueDate = dueDate.toLocaleDateString('pt-br', options)

        const expectedAmount = carService.currencyFormat.format(206.80)
        const result = await carService.rent(
            customer, carCategory, numberOfDays
        )

        const dueDateFormatted = expectedDueDate.charAt(0).toUpperCase() + expectedDueDate.slice(1)
        const expected = new Transaction({
            customer,
            car,
            dueDate: dueDateFormatted,
            amount: expectedAmount,
        })

        expect(result).to.be.deep.equal(expected)
    });
})
