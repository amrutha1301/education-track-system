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

## Deploy to GitHub Pages

The GitHub Actions workflow deploys the site to [https://amrutha1301.github.io/education-track-system/](https://amrutha1301.github.io/education-track-system/) whenever a change is pushed to `main`, or when manually started from the repository's **Actions** tab.

1. In the repository settings, open **Pages** and set the build and deployment source to **GitHub Actions**.
2. Push this workflow and the site changes to the `main` branch. The workflow will build and publish the site.
3. If using Firebase, add each `VITE_FIREBASE_*` value from `.env.example` under **Settings > Secrets and variables > Actions > Variables**. They are public client configuration values embedded in the site, not secrets.
4. For Firebase sign-in, add `amrutha1301.github.io` under **Authentication > Settings > Authorized domains** in Firebase.

Without those Firebase variables, the deployed site runs in demo mode and stores records only in the current browser.

## Commands

- `npm run dev` starts the local development server.
- `npm run build` creates the production build.
- `npm run preview` serves the production build locally.