module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true }],
    },
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
            useESM: true,
        },
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(webr)/)'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/tests/e2e/'
    ],
    testRunner: 'jest-circus/runner',
};
