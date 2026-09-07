MVP requires the following:
- [ ] A landing page which directs you to sign in/login
- [ ] An option for a user to create an account by connecting their Google login
- [ ] The user should be able to start a poster campaign. They should be able to upload a PNG, and position a QR code on it. Then they should be able to generate any number of posters (also png's) with QR code positioned on them.
- [ ] Each poster should have a unique QR code, which initially directs the user to PosterTrace (which logs the time of the scan/the poster which was scanned) and then immediately re-directs the user to the intended URL.
- [ ] An analytics dashboard should be able to be viewed, listing each poster and how many times it has been viewed (as well as aggregating these results into graphs).

To do this, I will need to do the following steps:
- [ ] Create landing page, and set up hosting (via Vercel). **Completed**
- [ ] Convert website to use TypeScript
- [ ] Set up a PostgreSQL database using Prisma Postgres as the provider, which I can interact with on a route to do CRUD interactions. Once I have got a database set up and have proven to myself how the database stuff works/practiced using it, then we can move on.
- [ ] Set up authentication with Google using NextJsAuth
- [ ] Create a way to create posters (the create new campaign page)
- [ ] Create a way for the QR codes to be re-directed to target destination (with hit counted)
- [ ] Create analytics dashboard to show hits.