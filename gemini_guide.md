# OpenAI-Compatible Provider Integration Guide (Groq, OpenRouter, OpenAI, Gemini)

This guide explains how to connect your Digital Twin to **any OpenAI-compatible API provider** (such as OpenRouter for free open-source models, Groq for ultra-fast Llama-3 access, or OpenAI directly).

---

## 1. Quick Start Guide

### Step 1: Open [secrets.tfvars](file:///Users/atharmushtaq/projects/twin/terraform/secrets.tfvars)
Configure your chosen provider by editing the values:
```hcl
openai_api_key  = "your-api-key-here"
openai_api_base = "https://openrouter.ai/api/v1" # or https://api.groq.com/openai/v1
openai_model_id = "meta-llama/llama-3-8b-instruct:free" # or llama-3.3-70b-versatile
```

### Step 2: Deploy your backend
Run the deployment script at the project root:
```bash
./scripts/deploy.sh dev
```
*(The script automatically detects your `secrets.tfvars` file and injects the variables safely into AWS Lambda).*

---

## 2. Recommended Open-Source Providers

Here are two popular options to use high-quality open-source models (like Llama-3) for free or at very low cost:

### Option A: OpenRouter (Generous Free Tier)
OpenRouter provides unified access to open-source models, including some that are completely free.
1. Sign up at [openrouter.ai](https://openrouter.ai/).
2. Create an API Key.
3. Configure `secrets.tfvars`:
   ```hcl
   openai_api_key  = "sk-or-v1-..."
   openai_api_base = "https://openrouter.ai/api/v1"
   openai_model_id = "meta-llama/llama-3-8b-instruct:free"
   ```

### Option B: Groq (Ultra-Fast Speeds)
Groq offers the fastest inference speeds for open-source models and currently has a free developer plan.
1. Sign up at [console.groq.com](https://console.groq.com/).
2. Create an API Key.
3. Configure `secrets.tfvars`:
   ```hcl
   openai_api_key  = "gsk_..."
   openai_api_base = "https://api.groq.com/openai/v1"
   openai_model_id = "llama-3.3-70b-versatile"
   ```

---

## 3. How It Works Under the Hood

### Files Modified:

* **[secrets.tfvars](file:///Users/atharmushtaq/projects/twin/terraform/secrets.tfvars)**: A gitignored file that contains your sensitive API credentials. It is never uploaded to GitHub.
* **[terraform/variables.tf](file:///Users/atharmushtaq/projects/twin/terraform/variables.tf)**: Defines the new configuration variables (`openai_api_key`, `openai_api_base`, `openai_model_id`).
* **[terraform/main.tf](file:///Users/atharmushtaq/projects/twin/terraform/main.tf)**: Passes these variables as environment variables into your AWS Lambda function configuration.
* **[backend/server.py](file:///Users/atharmushtaq/projects/twin/backend/server.py)**: 
  * Checks if `OPENAI_API_KEY` is present.
  * If it is, it initializes the `openai` client using your configured custom `base_url` (meaning it automatically routes calls to OpenRouter, Groq, etc.).
  * If the key is absent, it falls back to **AWS Bedrock**.
