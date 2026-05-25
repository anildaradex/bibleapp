# Gemma Fine-Tuning — Passage Context Model

Goal: produce a Gemma checkpoint that, given a Bible passage reference + verse text, returns a short summary, historical/literary context, and cross-references — in the voice and theological frame of Precept Austin's commentary library.

## Base model
- Start: `gemma-2-2b-it` (small enough for eventual on-device via MLC / Core ML)
- Stretch: `gemma-2-9b-it` for cloud-tier quality

## Corpus plan
1. **Crawl** Precept Austin (respect robots.txt, rate-limit, save raw HTML).
2. **Resolve licensing per author** (see [../../docs/licensing.md](../../docs/licensing.md)). Drop anything not cleared.
3. **Parse** each page into `{book, chapter, verse_range, author, text, source_url}` records.
4. **Augment** with cleared public-domain commentaries (Henry, Spurgeon, Calvin, Barnes, Gill) keyed by passage.
5. **Synthesize training pairs**:
   - Input: `Passage: <ref>\n<verse text>\nTask: Summarize, give context, list cross-refs.`
   - Output: distilled summary derived from the commentary entry, with citation footer.

## Training
- Method: LoRA fine-tune (rank 16, alpha 32) on top of base Gemma
- Frame: Hugging Face `transformers` + `peft` + `trl` SFTTrainer
- Eval: 500-passage holdout + doctrinal-guardrail rubric (see [../../docs/doctrine-guardrails.md](../../docs/doctrine-guardrails.md))

## Serving
- Cloud: vLLM behind a small FastAPI service; iOS app calls via HTTPS
- On-device (later): convert to MLC or Core ML; quantize to 4-bit; ship as app resource or background-downloaded asset

## Status
Empty. Nothing crawled, nothing trained. This folder holds the plan, scripts, and (later) configs — no model weights or scraped HTML get committed.
