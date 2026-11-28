import { MerchantLogo } from "@/components/kallan/merchant-logo";
import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Bell, ChevronRight, Eye, EyeOff, Landmark, Plus, Sparkles, Target } from "lucide-react";
import { Page } from "@/components/kallan/page";
import { Money } from "@/components/kallan/money";
import { DemoBadge } from "@/components/kallan/badges";
import { CategoryIcon, categoryColor } from "@/components/kallan/category-icon";
import { ErrorState, LoadingCards } from "@/components/kallan/states";
import { UserAvatar } from "@/components/kallan/user-avatar";
import { useUnreadCount } from "@/components/kallan/app-shell";
import { Celebrate, readSeen, type CelebrationItem } from "@/components/kallan/celebrate";
import { useCountUp } from "@/lib/use-count-up";
import { useKallanChat } from "@/components/kallan/kallan-chat";
import { useHideValues, useMyProfile } from "@/modules/settings/queries";
import { cn } from "@/lib/utils";
import { firstName, formatBRL, formatDate, formatDateTime, formatPercent, greeting, monthLabel, toNumber } from "@/lib/format";
import { useFinanceData } from "../queries";
import type { FinanceData } from "../types";
import {
  cashVariation,
  categoryBreakdown,
  dataQuality,
  financialPosition,
  generateInsights,
  goalProgress,
  monthKeyOf,
  monthSummary,
  prevMonth,
} from "../calculations";
import { dueLabel, upcomingInvoices } from "../bills";
import { FinanceEditor } from "./editor";

const enter = (i: number) => ({ "--n": i }) as CSSProperties;

/** Splits the big balance into R$ / integer / cents, like the approved prototype. */
function BigValue({ value, hidden }: { value: number; hidden: boolean }) {
  const shown = useCountUp(value, !hidden, 1400);
  if (hidden) {
    return (
      <div className="k-hx-val" aria-label="Valor oculto">
        <small>R$</small>••••••
      </div>
    );
  }
  const [int = "0", dec = "00"] = Math.abs(shown).toFixed(2).split(".");
  return (
    <div className="k-hx-val" aria-label={formatBRL(value)}>
      {value < 0 ? "−" : ""}
      <small>R$</small>
      {Number(int).toLocaleString("pt-BR")}
      <span>,{dec}</span>
    </div>
  );
}

function Ring({ progress, size = 66, stroke = 8 }: { progress: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, progress));
  const h = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={h} cy={h} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
      <circle
        className="k-ringfill"
        cx={h}
        cy={h}
        r={r}
        fill="none"
        stroke="var(--foreground)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${v * c} ${c}`}
        transform={`rotate(-90 ${h} ${h})`}
      />
    </svg>
  );
}

function questionForInsight(id: string | undefined): string {
  if (!id) return "Como foi meu mês?";
  if (id.startsWith("goal-")) return "Como estão minhas metas?";
  if (id.startsWith("cat-up")) return "Onde estou gastando mais?";
  return "Como foi meu mês?";
}

