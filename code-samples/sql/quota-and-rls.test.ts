/**
 * Teste do SQL rodando num PostgreSQL de verdade, embutido no processo (PGlite, WebAssembly).
 * Sem Docker e sem conta em nenhum serviço: simulamos o schema `auth` e os papéis do Supabase.
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable
      as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated, service_role;
  `);
  await db.exec(readFileSync(new URL("./quota-and-rls.sql", import.meta.url), "utf8"));
  await db.exec(`grant select, insert, update, delete on all tables in schema public to authenticated, service_role;`);
  await db.exec(`insert into auth.users (id) values ('${A}'), ('${B}');`);
});

/** Executa `fn` "como" um papel do Supabase e volta ao normal no fim. */
async function asRole(role: string, sub: string | null, fn: () => Promise<void>) {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${sub ?? ""}', false);`);
  try { await fn(); } finally { await db.exec("reset role;"); }
}

describe("cota e isolamento de dados", () => {
  it("cria o perfil automaticamente quando o usuário se cadastra (trigger)", async () => {
    const r = await db.query<{ id: string }>("select id from public.profiles order by id");
    expect(r.rows.map((x) => x.id)).toEqual([A, B]);
  });

  it("reserva no máximo N vagas e depois recusa", async () => {
    await asRole("service_role", null, async () => {
      const results: boolean[] = [];
      for (let i = 0; i < 5; i++) {
        const r = await db.query<{ claim_plan_slot: boolean }>("select public.claim_plan_slot($1, 3)", [A]);
        results.push(r.rows[0].claim_plan_slot);
      }
      expect(results).toEqual([true, true, true, false, false]);
    });
  });

  it("devolve uma vaga e nunca deixa o contador negativo", async () => {
    await asRole("service_role", null, async () => {
      await db.query("select public.refund_plan_slot($1)", [A]);
      expect((await db.query<{ plans_used: number }>("select plans_used from public.profiles where id=$1", [A])).rows[0].plans_used).toBe(2);
      for (let i = 0; i < 3; i++) await db.query("select public.refund_plan_slot($1)", [B]);
      expect((await db.query<{ plans_used: number }>("select plans_used from public.profiles where id=$1", [B])).rows[0].plans_used).toBe(0);
    });
  });

  it("usuário logado NÃO consegue chamar as funções de cota (senão devolveria vagas para si)", async () => {
    await asRole("authenticated", A, async () => {
      await expect(db.query("select public.refund_plan_slot($1)", [A])).rejects.toThrow(/permission denied/i);
      await expect(db.query("select public.claim_plan_slot($1, 999)", [A])).rejects.toThrow(/permission denied/i);
    });
  });

  it("RLS: cada usuário só lê o que é seu; escrever direto é bloqueado", async () => {
    await asRole("service_role", null, async () => {
      for (const u of [A, B]) await db.query("insert into public.plans (user_id, goal, plan) values ($1, '10 km', '{}')", [u]);
    });
    await asRole("authenticated", A, async () => {
      const plans = await db.query<{ user_id: string }>("select user_id from public.plans");
      expect(plans.rows.map((r) => r.user_id)).toEqual([A]);

      expect((await db.query("update public.profiles set plans_used = 0 where id = $1", [A])).affectedRows).toBe(0);
      await expect(db.query("insert into public.plans (user_id, goal, plan) values ($1, 'x', '{}')", [A])).rejects.toThrow(/row-level security/i);
    });
  });
});
