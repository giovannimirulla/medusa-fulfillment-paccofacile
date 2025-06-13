import { Migration } from '@mikro-orm/migrations';

export class Migration20250403190832 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "paccofacile_settings" ("name" text not null, "value" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "paccofacile_settings_pkey" primary key ("name"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_paccofacile_settings_deleted_at" ON "paccofacile_settings" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "paccofacile_settings" cascade;`);
  }

}
