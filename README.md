# ESI Edge Function

This is a simple implementation of the basic <esi:include> tag, with an edge function.

Let's you use includes from a HTML file:

```
<!DOCTYPE html>
<html>
    <head>
        <title>Testing ESI Includes</title>
    </head>
    <body>
        <h1>Testing ESI Includes</h1>
        <p>Testing ESI Includes</p>
        <esi:include src="/includes/include.html" />
    </body>
</html>
```

Currently requires the includes to live under the `/includes/` path prefix to avoid running the edge function both for the main HTML and each include.

The ESI stiching happens behind Netlify's edge cache, so the resulting document is cached after being stiched together.

To change this behavior (in case your includes are dynamic and need a cache lift cycle that's independent from the main HTML) remove the `cache: "manual"` setting from the `config` exported from `netlify/edge-functions/esi.ts`.
