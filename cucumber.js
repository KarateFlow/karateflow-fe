process.env.TS_NODE_COMPILER_OPTIONS = '{"module":"commonjs"}';
module.exports = {
  default: {
    paths: ['e2e/features/**/*.feature'],
    require: ['e2e/steps/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: ['progress-bar', 'html:e2e/cucumber-report.html'],
    publishQuiet: true
  }
}
