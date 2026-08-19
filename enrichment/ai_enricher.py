import os
import json
import logging
from typing import Dict, Any
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

# Primary model — fastest and most free-quota-friendly
GEMINI_MODEL = "gemini-2.5-flash-lite"
# Fallback chain if primary is quota-exhausted
GEMINI_FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
]


def get_enrichment_prompt(design_data: Dict[str, Any], taxonomy: Dict[str, Any]) -> str:
    """Builds the prompt sent to Gemini for SEO enrichment."""
    return f"""
You are an expert SEO specialist and data classifier for a Print-on-Demand (pSEO) website.
Given the following design data extracted from TeePublic, enrich it with SEO metadata and classify it using the provided taxonomy.

Design Data:
Title: {design_data.get('title')}
Description: {design_data.get('description')}
Tags: {design_data.get('tags')}

Taxonomy:
{json.dumps(taxonomy, indent=2)}

Please output a JSON object containing EXACTLY the following keys:
- niche (primary niche from taxonomy)
- secondary_niche (if applicable, else null)
- recipient (e.g. Dad, Mom, Friend, or null)
- occasion (e.g. Birthday, Christmas, or null)
- style (e.g. Retro Vintage, Funny Text, or null)
- theme (a short theme description)
- primary_keyword (the main SEO keyword phrase, 2-4 words)
- secondary_keyword (supporting keyword phrase)
- long_tail_keyword (a long-tail buyer search phrase)
- seo_title (title tag, ~60 characters max)
- h1 (the page's primary heading)
- meta_description (~155 characters, compelling and descriptive)
- image_alt (ALT text for the design image)
- canonical_url (URL path only, e.g. /design/cool-dinosaur-shirt)
- jsonld_type (Schema.org type, e.g. Product)

Respond ONLY with valid JSON. No markdown, no code block, just the JSON object.
"""


class AIEnricher:
    """Enriches scraped design data using the Google Gemini API."""

    def __init__(self, config):
        self.config = config
        # Prefer api_key from config.yaml; fall back to environment variable
        api_key = getattr(config, "api_key", "") or os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            logger.warning("GEMINI_API_KEY not set. AI enrichment will be skipped.")
        self.client = genai.Client(api_key=api_key) if api_key else None
        # Use model from config if provided, otherwise use module default
        self._active_model = getattr(config, "model", GEMINI_MODEL) or GEMINI_MODEL

    def _generate_with_fallback(self, prompt: str) -> str | None:
        """Tries the primary model then fallbacks on quota errors."""
        models_to_try = [self._active_model] + [
            m for m in GEMINI_FALLBACK_MODELS if m != self._active_model
        ]
        for model in models_to_try:
            try:
                response = self.client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.3,
                    ),
                )
                # Promote this model as active if it wasn't already
                if model != self._active_model:
                    logger.info(f"Switching active model to: {model}")
                    self._active_model = model
                return response.text
            except Exception as e:
                err = str(e)
                if "429" in err or "RESOURCE_EXHAUSTED" in err:
                    logger.warning(f"Model {model} quota exhausted, trying next fallback...")
                    continue
                raise
        logger.error("All Gemini models exhausted their quota.")
        return None

    def enrich(self, design_data: Dict[str, Any], taxonomy: Dict[str, Any]) -> Dict[str, Any]:
        """Calls Gemini to enrich a design record with SEO metadata."""
        if not self.config.enabled or not self.client:
            logger.debug("AI enrichment skipped (disabled or no API key).")
            return design_data

        prompt = get_enrichment_prompt(design_data, taxonomy)

        try:
            raw = self._generate_with_fallback(prompt)
            if raw:
                enriched_fields = json.loads(raw)
                design_data.update(enriched_fields)
                logger.info(f"Enriched design [{self._active_model}]: {design_data.get('title')}")
        except Exception as e:
            logger.error(f"AI enrichment failed for {design_data.get('design_id')}: {e}")

        return design_data