/** Picks at most one real achievement that has not been celebrated yet. */
function HomeCelebration({ data, now }: { data: FinanceData; now: Date }) {
  const item = useMemo<CelebrationItem | null>(() => {
    const seen = new Set(readSeen());
    const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    for (const g of data.goals) {
      const doneAt = g.completed_at ? new Date(g.completed_at).getTime() : 0;
      if (doneAt >= weekAgo && goalProgress(g) >= 1 && !seen.has(`goal-${g.id}`)) {
        return { id: `goal-${g.id}`, title: "Meta batida!", text: `Você chegou em “${g.title}”. Isso é conquista sua.` };
      }
    }
    if (now.getDate() <= 10) {
      const prev = prevMonth(monthKeyOf(now));
      const sum = monthSummary(data.transactions, prev);
      const id = `month-${prev.year}-${prev.month}`;
      if (sum.income > 0 && sum.result > 0 && !seen.has(id)) {
        return { id, title: `Você fechou ${monthLabel(new Date(prev.year, prev.month, 1)).toLowerCase()} no azul`, text: "Entrou mais dinheiro do que saiu. Bom ritmo!" };
      }
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.goals, data.transactions]);
  return <Celebrate item={item} />;
}

export function Overview() {
  // Tint the browser's status bar like the hero while the home is open (restored on leave).
  useEffect(() => {
    const metas = [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];
    const previous = metas.map((m) => m.content);
    metas.forEach((m) => {
      m.content = "#17141f";
    });
    return () => metas.forEach((m, i) => {
      m.content = previous[i] ?? m.content;
    });
  }, []);
  const { data, mode, isLoading, isError, refetch } = useFinanceData();
  const { data: profile } = useMyProfile();
  const { data: unread = 0 } = useUnreadCount();
  const [hidden, toggleHidden] = useHideValues();
  const { openChat } = useKallanChat();
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [allCats, setAllCats] = useState(false);

  if (isError) return <Page><ErrorState onRetry={refetch} /></Page>;
  if (isLoading || !data) return <Page><LoadingCards /></Page>;

  const now = new Date();
  const ref = monthKeyOf(now);
  const position = financialPosition(data.accounts, data.investments, data.invoices, data.cards);
  const month = monthSummary(data.transactions, ref);
  const cats = categoryBreakdown(data.transactions, data.categories, ref);
  const insights = generateInsights(data, ref);
  const quality = dataQuality(data);
  const variation = cashVariation(data.snapshots, data.accounts, 30, now);
  const bills = upcomingInvoices(data, now);
  const goals = data.goals.filter((g) => g.status === "active");
  const catById = new Map(data.categories.map((c) => [c.id, c]));
  const recent = [...data.transactions]
    .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on) || b.created_at.localeCompare(a.created_at))
    .slice(0, 4);

  const fmt = (n: number) => (hidden ? "R$ ••••••" : formatBRL(n));
  const name = firstName(profile?.display_name);
  const used = month.income > 0 ? Math.min(1, month.expenses / month.income) : 0;
  const ratio = variation && variation.previous !== 0 ? variation.change / Math.abs(variation.previous) : null;

  // Donut
  const R = 62;
  const C = 2 * Math.PI * R;
  const catKey = (c: { categoryId: string | null }) => c.categoryId ?? "none";
  const selected = activeCat ? cats.find((c) => catKey(c) === activeCat) : undefined;
  let offset = 0;
  const segments = cats.map((c, idx) => {
    const len = c.share * C;
    const vis = Math.max(len - 3, 0.5);
    const key = catKey(c);
    const on = activeCat === key;
    const el = (
      <circle
        key={key}
        className={cn("seg", activeCat && !on && "dim")}
        cx={80}
        cy={80}
        r={R}
        fill="none"
        style={{ stroke: categoryColor(c.color), "--i": idx } as CSSProperties}
        strokeWidth={on ? 24 : 20}
        strokeDasharray={`${vis} ${C - vis}`}
        strokeDashoffset={-offset}
        transform="rotate(-90 80 80)"
        tabIndex={0}
        role="button"
        aria-label={`${c.name}: ${fmt(c.total)}`}
        onClick={() => setActiveCat(on ? null : key)}
        onKeyDown={(e: KeyboardEvent<SVGCircleElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setActiveCat(on ? null : key);
          }
        }}
      />
    );
    offset += len;
    return el;
  });
  const biggest = cats[0];
  const visibleCats = allCats ? cats : cats.slice(0, 4);

  const pillText = ratio !== null
    ? `Saldo em contas ${ratio >= 0 ? "+" : "−"}${formatPercent(Math.abs(ratio))} em 30 dias`
    : mode === "demo"
      ? "Posição ilustrativa"
      : quality.lastUpdate
        ? `Atualizado em ${formatDateTime(quality.lastUpdate)}`
        : "Ainda não há saldos registrados";
  const hour = now.getHours();
  const tod = hour < 5 ? "night" : hour < 10 ? "dawn" : hour < 17 ? "day" : hour < 20 ? "dusk" : "night";
  const mood =
    month.income > 0
      ? used <= 0.7
        ? "Seu mês está no ritmo"
        : used <= 1
          ? "Fique de olho nos gastos do mês"
          : "Você gastou mais do que recebeu"
      : "Bem-vindo de volta";
  const PillIcon = ratio !== null && ratio < 0 ? ArrowDownRight : ArrowUpRight;

  return (
    <div className="k-home k-enter">
      {mode !== "demo" && <HomeCelebration data={data} now={now} />}
      <div style={enter(0)}>
        <div className="k-hx" data-tod={tod}>
          <i className="k-hx-orb" aria-hidden="true" />
          <i className="k-hx-orb two" aria-hidden="true" />
          <svg className="k-hx-waves" viewBox="0 0 400 220" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="kwg" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#7c4dff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#b79cff" stopOpacity="0.9" />
                <stop offset="1" stopColor="#7c4dff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className="w1" d="M0 150 C 60 110, 120 190, 200 140 S 340 100, 400 150" />
            <path className="w2" d="M0 170 C 70 130, 130 200, 210 160 S 330 120, 400 170" />
            <path className="w3" d="M0 125 C 80 90, 140 160, 220 120 S 320 85, 400 125" />
          </svg>
          <div className="k-hx-top">
            <Link to="/perfil" className="k-hx-id" aria-label="Abrir perfil">
              <span className="k-hx-av">
                <UserAvatar name={profile?.display_name} path={profile?.avatar_url} className="size-full bg-transparent text-[19px] text-[#0a0a0b]" />
              </span>
              <span className="k-hx-hi">
                <small>{mood}</small>
                <b>{greeting(now)}, {name || "bem-vindo"}</b>
              </span>
            </Link>
            <Link to="/notificacoes" className="k-hx-bell" aria-label={unread ? `Notificações, ${unread} não lidas` : "Notificações"}>
              <Bell />
              {unread > 0 && <i className="k-hx-dot" />}
            </Link>
          </div>

          <div className="k-hx-bal">
            <div className="k-hx-lab">
              Patrimônio financeiro
              <button type="button" className="k-hx-eye" onClick={toggleHidden} aria-label={hidden ? "Mostrar valores" : "Ocultar valores"} aria-pressed={hidden}>
                {hidden ? <EyeOff /> : <Eye />}
              </button>
            </div>
            <BigValue value={position.netWorth} hidden={hidden} />
            <div className="k-hx-pill">
              <PillIcon />
              {pillText}
            </div>
          </div>

          <div className="k-hx-acts">
            <FinanceEditor entity="transaction">
              <button type="button" className="k-hx-act pri">
                <span className="k-hx-ai"><Plus /></span>
                <span>Registrar</span>
              </button>
            </FinanceEditor>
            <Link to="/open-finance" className="k-hx-act">
              <span className="k-hx-ai"><Landmark /></span>
              <span>Conectar</span>
            </Link>
            <Link to="/metas" className="k-hx-act">
              <span className="k-hx-ai"><Target /></span>
              <span>Metas</span>
            </Link>
            <button type="button" className="k-hx-act" onClick={() => openChat()}>
              <span className="k-hx-ai"><Sparkles /></span>
              <span>Kallan</span>
            </button>
          </div>
        </div>
      </div>

      <div style={enter(1)} className="k-assets">
        <div className="k-card">
          <div className="k-sum">
            <div>
              <small>Em contas</small>
              <b><Money count value={position.availableCash} /></b>
            </div>
            <div>
              <small>Investido</small>
              <b><Money count value={position.investmentsTotal} /></b>
            </div>
          </div>
          {position.obligations > 0 && (
            <p className="px-6 pb-4 text-[13px] text-muted-foreground">
              O patrimônio já desconta {fmt(position.obligations)} em faturas
              {position.overdueInvoices > 0 ? `, sendo ${fmt(position.overdueInvoices)} vencidas` : " em aberto"}.
            </p>
          )}
        </div>
      </div>

      <div style={enter(2)}>
        {mode === "demo" && (
          <div className="mt-4">
            <DemoBadge />
          </div>
        )}
        <div className={cn("k-ins-strip", insights.length > 1 && "multi")} aria-label="Insights da Kallan">
          {(insights.length ? insights.slice(0, 4) : [null]).map((ins) => (
            <button key={ins?.id ?? "intro"} type="button" className="k-insight" onClick={() => openChat(questionForInsight(ins?.id))}>
              <span className="k-orb">
                <Sparkles />
              </span>
              <span className="k-insight-body">
                <b>{ins ? ins.title : "Kallan Intelligence"}</b>
                <p>
                  {ins
                    ? ins.explanation
                    : "Pergunte sobre seus gastos, vencimentos e metas. Com mais registros, a Kallan aponta tendências com segurança."}
                </p>
              </span>
              <ChevronRight />
            </button>
          ))}
        </div>
      </div>

      <section style={enter(3)}>
        <div className="k-sec">
          <h2>Resumo do mês</h2>
          <small>{monthLabel(now)}</small>
        </div>
        <div className="k-card k-month">
          <div className="k-m-top">
            <div>
              <small><i className="k-dt in" />Entradas</small>
              <b><Money count value={month.income} /></b>
            </div>
            <div>
              <small><i className="k-dt out" />Saídas</small>
              <b><Money count value={month.expenses} /></b>
            </div>
          </div>
          <div className="k-m-bar" role="img" aria-label={`Você gastou ${Math.round(used * 100)}% do que recebeu`}>
            <i style={{ width: `${(used * 100).toFixed(1)}%` }} />
          </div>
          <div className="k-m-foot">
            <span>{month.income > 0 ? `Você gastou ${Math.round(used * 100)}% do que recebeu` : "Sem entradas neste mês"}</span>
            <b>
              {month.result < 0 ? "−" : "+"} <Money value={Math.abs(month.result)} />
            </b>
          </div>
        </div>
      </section>

      <section style={enter(4)}>
        <div className="k-sec">
          <h2>Seus gastos</h2>
          <button type="button" className="k-lnk" onClick={() => openChat("Onde estou gastando mais?")}>
            Perguntar à Kallan
          </button>
        </div>
        {cats.length ? (
          <div className="k-card">
            <div className="k-donut-top">
              <div className="k-donut">
                <svg width="160" height="160" viewBox="0 0 160 160" role="group" aria-label="Gastos por categoria">
                  <circle cx={80} cy={80} r={R} fill="none" style={{ stroke: "var(--surface-2)" }} strokeWidth={20} />
                  {segments}
                </svg>
                <div className="k-donut-c">
                  {selected ? (
                    <>
                      <small>{selected.name}</small>
                      <b>{fmt(selected.total)}</b>
                      <small>{formatPercent(selected.share)} das saídas</small>
                    </>
                  ) : (
                    <>
                      <small>Saídas do mês</small>
                      <b>{fmt(month.expenses)}</b>
                      <small>{cats.length} {cats.length === 1 ? "categoria" : "categorias"}</small>
                    </>
                  )}
                </div>
              </div>
              <div className="k-donut-aside">
                <small>Maior gasto</small>
                <b>{biggest ? biggest.name : "—"}</b>
                <small>{biggest ? `${formatPercent(biggest.share)} das saídas` : "Sem saídas ainda"}</small>
              </div>
            </div>
            <div className="k-catrows">
              {visibleCats.map((c) => {
                const key = catKey(c);
                return (
                  <button key={key} type="button" className={cn("k-catrow", activeCat === key && "on")} onClick={() => setActiveCat(activeCat === key ? null : key)}>
                    <CategoryIcon icon={c.icon} color={c.color} className="size-[42px] rounded-[14px]" />
                    <span className="block min-w-0">
                      <span className="k-cr-top">
                        <span>{c.name}</span>
                        <span className="tabular">{fmt(c.total)}</span>
                      </span>
                      <span className="k-bar block">
                        <i style={{ width: `${(c.share * 100).toFixed(1)}%`, background: categoryColor(c.color) }} />
                      </span>
                    </span>
                    <span className="k-cr-pct">{Math.round(c.share * 100)}%</span>
                  </button>
                );
              })}
              {cats.length > 4 && (
                <button type="button" className="k-more" onClick={() => setAllCats(!allCats)}>
                  {allCats ? "Mostrar menos" : `Ver todas as ${cats.length} categorias`}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="k-card k-empty">
            <b>Nenhuma despesa registrada neste mês.</b>
            Registre suas saídas para ver para onde o dinheiro vai.
          </div>
        )}
      </section>

      <div style={enter(5)} className="k-cols">
        <section>
          <div className="k-sec">
            <h2>A vencer</h2>
            {bills.length > 0 && (
              <small>
                <Money value={bills.reduce((s, b) => s + b.amount, 0)} /> no total
              </small>
            )}
          </div>
          <div className="k-card k-list">
            {bills.length ? (
              bills.slice(0, 3).map((b) => (
                <Link key={b.id} to="/carteira" className="k-tx">
                  <CategoryIcon icon="receipt" color="slate" className="size-[42px] rounded-[14px]" />
                  <div className="k-tx-main">
                    <div className="k-tx-name">{b.name}</div>
                    <span className={cn("k-due", (b.overdue || b.days <= 5) && "soon")}>
                      {dueLabel(b.days)} · {formatDate(b.due, { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                  <div className="k-tx-amt"><Money value={b.amount} /></div>
                </Link>
              ))
            ) : (
              <div className="k-empty">
                <b>Tudo em dia.</b>
                Nenhuma fatura em aberto.
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="k-sec">
            <h2>Movimentações</h2>
            <Link to="/movimentacoes" className="k-lnk">Ver extrato</Link>
          </div>
          <div className="k-card k-list">
            {recent.length ? (
              recent.map((t) => {
                const cat = t.category_id ? catById.get(t.category_id) : undefined;
                const income = t.direction === "in";
                return (
                  <div key={t.id} className="k-tx">
                    <MerchantLogo description={t.description} size={42} className="rounded-[14px]" fallback={<CategoryIcon icon={cat?.icon} color={cat?.color} className="size-[42px] rounded-[14px]" />} />
                    <div className="k-tx-main">
                      <div className="k-tx-name">{t.description}</div>
                      <div className="k-tx-meta">
                        {formatDate(t.occurred_on, { day: "2-digit", month: "short" })}
                        {t.institution_name ? ` · ${t.institution_name}` : ""} · {cat?.name ?? "Sem categoria"}
                      </div>
                    </div>
                    <div className={cn("k-tx-amt", income && "in")}>
                      {income ? "+" : "−"} <Money value={Math.abs(toNumber(t.amount))} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="k-empty">
                <b>Nenhuma movimentação ainda.</b>
                Use o botão Registrar para anotar a primeira.
              </div>
            )}
          </div>
        </section>
      </div>

      <section style={enter(6)}>
        <div className="k-sec">
          <h2>Suas metas</h2>
          <Link to="/metas" className="k-lnk">Ver todas</Link>
        </div>
        {goals.length ? (
          <div className="k-strip">
            {goals.map((g) => {
              const p = goalProgress(g);
              return (
                <Link key={g.id} to="/metas" className="k-gcard">
                  <span className="k-ringbox">
                    <Ring progress={p} />
                    <b>{Math.round(p * 100)}%</b>
                  </span>
                  <span>
                    <b>{g.title}</b>
                    <small>{fmt(toNumber(g.current_amount))} de {fmt(toNumber(g.target_amount))}</small>
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <Link to="/metas" className="k-card k-empty block">
            <b>Defina seu primeiro objetivo.</b>
            Uma meta com valor e prazo ajuda a Kallan a mostrar o caminho.
          </Link>
        )}
      </section>
    </div>
  );
}
