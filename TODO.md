1) The PosterRow for "The Analytics" section, has posters which float above the navbar when hovered over (clearly a z-index issue) **Done**
2) Error:
```
AnalyticsSection.jsx:26 Image with src "/analytics-images/area-chart.png" has either width or height modified, but not the other. If you use CSS to change the size of your image, also include the styles 'width: "auto"' or 'height: "auto"' to maintain the aspect ratio.
```
**Done**
3) Break up components more sensibly for re-use
   1) Update button so the big button style is also included (only big button should have outline, but all filled in buttons should have the swoop effect on hover)
   2) Move components that will only apply to the landing page into the route.
4) Optimize bundle size, image loading, and website performance
5) Convert to using TypeScript