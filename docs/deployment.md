# Deploying The Server To Firebase Functions

This guide assumes you have
[NodeJS 16.x](https://nodejs.org/en/download/package-manager/),
[PNPM 6.x](https://pnpm.io/installation) and
[Git 2.x](https://github.com/git-guides/install-git) installed.

First, we must install the Firebase CLI and sign in to Firebase. Open a terminal
and run the following commands:

```bash
> pnpm i -g firebase-tools
> firebase login
```

Once you are logged in to Firebase, clone this repository:

```bash
> git clone git@github.com:donew10100/today-api.git donew/today-api
```

Then install the required dependencies using PNPM:

```bash
> cd donew/today-api
> pnpm install
```

To run the server locally, run the following:

```
> pnpm start
```

This will start the server at http://localhost:5000 and use a Firebase emulator
instead of touching the real project. This local server instance will **NOT**
retrieve, create, modify or delete any data from the real project in Firebase.
All the data stored in the emulator will be deleted when the server is shut
down. You can view the emulator at http://localhost:4000.

To deploy the server to Firebase Functions, run:

```
> pnpm deploy
```

This will deploy the server to Firebase Functions in production mode, which
means it will use the real project in Firebase as its backend.
