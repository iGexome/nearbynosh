nearbynosh
==========

A small web app to help locate food trucks near you.

*San Francisco, CA only.*

##Setup:
* Acquire an API key for [Google Maps](https://developers.google.com/maps/documentation/javascript/tutorial#api_key)

##Post-mortem:
Given that this was hacked out over two evenings, there are many other improvements that could be made.
I also wasn't familiar with a handful of npm packages I used (memcached, geolib) and went down the path of importing a snapshot of data provided by [Socrata](https://data.sfgov.org/Permitting/Mobile-Food-Facility-Permit/rqzj-sfat) into mongodb, but held off in the interest of time.

**Front-end:**

* roll up JS / CSS, either as part of a build (via Grunt) or when the page is served
* allow for a control to expand/decrease the search radius
*
* work with a user-experience developer :)

**Backend:**

* Don't use a flatfile as a datastore, but load it into a database with the schema we want
* Support a healthcheck request
* serve gzipped content
* write tests against the API and the data object, mocked or real
*