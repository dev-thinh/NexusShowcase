# Citation exports

The paper field accepts a complete DOI identifier (`10.1234/example.567`), `doi:…`, a DOI resolver URL or an ordinary HTTP(S) paper URL. Complete identifiers are normalized to HTTPS DOI URLs in draft and submission validation. The editor shows the identifier without requiring a resolver prefix. A suffix alone cannot identify a DOI.

For papers with a DOI, the citation modal obtains BibTeX, APA and IEEE exports from the DOI Foundation's public formatter (`https://citation.doi.org/format`). No API key is required. Only the DOI identifier is sent. The application proxies a fixed service host, allows only the three supported styles, rejects redirects and caches successful responses for a day. The modal requests a format when needed and reuses previously viewed formats. Failed requests can be retried; copying and downloading stay disabled until that DOI format is loaded.

BibTeX exports omit language, abstract, keywords, fabricated organization details and a URL that merely duplicates the DOI. Journal publisher metadata is omitted; necessary book/conference bibliographic fields remain. Pages use BibTeX double-hyphen ranges. Stored paper content and contributors are unchanged.

For papers without a DOI, exports use the metadata entered in the app. They do not invent authors, institutions, dates, volume/page data or a production website URL. Local author formatting retains the app's Vietnamese family-first name convention; DOI exports use registered publication author metadata. The DOI formatter determines the appropriate publication type and style details for DOI papers.
