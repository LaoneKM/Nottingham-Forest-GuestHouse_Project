function isNumber(value) {
  // Number("1000") gives 1000. Number("abc") gives NaN ("not a number").
  // Number.isFinite checks we really got a usable number.
  return Number.isFinite(Number(value));
}

function isProvided(value) {
  // ?city= with nothing after it arrives as "". Treat that like "not sent".
  if (value === undefined || value === '') return false;
  return true;
}

function buildSearchFilter(query) {
  const filter = {}; // no filter = "give me everything"

  if (isProvided(query.city)) {
    filter.city = query.city.trim().toLowerCase();
    // toLowerCase so "Maun" and "maun" find the same stays.
  }

  if (isProvided(query.country)) {
    filter.country = query.country.trim().toLowerCase();
  }

  if (isProvided(query.priceMin) && isNumber(query.priceMin)) {
    filter.priceMin = Number(query.priceMin);
  }

  if (isProvided(query.priceMax) && isNumber(query.priceMax)) {
    filter.priceMax = Number(query.priceMax);
  }

  if (isProvided(query.ratingMin) && isNumber(query.ratingMin)) {
    filter.ratingMin = Number(query.ratingMin);
  }

  if (isProvided(query.amenity)) {
    filter.amenity = query.amenity.trim().toLowerCase();
  }

  if (isProvided(query.search)) {
    filter.search = query.search.trim().toLowerCase();
  }

  // No sort asked for? Use "price-asc": cheapest first.
  // That is a rule from the project brief, not my preference.
  if (isProvided(query.sort)) {
    filter.sort = query.sort.trim().toLowerCase();
  } else {
    filter.sort = 'price-asc';
  }

  return filter;
}

function matches(guesthouse, filter) {
  // true if this ONE guesthouse passes every rule.

  if (filter.city) {
    // indexOf returns -1 when the text is not found.
    if (guesthouse.city.toLowerCase().indexOf(filter.city) === -1) return false;
  }

  if (filter.country) {
    if (guesthouse.country.toLowerCase().indexOf(filter.country) === -1) return false;
  }

  if (filter.priceMin !== undefined) {
    if (guesthouse.pricePerNight < filter.priceMin) return false;
  }

  if (filter.priceMax !== undefined) {
    if (guesthouse.pricePerNight > filter.priceMax) return false;
  }

  if (filter.ratingMin !== undefined) {
    if (guesthouse.rating < filter.ratingMin) return false;
  }

  if (filter.amenity) {
    // amenities is a list like ['wifi', 'pool'].
    // indexOf checks whether 'wifi' is inside that list.
    if (guesthouse.amenities.indexOf(filter.amenity) === -1) return false;
  }

  if (filter.search) {
    const inName = guesthouse.name.toLowerCase().indexOf(filter.search) !== -1;
    const inCity = guesthouse.city.toLowerCase().indexOf(filter.search) !== -1;
    // || means "either one is enough".
    if (!inName && !inCity) return false;
  }

  return true; // passed everything
}

function sortResults(list, sort) {
  // slice() makes a COPY. sort() rearranges the array it is called on,
  // and we do not want to scramble the original data by accident.
  const copy = list.slice();

  if (sort === 'price-desc') {
    copy.sort((a, b) => b.pricePerNight - a.pricePerNight);
  } else if (sort === 'rating-desc') {
    copy.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'name-asc') {
    copy.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    copy.sort((a, b) => a.pricePerNight - b.pricePerNight); // cheapest first
  }

  return copy;
}

function searchGuesthouses(data, query) {
  const filter = buildSearchFilter(query);

  // Keep only the guesthouses that match...
  const filtered = data.filter((guesthouse) => matches(guesthouse, filter));

  // ...then put them in order.
  const results = sortResults(filtered, filter.sort);

  return { results, filter };
}

module.exports = { searchGuesthouses, buildSearchFilter, matches, sortResults };