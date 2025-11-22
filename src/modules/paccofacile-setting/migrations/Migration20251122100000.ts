import { Migration } from "@mikro-orm/migrations"

// Migrazione iniziale per tabella paccofacile_setting
export class Migration20251122100000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      create table if not exists "paccofacile_setting" (
        "id" text not null primary key,
        "auto_payment" boolean not null default false,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz
      );
    `)
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "paccofacile_setting" cascade;')
  }
}
