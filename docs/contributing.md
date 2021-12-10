# Contributing Guide

Thanks for your interest in contributing to this project!

You can contribute in any of the following ways:

- Reporting bugs/filing feature requests
  [here](https://github.com/donew10100/today-api/issues/new/choose)
- Contributing code
- Spreading the word about this awesome project!

## Contributing Code

To contribute code, you can either pick a
[good first issue](https://github.com/donew10100/today-api/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3A%22good+first+issue%22)
or a
[feature request](https://github.com/donew10100/today-api/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3A%22enhancement%22)
and work on it. Feel free to ask for help on
[Github Discussions](https://github.com/donew10100/today-api/discussions/new) if
you are stuck anywhere.

### Setup

First, setup your environment as follows:

Install [`git`](https://github.com/git-guides/install-git),
[`node`](https://nodejs.org/en/download/package-manager/) and
[`pnpm`](https://pnpm.io/installation).

Then, fork the project
[on the GitHub website](https://github.com/donew10100/today-api) and clone your
fork locally:

```sh
$ git clone https://github.com/{your-username}/today-api
$ cd today-api
$ git remote add upstream https://github.com/donew10100/today-api.git
$ git fetch upstream
$ pnpm install
```

### Code

Create a branch to hold your work. The branch name should descriptive and be
prefixed with the type of change:

- `fix/`: A bug fix
- `feature/`: A new feature
- `docs/`: Documentation changes
- `perf/`: A code change that improves performance
- `refactor/`: A code change that neither fixes a bug nor adds a feature
- `test/`: A change to the tests
- `style/`: Changes that do not affect the meaning of the code (linting)
- `build/`: A change to the build system or dependency bumps

Then switch to the branch:

```sh
$ git checkout -b feature/add-awesome-new-feature -t upstream/main
```

The source code is in the [`source/`](../source/) folder and is structured as
follows:

```
source
├── index.ts
└── app.ts
```

The [`source/index.ts`](../source/index.ts) file contains only exports. The
server declaration is in the [`source/app.ts`](../source/app.ts) file.

The tests are in the [`test/`](../test/) folder and is structured as follows:

```
test
├── helpers
│  └── fixtures.ts
└── basic.test.ts
```

All tests must end with a `.test.ts` extension. Helper methods, for example, to
setup tests, can be stored in the [`test/helpers`](../test/helpers) folder.

Remember to heavily comment your code, add TSDoc comments where applicable
(methods/classes/constants/types), and make sure the tests pass!

If the linter points out issues, run `pnpm lint` to fix them automatically. If
you need to disable any lint rules, please make sure that it is really necessary
and there is absolutely no better way of writing that piece of code. Disable
lint checks for a certain line by typing the following before that line:

```ts
// eslint-disable-next-line some-lint-rule-id
```

It is recommended to keep your changes grouped logically within individual
commits. Many contributors find it easier to review changes that are split
across multiple commits. There is no limit to the number of commits in a pull
request. You can create a commit as follows:

```sh
$ git add my/changed/files
$ git commit
```

A good commit message should describe what changed and why. This project uses
[semantic commit messages](https://conventionalcommits.org/) to streamline the
release process.

Before a pull request can be merged, it **must** have a pull request title with
a semantic prefix.

Examples of commit messages with semantic prefixes:

- `perf: don't reload config everytime`
- `feat: add copy command`
- `docs: fix typo in readme.md`

Common prefixes:

- `fix`: A bug fix
- `feat`: A new feature
- `docs`: Documentation changes
- `perf`: A code change that improves performance
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: A change to the tests
- `style`: Changes that do not affect the meaning of the code (linting)
- `build`: Changes to the CI system or bumping a dependency

Other things to keep in mind when writing a commit message:

- The first line should:
  - contain a short description of the change (preferably 50 characters or less,
    and no more than 72 characters)
  - be entirely in lowercase with the exception of proper nouns, acronyms, and
    the words that refer to code, like function/variable names
- Keep the second line blank.
- Wrap all other lines at 72 columns.

Once you have committed your changes, it is a good idea to use `git rebase` (NOT
`git merge`) to synchronize your work with the `main` branch.

```sh
$ git fetch upstream
$ git rebase upstream/main
```

This ensures that your working branch has the latest changes from main branch
upstream. If any conflicts arise, resolve them and commit the changes again.

Once you have made all your changes and `pnpm test` reports no errors, begin the
process of opening a pull request by pushing your working branch to your fork on
GitHub.

```sh
$ git push -uf origin feature/add-awesome-new-feature
```

### Opening and Landing the Pull Request

From within GitHub, opening a
[new pull request](https://github.com/donew10100/today-api/compare) will present
you with a template that should be filled out.

You will probably get feedback or requests for changes to your pull request.
This is a big part of the submission process, so don't be discouraged! Some
contributors may sign off on the pull request right away. Others may have
detailed comments or feedback. This is a necessary part of the process in order
to evaluate whether the changes are correct and necessary.

To make changes to an existing pull request, make the changes to your local
branch, add a new commit with those changes, and push those to your fork. GitHub
will automatically update the pull request.

```sh
$ git add my/changed/files
$ git commit
$ git push origin feature/add-awesome-new-feature
```

Feel free to post a comment in the pull request to ping reviewers if you are
awaiting an answer on something.

**Approval and Request Changes Workflow**

All pull requests require approval from at least one maintainer in order to
land. Whenever a maintainer reviews a pull request they may request changes.
These may be small, such as fixing a typo, or may involve substantive changes.
Such requests are intended to be helpful, but at times may come across as abrupt
or unhelpful, especially if they do not include concrete suggestions on _how_ to
change them.

Try not to be discouraged. Try asking the maintainer for advice on how to
implement it. If you feel that a review is unfair, say so or seek the input of
another project contributor. Often such comments are the result of a reviewer
having taken insufficient time to review and are not ill-intended. Such
difficulties can often be resolved with a bit of patience. That said, reviewers
should be expected to provide helpful feedback.

In order to land, a pull request needs to be reviewed and approved by at least
one maintainer. After that, if there are no objections from other contributors,
the pull request can be merged.

**Congratulations and thanks a lot for your contribution!**
