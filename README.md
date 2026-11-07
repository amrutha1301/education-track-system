# Udaan learning records

Udaan is a React dashboard for tracking learner progress. It uses Firebase Authentication and Realtime Database when Firebase is configured. Without Firebase settings, it runs in demo mode and stores sample records in the current browser.

## Firebase setup

1. Create a Firebase project and register a web app in the Firebase console.
2. Enable **Authentication > Sign-in method > Email/Password** and **Google**. Set a support email when enabling Google.
3. Create a **Realtime Database** and copy its database URL from the console.
4. Copy `.env.example` to `.env` and fill in the web app configuration values.
5. Database rules are maintained in `database.rules.json` and referenced by `firebase.json`. Publish them from the Firebase Console, or sign in with the Firebase CLI and run `firebase deploy --only database`.
6. Run `npm install` and `npm run dev`, then create an account in the app.

For local Google sign-in, open the app at `http://localhost:5174` and ensure `localhost` is listed under **Authentication > Settings > Authorized domains**. Add the deployed app's hostname there before using Google sign-in in production.

Each account's records are stored at `/users/{uid}/learners`. Demo records are not copied to Firebase. The Firebase web API key is public client configuration; Authentication and Database Rules provide access control. Do not use real children's records until your project rules and organizational privacy requirements have been reviewed.

## Commands

- `npm run dev` starts the local development server.
- `npm run build` creates the production build.
- `npm run preview` serves the production build locally.