# vscode-spotless-maven

Very work-in-progress extension for providing Spotless formatting for Maven projects in Visual Studio Code.

## Current constraints:

1. The extension directly invokes `/usr/bin/mvn` so won't work on Windows or on Linux systems that install `mvn` to any other path
2. The extension runs using the very first `pom.xml` file it finds in the workspace, so complex projects with more than one `pom.xml` may produce unexpected results
3. The formatting is extremely slow - about 1.5 seconds on the smallest test cases, which is only going get worse with bigger projects and files. This is likely to be because we spin up a new Maven process for every format, unlike the Gradle extension which sends requests to a Gradle server. There is [mvnd](https://github.com/apache/maven-mvnd) which could help with this
