# Firestore Security Specification

## Data Invariants
1. A scouting report must have a valid country and tactical rating.
2. A match result must have two teams and their scores.
3. A user can only modify their own profile in the `/users` collection.
4. News articles are read-only for most users (only admins can write, but for this app we'll assume they are generated/cached).

## The "Dirty Dozen" Payloads
1. Attempt to create a scouting report without a country.
2. Attempt to create a match result with a negative score.
3. Attempt to update another user's profile.
4. Attempt to delete a news article as a regular user.
5. Attempt to create a scouting report with a tactical rating > 100.
6. Attempt to inject a shadow field `isAdmin: true` into a user profile.
7. Attempt to update a news article's `date` to a future date.
8. Attempt to create a match result where `teamA` and `teamB` are the same.
9. Attempt to read `/users` collection as an unauthenticated user.
10. Attempt to spoof `uid` in a user profile update.
11. Attempt to bypass `isValidId` by using a 2KB string as a document ID.
12. Attempt to modify `createdAt` in a scouting report after initial creation.

## Test Runner (Logic Outline)
- Verify `PERMISSION_DENIED` for all above payloads.
- Verify `ALLOW` for valid creations and reads.
