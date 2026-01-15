.PHONY: install build clean test

install:
	npm install

build:
	npm run build

clean:
	rm -rf dist

test:
	npm test
