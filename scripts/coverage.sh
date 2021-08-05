mkdir .coverage-reports

yarn compile
yarn coverage:local
mv coverage.json .coverage-reports/cov_0.json

yarn compile
yarn coverage:mainnet
mv coverage.json .coverage-reports/cov_1.json

./node_modules/.bin/istanbul-combine-updated -r html .coverage-reports/cov_0.json .coverage-reports/cov_1.json

rm -rf .coverage-reports
