# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2025-01-XX

### Breaking Changes

- **Minimum Ember version is now 4.12 LTS**
- **Minimum Node version is now 18**
- Migrated all components from classic Ember components to Glimmer components
- Changed component invocation from curly bracket `{{search-flow}}` to angle bracket `<SearchFlow />`
- All component properties are now arguments prefixed with `@`
- Actions are now passed as functions instead of using the `action` helper
- Removed dependency on `ember-decorators` (now using native decorators)

### Added

- Full Ember Octane support
- Glimmer component architecture with tracked properties
- Modern template syntax with `{{on}}` and `{{fn}}` helpers
- Embroider compatibility via `@embroider/test-setup`
- Support for Ember 4.12 LTS, 5.4 LTS, and Ember 6.x (including 6.4)
- Modern ESLint, Prettier, and template-lint configurations
- Accessibility improvements with `role` attributes on interactive elements
- Comprehensive upgrade guide (UPGRADE.md)
- Modern development tooling (EditorConfig, nvmrc)

### Changed

- Updated all dependencies to latest compatible versions
- Replaced `{{action}}` with `{{on "click"}}` in templates
- Updated test configuration to use modern Chrome headless
- Updated ember-try scenarios to test against Ember 4.12 LTS, 5.4 LTS, and latest
- Improved error handling in components
- Better TypeScript support through modern Ember patterns

### Removed

- Removed `ember-decorators` dependency
- Removed support for Ember versions below 4.12
- Removed support for Node versions below 18
- Removed Bower dependencies
- Removed PhantomJS test support

### Fixed

- Fixed reactivity issues with Glimmer components
- Improved memory management with proper cleanup in component lifecycle
- Fixed input width calculation for modern browsers

## [3.0.1] - Previous Release

- Previous version supporting Ember 3.x
- Classic component architecture
- Legacy template syntax

---

For upgrade instructions, see [UPGRADE.md](UPGRADE.md)

