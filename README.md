# Player SDK1

## Structure

This repository consists of two packages:

  * `lib`: package containing the library
  * `docs`: package containing the documentation website

## Get started

You can run `npm run serve` from the root to trigger a build of the library and the documentation. 
This commands uses watchers, so you can continue working without running anything else.

## Running tests

In order to run the tests, you will need to run `npm run test --workspace lib`.

## Generate a new package

To generate a new package, all you have to do is run `npm version <major|minor|patch` on the master branch.

This will generate a new tag that will then trigger the Package GitHub action to create a release and publish to NPM.
