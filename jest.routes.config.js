module.exports = {
  roots: ['<rootDir>/src/test/routes'],
  testRegex: '(/src/test/.*|\\.(test|spec))\\.(ts|js)$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': ['ts-jest', {
      tsconfig: '<rootDir>/src/test/tsconfig.json',
      // ignore missing type definition errors
      diagnostics: {
        ignoreCodes: [2593, 2304, 7016]
      }
    }],
  },
};
