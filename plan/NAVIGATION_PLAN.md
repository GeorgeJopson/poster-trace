The current Navigation relies on a single static NavBar.
In this refactor, I am going to split the NavBar implementation in two.

There are pages which don't required authentication to access, and pages which do require authentication to access. These will be placed in separate route-groups (and will have separate NavBar's as served to them through a layout).

The non-authenticated NavBar will be the currently implemented NavBar.

However, for authenticated pages, the navigation will instead look like the following:
![Example Navigation](Example%20Navigation.png)

It is implemented via a grid layout, providing a column for the navigation pane and a column for the content. The navigation pane will use sticky positioning to stick its content to the top.
There will also be two rows in this grid layout, one for the header content (which you can see in the images in the logo for the nav pane, and "grand opening" in the other) and then one for the main content.

The links in the nav pane will be laid out with flex layout.

Note, that the nav pane layout component should provide space for "page specific" navigation to be passed in. This will be used in cases like when a campaign is selected, and the user can choose between whether they want to "create" or go to the "analytics" page.

Therefore currently the page at src/app/dashboard/campaign/[campaignId]/page.tsx will have to have its own layout, which gets the campaign name of the campaign it is on, to use as the sub title of the little sub-box navigation section.

For mobile, instead there will be a thin column with an "expand" icon at the top. This will then open up a dialog box, which will have the same content as a regular nav bar.

To switch between these styles, use CSS to hide/show the correct element.

If you need any icons, take them from https://feathericons.com/