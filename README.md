# ROI Calculator

This is embedded as calculator on the swivle website.

It's embedded through the following piece of code in a custom HTML block in Wordpress:

<div id='roi-calculator'></div>
<link rel='stylesheet' href='/components/roi/bundle.css' type='text/css' media='all' />
<script type='text/javascript' src='/components/roi/bundle.js'></script>

The code doesn't work on Wordpress since the '/components' folder does not exist there. That '/components' folder is built and included in the deploy that happens after commits to staging and master.

## Get started

Install the dependencies...

```bash
yarn
```

...then start [Rollup](https://rollupjs.org):

```bash
yarn dev
```

Navigate to [localhost:5000](http://localhost:5000). You should see your app running. Edit a component file in `src`, save it, and reload the page to see your changes.

## Deploying

Build and deploy is automated as part of the normal website build process.
