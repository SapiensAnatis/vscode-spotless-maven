# vscode-spotless-maven

Very work-in-progress extension for providing Spotless formatting for Maven projects in Visual Studio Code.

## Current constraints:

1. Only Java is supported.
2. The extension runs using the very first `pom.xml` file it finds in the workspace, so complex projects with more than one `pom.xml` may produce unexpected results.
3. The formatting is extremely slow - about 1.5 seconds on the smallest test cases, which is only going get worse with bigger projects and files. This is likely to be because we spin up a new Maven process for every format, unlike the Gradle extension which sends requests to a Gradle server. The extension can optionally use `mvnd` via the config property `spotlessMaven.useMvnd`. `mvnd` runs as a server and using this setting has been observed to cut formatting times to around 0.2 seconds which feels much smoother and snappier. However this support is experimental (read: uses some nasty hacks) and requires installing `mvnd`.

## Install

### Download

This extension isn't on the Visual Studio Marketplace -- I'll publish it if/when I think it is a bit more ready for general use.

For now, you can download a VSIX from the Releases tab.

### Build from Source

You should be able to develop locally using the tasks in `launch.json`.

To build your own VSIX, run `pnpm run vsce:package`.
