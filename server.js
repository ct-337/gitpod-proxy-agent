const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const app = express();

app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing url parameter');

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Rewrite links
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('javascript:')) {
        const absolute = new URL(href, targetUrl).href;
        $(el).attr('href', `/proxy?url=${encodeURIComponent(absolute)}`);
      }
    });

    // Rewrite forms
    $('form[action]').each((_, el) => {
      const action = $(el).attr('action');
      if (action) {
        const absolute = new URL(action, targetUrl).href;
        $(el).attr('action', `/proxy?url=${encodeURIComponent(absolute)}`);
      }
    });

    res.setHeader('Content-Type', 'text/html');
    res.send($.html());
  } catch (err) {
    res.status(500).send(`Proxy error: ${err.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
