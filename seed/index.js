const faker = require('@faker-js/faker'); // Corrigindo a importação do pacote faker
const { join } = require('path');
const { writeFile } = require('fs/promises');

const Car = require('../src/entities/car');
const CarCategory = require('../src/entities/carCategory');
const Customer = require('../src/entities/customer');

const seederBaseFolder = join(__dirname, '../', 'database');
const ITEMS_AMOUNT = 2;

const carCategory = new CarCategory({
    id: faker.datatype.uuid(),
    name: faker.vehicle.type(),
    carIds: [],
    price: +faker.finance.amount(20, 100)
});

const cars = [];
const customers = [];
for (let index = 0; index < ITEMS_AMOUNT; index++) { // Corrigindo o loop para iterar sobre ITEMS_AMOUNT
    const car = new Car({
        id: faker.datatype.uuid(),
        name: faker.vehicle.model(),
        releaseYear: faker.date.past().getFullYear(),
        available: true,
        gasAvailable: true,
    });
    carCategory.carIds.push(car.id);
    cars.push(car);

    const customer = new Customer({
        id: faker.datatype.uuid(),
        name: faker.name.firstName(),
        age: faker.datatype.number({ min: 18, max: 50 })
    });
    customers.push(customer);
}

const write = async (filename, data) => { // Adicionando async ao write para usar o await
    await writeFile(
        join(seederBaseFolder, filename),
        JSON.stringify(data, null, 2)
    );
};

(async () => {
    try {
        await write('cars.json', cars);
        await write('customers.json', customers);
        await write('carCategories.json', [carCategory]);

        console.log('Seed data has been generated successfully!');
    } catch (error) {
        console.error('Error generating seed data:', error);
    }
})();
