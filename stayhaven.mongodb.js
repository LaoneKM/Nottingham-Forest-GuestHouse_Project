use("stayhaven");

const id = { bsonType: "string", maxLength: 9 };

db.createCollection("customers", { validator: { $jsonSchema: {
  bsonType: "object",
  required: ["CUSTOMER_ID", "CUSTOMER_NAME", "CUSTOMER_EMAIL", "PASSWORD_HASH"],
  additionalProperties: false,
  properties: {
    _id: { bsonType: "objectId" },
    CUSTOMER_ID: id,
    CUSTOMER_NAME: { bsonType: "string" },
    CUSTOMER_EMAIL: { bsonType: "string" },
    PASSWORD_HASH: { bsonType: "string" }
  }
}}});

db.createCollection("admins", { validator: { $jsonSchema: {
  bsonType: "object",
  required: ["ADMIN_ID", "ADMIN_NAME", "ADMIN_EMAIL", "PASSWORD_HASH"],
  additionalProperties: false,
  properties: {
    _id: { bsonType: "objectId" },
    ADMIN_ID: id,
    ADMIN_NAME: { bsonType: "string" },
    ADMIN_EMAIL: { bsonType: "string" },
    PASSWORD_HASH: { bsonType: "string" }
  }
}}});

db.createCollection("guesthouses", { validator: { $jsonSchema: {
  bsonType: "object",
  required: ["GUESTHOUSE_ID", "GUESTHOUSE_NAME", "GUESTHOUSE_DESCRIPTION", "LOCATION", "CONTACT_DETAILS"],
  additionalProperties: false,
  properties: {
    _id: { bsonType: "objectId" },
    GUESTHOUSE_ID: id,
    GUESTHOUSE_NAME: { bsonType: "string" },
    GUESTHOUSE_LOGO: { bsonType: "string" },
    GUESTHOUSE_DESCRIPTION: { bsonType: "string" },
    LOCATION: { bsonType: "object" },
    CONTACT_DETAILS: { bsonType: "string" },
    PRICE_PER_NIGHT: { bsonType: ["double", "int"] },
    CITY: { bsonType: "string" },
    COUNTRY: { bsonType: "string" },
    GALLERY: { bsonType: "array", items: { bsonType: "string" } },
    AMENITIES: { bsonType: "array", items: { bsonType: "string" } },
    RATING: { bsonType: ["double", "int"] },
    FAVOURITES: { bsonType: ["int", "long"] }
  }
}}});

db.createCollection("favourites", { validator: { $jsonSchema: {
  bsonType: "object",
  required: ["FAVOURITE_ID", "GUESTHOUSE_ID", "CUSTOMER_ID"],
  additionalProperties: false,
  properties: {
    _id: { bsonType: "objectId" },
    FAVOURITE_ID: id,
    GUESTHOUSE_ID: id,
    CUSTOMER_ID: id
  }
}}});

db.createCollection("ratings", { validator: { $jsonSchema: {
  bsonType: "object",
  required: ["RATING_ID", "GUESTHOUSE_ID", "CUSTOMER_ID", "RATING"],
  additionalProperties: false,
  properties: {
    _id: { bsonType: "objectId" },
    RATING_ID: id,
    GUESTHOUSE_ID: id,
    CUSTOMER_ID: id,
    RATING: { bsonType: ["double", "int"] },
    COMMENT: { bsonType: "string" }
  }
}}});