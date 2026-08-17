# AI Analysis Service

Independent service for image analysis, face attributes, style matching, and makeup-transfer model orchestration.

## Local Development

```bash
python -m venv .venv
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8100
```
