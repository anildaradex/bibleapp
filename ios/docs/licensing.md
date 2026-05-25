# Translation & Commentary Licensing

Before public release, the following must be in place. **Do not ship without these.**

## NKJV
- Rights holder: Thomas Nelson / HarperCollins Christian Publishing
- Required: Commercial app license + per-install or revenue-share agreement
- Contact: https://www.thomasnelson.com/about-us/permissions/
- Public-domain alternative for development: KJV (1769 Cambridge edition)

## NIV
- Rights holder: Biblica (text) / Zondervan (commercial publisher in NA)
- Required: API license via Bible Gateway / Biblica developer agreement, or full text license
- Contact: https://www.biblica.com/resources/bible-faqs/permissions-information/
- Note: NIV terms are stricter than NKJV; budget time for negotiation

## Precept Austin commentaries (for Gemma fine-tuning)
- Site: https://www.preceptaustin.org/
- Content is largely curated/quoted from other authors (MacArthur, Wiersbe, Spurgeon, etc.)
- **You must contact Precept Austin** (Bruce Hurt) before training a model on this corpus. Even if pages are publicly readable, redistributing model weights trained on them implicates the underlying authors' copyrights.
- For each quoted author, confirm whether their estate / publisher permits derivative AI use. Many do not.
- Public-domain alternative: train on Spurgeon, Matthew Henry, Calvin's commentaries (all PD) and only *cite* Precept Austin pages at inference time as a retrieval source under fair-use snippet rules.

## Recommended path for v1
1. Ship KJV (public domain) initially while NKJV/NIV deals close.
2. Train Gemma on a public-domain commentary corpus (Henry, Spurgeon, Calvin, Barnes, Gill).
3. Use Precept Austin as a *retrieval-time* citation source, surfacing short attributed snippets with deep links to preceptaustin.org.
4. Layer in NKJV/NIV + licensed modern commentaries once contracts are signed.
