# Beauty AI Platform

MVP project skeleton for a photo-driven beauty analysis and creator-makeup transfer product.

## Project Structure

```text
beauty-ai-platform/
├── README.md
├── docker-compose.yml
├── .env.example
├── package.json
├── frontend/
├── backend/
├── ai-service/
├── admin-panel/
├── database/
├── storage/
├── docs/
├── scripts/
└── infra/
```

## Architecture

- `frontend`: Next.js user app for upload, analysis results, creator matching, and migration guidance.
- `backend`: FastAPI service for APIs, analysis orchestration, and persistence.
- `ai-service`: FastAPI service for image analysis and AI model orchestration.
- `admin-panel`: Workspace reserved for the management console.
- `database`: SQL schema, migrations, and seed data.
- `storage`: Local development image storage.
- `docs`: Product scope and development notes.
- `scripts`: Local automation scripts.
- `infra`: Legacy local PostgreSQL compose file kept for compatibility.

## Version Roadmap

- V1: 用户注册、上传照片、AI脸型分析、推荐5个博主、输出报告。
- V2: 上传博主图片、AI分析妆容差异、生成个人方案。
- V3: 成长记录、会员体系、商品推荐。

## Local Development

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Start the main services:

```bash
docker compose up --build
```

Or start only PostgreSQL with the existing infra compose file:

```bash
docker compose -f infra/docker-compose.yml up -d
```

3. Start backend manually:

```bash
cd backend
python -m venv .venv
pip install -r requirements.txt
uvicorn app.main:app --reload
```

4. Start frontend manually:

```bash
cd frontend
npm install
npm run dev
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- AI service: `http://localhost:8100/health`
