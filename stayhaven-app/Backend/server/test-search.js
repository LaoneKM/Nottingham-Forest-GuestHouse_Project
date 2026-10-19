// Run with:  node test-search.js
// Checks the search logic WITHOUT the server and WITHOUT a database.

const guesthouses = require('./data/guesthouses');
const { searchGuesthouses } = require('./utils/search');

let checks = 0;

function check(name, condition) {
  checks = checks + 1;
  if (condition) {
    console.log('PASS - ' + name);
  } else {
    console.log('FAIL - ' + name);
    process.exitCode = 1;
  }
}

// 1. Nothing asked for: everything, cheapest first.
let answer = searchGuesthouses(guesthouses, {});
check('no filters returns all 8', answer.results.length === 8);
check('default order is cheapest first', answer.results[0].id === 'GH006');

// 2. City.
answer = searchGuesthouses(guesthouses, { city: 'Maun' });
check('city=Maun returns 2', answer.results.length === 2);

answer = searchGuesthouses(guesthouses, { city: 'maun' });
check('lowercase maun also returns 2', answer.results.length === 2);

// 3. Price.
answer = searchGuesthouses(guesthouses, { priceMax: '500' });
check('priceMax=500 returns 2', answer.results.length === 2);

answer = searchGuesthouses(guesthouses, { priceMin: '800', priceMax: '1300' });
check('price 800-1300 returns 3', answer.results.length === 3);

// 4. Rating.
answer = searchGuesthouses(guesthouses, { ratingMin: '4.5' });
check('ratingMin=4.5 returns 3', answer.results.length === 3);

// 5. Amenities.
answer = searchGuesthouses(guesthouses, { amenity: 'pool' });
check('amenity=pool returns 4', answer.results.length === 4);

// 6. Search box.
answer = searchGuesthouses(guesthouses, { search: 'river' });
check('search=river finds 2', answer.results.length === 2);

// 7. Sorting.
answer = searchGuesthouses(guesthouses, { sort: 'rating-desc' });
check('rating-desc puts 4.8 first', answer.results[0].rating === 4.8);

// 8. Filters combined.
answer = searchGuesthouses(guesthouses, { city: 'Maun', priceMax: '1000', amenity: 'pool' });
check('Maun + under 1000 + pool returns 1', answer.results.length === 1);
check('and it is GH001', answer.results[0].id === 'GH001');

// 9. Nonsense must not crash.
answer = searchGuesthouses(guesthouses, { priceMax: 'abc' });
check('priceMax=abc ignored, returns 8', answer.results.length === 8);

console.log('');
console.log(checks + ' checks run.');