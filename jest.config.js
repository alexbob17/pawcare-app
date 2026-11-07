module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|firebase)',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/PawCare Mobile App UI Design/',
    '<rootDir>/PawCare Mobile App UI Design-v2/',
    '<rootDir>/pawcare-web/',
    '<rootDir>/dist/',
  ],
  setupFilesAfterEnv: [],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
};
