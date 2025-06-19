// Basic random integer helper shared across tests and utilities
export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;