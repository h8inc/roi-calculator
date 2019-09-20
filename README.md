# ROI Calculator

Interactive content in the marketing mix?

It's like a giveaway of cheese bites or juice in the supermarket.

It gives you an idea of the value in using a product with minimum commitment.

Calculators, in particular, do an amazing job in the middle of the funnel.

Let's face it, the ability of a product to save you time or make you money makes or breaks a deal.

So how do we build such a straightforward content piece?

One way could be to use Outgrow, which offers plenty of premade layouts, but in my opinion, is not highly customizable or ideal for complex calculations or corporate clients.

That's why we used something else

Enter Svelte - it's helps you build WebApps fast and compiles into JavaScript.

With basic HTML and JavaScript you could go a long way and build an app or get someone from your dev team to help given the simplicity.

https://www.swivle.com/industries-agency/

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
