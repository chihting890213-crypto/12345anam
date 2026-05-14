-- ─── Flower Ordering System - Database Initialization ────────────────────────
-- This script runs automatically when the MySQL container starts for the first time.
-- Tables are created by Drizzle ORM migrations on app startup.
-- This file handles initial configuration only.

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Ensure the database uses UTF-8 for Chinese character support
ALTER DATABASE flower_ordering CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
