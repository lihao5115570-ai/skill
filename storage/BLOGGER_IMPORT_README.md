# Blogger Import Files

Generated on 2026-08-14 from Kaogujia author search.

## Recommended Import Set

Use the strict teaching-makeup non-seller set first. It contains female Douyin authors that look more like makeup education/content accounts rather than sales-heavy accounts.

Filtering rules used:

- keyword source: `教化妆`
- removed shop accounts
- removed names with obvious store, selection, product-window, course, training, enrollment, or sales-conversion wording
- removed accounts with more than 10 products
- removed accounts with more than 10 live sessions
- removed high-GMV plus product-heavy accounts

Result:

- input search rows: 934
- kept rows: 420
- rejected rows: 514

Files:

- `kaogujia_teaching_makeup_non_sellers.csv`: readable strict table
- `kaogujia_teaching_makeup_non_sellers.json`: raw strict records
- `kaogujia_teaching_makeup_seller_rejects.csv`: rejected rows with reasons
- `teaching_makeup_non_seller_viewer.html`: local browser viewer
- `bloggers_teaching_makeup_non_sellers.sqlite`: local SQLite copy
- `kaogujia_bloggers_import_payload_teaching_makeup_non_sellers.json`: payload for `POST /api/bloggers/import`
- `kaogujia_bloggers_upsert_teaching_makeup_non_sellers.sql`: direct PostgreSQL upsert
- `blogger_import_batches_teaching_makeup_non_sellers/*.json`: API payload chunks, 200 records per batch

## API Import

After the backend and PostgreSQL database are running:

```powershell
$env:IMPORT_BATCH_DIR='storage\blogger_import_batches_teaching_makeup_non_sellers'
$env:BACKEND_IMPORT_URL='http://127.0.0.1:8000/api/bloggers/import'
& 'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\post_blogger_import_batches.mjs
```

## SQL Import

Run database migrations first, then import the strict set:

```sql
\i database/migrate_bloggers_selection_fields.sql
\i storage/kaogujia_bloggers_upsert_teaching_makeup_non_sellers.sql
```

## Other Sets

Older/broader sets are kept for reference only:

- `kaogujia_teaching_makeup_bloggers.*`: broader teaching-makeup set before strict seller cleanup
- `kaogujia_female_authors_priority.*`: older female + GMV priority set
- `kaogujia_female_authors_multi_sort.*`: broad female author set
