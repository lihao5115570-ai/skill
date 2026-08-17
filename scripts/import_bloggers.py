from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


def main() -> int:
    parser = argparse.ArgumentParser(description="Import Douyin blogger records into the backend.")
    parser.add_argument("--file", help="JSON or CSV file exported from the selection tool.")
    parser.add_argument("--api-url", help="Paginated selection-tool API URL.")
    parser.add_argument("--cookie", default=os.getenv("SELECTION_TOOL_COOKIE"), help="Login cookie for the selection tool.")
    parser.add_argument("--user-agent", default=os.getenv("SELECTION_TOOL_USER_AGENT", "Mozilla/5.0"))
    parser.add_argument("--method", choices=["GET", "POST"], default="GET")
    parser.add_argument("--body-json", default="{}", help="Base JSON body for POST requests.")
    parser.add_argument("--page-param", default="page", help="Page parameter name for the selection-tool API.")
    parser.add_argument("--size-param", default="pageSize", help="Page size parameter name for the selection-tool API.")
    parser.add_argument("--page-size", type=int, default=50)
    parser.add_argument("--max-pages", type=int, default=200)
    parser.add_argument("--female-only", action="store_true", help="Only import records whose Gender field is female.")
    parser.add_argument("--backend-url", default=os.getenv("BACKEND_URL", "http://127.0.0.1:8000/api/bloggers/import"))
    parser.add_argument("--platform", default="douyin")
    parser.add_argument("--output-file", help="Write fetched/loaded records to a JSON file before importing.")
    parser.add_argument("--skip-backend", action="store_true", help="Fetch and write records without posting to backend.")
    args = parser.parse_args()

    if not args.file and not args.api_url:
        parser.error("Provide --file or --api-url.")

    records = load_file(args.file) if args.file else fetch_pages(args)
    if args.output_file:
        Path(args.output_file).write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")

    if args.skip_backend:
        print(json.dumps({"records": len(records), "output_file": args.output_file}, ensure_ascii=False))
        return 0

    response = post_json(args.backend_url, {"platform": args.platform, "records": records}, headers={})
    print(json.dumps(response, ensure_ascii=False))
    return 0


def load_file(filename: str) -> list[dict[str, Any]]:
    path = Path(filename)
    if path.suffix.lower() == ".csv":
        with path.open("r", encoding="utf-8-sig", newline="") as stream:
            return list(csv.DictReader(stream))

    with path.open("r", encoding="utf-8") as stream:
        payload = json.load(stream)

    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        data = payload.get("records") or payload.get("data") or payload.get("list") or []
        return [item for item in data if isinstance(item, dict)]
    return []


def fetch_pages(args: argparse.Namespace) -> list[dict[str, Any]]:
    headers = {"User-Agent": args.user_agent, "Accept": "application/json, text/plain, */*"}
    if args.cookie:
        headers["Cookie"] = args.cookie

    records: list[dict[str, Any]] = []
    if args.method == "POST":
        headers["Content-Type"] = "application/json;charset=UTF-8"

    base_body = json.loads(args.body_json)

    for page in range(1, args.max_pages + 1):
        paging = {args.page_param: page, args.size_param: args.page_size}
        if args.method == "POST":
            payload = fetch_json(args.api_url, method="POST", headers=headers, body={**base_body, **paging})
        else:
            url = args.api_url + ("&" if "?" in args.api_url else "?") + urllib.parse.urlencode(paging)
            payload = fetch_json(url, method="GET", headers=headers)
        raw_batch = extract_records(payload)
        batch = raw_batch
        if args.female_only:
            batch = [record for record in batch if str(record.get("Gender") or record.get("gender") or "").strip() == "女"]
        if not raw_batch:
            break
        records.extend(batch)
        if len(raw_batch) < args.page_size:
            break

    return records


def fetch_json(url: str, method: str, headers: dict[str, str], body: dict[str, Any] | None = None) -> Any:
    data = None
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def post_json(url: str, body: dict[str, Any], headers: dict[str, str]) -> Any:
    merged_headers = {"Content-Type": "application/json;charset=UTF-8", **headers}
    return fetch_json(url, method="POST", headers=merged_headers, body=body)


def extract_records(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if not isinstance(payload, dict):
        return []

    for key in ("records", "rows", "list", "items", "BloggerDatas", "DataList", "data", "Data"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
        if isinstance(value, dict):
            nested = extract_records(value)
            if nested:
                return nested
    return []


if __name__ == "__main__":
    sys.exit(main())
