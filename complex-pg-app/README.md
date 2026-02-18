# Complex PG App

## Requirements
- Node.js 20+
- PostgreSQL 14+

## Setup DB
Create a database and run migration:

```bash
createdb complexapp
psql "postgres://postgres:postgres@localhost:5432/complexapp" -f backend/sql/001_init.sql

