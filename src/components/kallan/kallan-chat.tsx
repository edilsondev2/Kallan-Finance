import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, Briefcase, ChevronRight, Clock, Landmark, Mic, Plus, Receipt, Settings, Sparkles, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useUserId } from "@/modules/auth/auth-context";
import { financeQueryOptions, selectFinanceData } from "@/modules/finance/queries";
import { useHideValues, useMyProfile, useSettings } from "@/modules/settings/queries";
import { buildReply, SUGGESTIONS, type Block, type MiniRow } from "@/modules/intelligence/chat-replies";
import { firstName } from "@/lib/format";
import { CategoryIcon } from "./category-icon";
import { KallanGlyph } from "./logo";

type Msg = { id: number; role: "user" | "bot"; text?: string; blocks?: Block[] };
type Convo = { title: string; messages: Msg[] };

type ChatContextValue = {
  isOpen: boolean;
  /** Opens Kallan Intelligence; an optional question is sent as soon as the numbers are ready. */
  openChat: (question?: string) => void;
  closeChat: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function useKallanChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useKallanChat must be used inside <KallanChatProvider>.");
  return ctx;
}

export function KallanChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [convos, setConvos] = useState<Convo[]>([]);
  const nextId = useRef(1);

  const openChat = useCallback((question?: string) => {
    if (question) setPending(question);
    setOpen(true);
  }, []);
  const closeChat = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ isOpen, openChat, closeChat }), [isOpen, openChat, closeChat]);

  return (
    <ChatContext.Provider value={value}>
      {children}
      {isOpen && (
        <ChatOverlay
          messages={messages}
          setMessages={setMessages}
          convos={convos}
          setConvos={setConvos}
          nextId={nextId}
          pending={pending}
          clearPending={() => setPending(null)}
          onClose={closeChat}
        />
      )}
    </ChatContext.Provider>
  );
}

function titleOf(messages: Msg[]): string {
  return messages.find((m) => m.role === "user")?.text ?? "Conversa";
}

function MiniList({ rows }: { rows: MiniRow[] }) {
  return (
    <div className="k-mini">
      {rows.map((r, i) => (
        <div key={`${r.label}-${i}`} className="k-mini-row">
          <CategoryIcon icon={r.icon} color={r.color} className="size-[34px] rounded-xl" />
          <div>
            <div className="k-mini-top">
              <span>{r.label}</span>
              <b>{r.value}</b>
            </div>
            {r.sub && <small className="k-muted">{r.sub}</small>}
          </div>
        </div>
      ))}
    </div>
  );
}

function Blocks({ blocks, onAsk, onNavigate }: { blocks: Block[]; onAsk: (q: string) => void; onNavigate: () => void }) {
  return (
    <>
      {blocks.map((blk, i) => {
        if (blk.kind === "p") {
          return (
            <p key={i}>
              {blk.parts.map((part, k) => (typeof part === "string" ? <Fragment key={k}>{part}</Fragment> : <b key={k}>{part.b}</b>))}
            </p>
          );
        }
        if (blk.kind === "mini") return <MiniList key={i} rows={blk.rows} />;
        return (
          <div key={i} className="k-acts">
            {blk.acts.map((a) =>
              a.ask ? (
                <button key={a.label} type="button" className="k-chip" onClick={() => onAsk(a.ask ?? a.label)}>
                  {a.label}
                </button>
              ) : (
                <Link key={a.label} to={a.to ?? "/inicio"} className="k-chip" onClick={onNavigate}>
                  {a.label}
                </Link>
              ),
            )}
          </div>
        );
      })}
    </>
  );
}

type OverlayProps = {
  messages: Msg[];
  setMessages: React.Dispatch<React.SetStateAction<Msg[]>>;
  convos: Convo[];
  setConvos: React.Dispatch<React.SetStateAction<Convo[]>>;
  nextId: React.MutableRefObject<number>;
  pending: string | null;
  clearPending: () => void;
  onClose: () => void;
};

function ChatOverlay({ messages, setMessages, convos, setConvos, nextId, pending, clearPending, onClose }: OverlayProps) {
  const userId = useUserId();
  const finance = useQuery(financeQueryOptions(userId));
  const settings = useSettings();
  const { data: profile } = useMyProfile();
  const [hidden] = useHideValues();
  const name = firstName(profile?.display_name);

  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [sheet, setSheet] = useState<null | "menu" | "history">(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  const ready = !finance.isLoading && !settings.isLoading;
  const resolved = useMemo(
    () => (finance.data ? selectFinanceData(finance.data, settings.data?.show_demo ?? true) : null),
    [finance.data, settings.data?.show_demo],
  );

  const ask = useCallback(
    (raw: string) => {
      const q = raw.trim();
      if (!q) return;
      setMessages((m) => [...m, { id: nextId.current++, role: "user", text: q }]);
      setTyping(true);
      const id = window.setTimeout(() => {
        const blocks = buildReply(q, {
          data: resolved?.data ?? null,
          mode: resolved?.mode ?? "empty",
          now: new Date(),
          hidden,
          name,
          failed: finance.isError,
        });
        setMessages((m) => [...m, { id: nextId.current++, role: "bot", blocks }]);
        setTyping(false);
      }, 520);
      timers.current.push(id);
    },
    [resolved, hidden, name, finance.isError, setMessages, nextId],
  );

  // Send the question that opened the chat once the numbers are ready.
  const sent = useRef<string | null>(null);
  useEffect(() => {
    if (!pending) {
      sent.current = null;
      return;
    }
    if (!ready || sent.current === pending) return;
    sent.current = pending;
    clearPending();
    ask(pending);
  }, [pending, ready, ask, clearPending]);

  // Lock page scroll, close on Escape, focus the field on devices with a pointer.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (sheet) setSheet(null);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    if (window.matchMedia("(hover: hover)").matches) inputRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [sheet, onClose]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const started = messages.length > 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (text.trim()) {
      ask(text);
      setText("");
    } else {
      toast("A conversa por voz chega na próxima etapa.");
    }
  }

  function startNew() {
    if (messages.length) setConvos((c) => [{ title: titleOf(messages), messages }, ...c]);
    setMessages([]);
    setSheet(null);
  }

  function openConvo(index: number) {
    const target = convos[index];
    if (!target) return;
    setConvos((c) => {
      const rest = c.filter((_, i) => i !== index);
      return messages.length ? [{ title: titleOf(messages), messages }, ...rest] : rest;
    });
    setMessages(target.messages);
    setSheet(null);
  }

  return (
    <div className="k-chat" role="dialog" aria-modal="true" aria-label="Kallan Intelligence">
      <div className="k-px" aria-hidden="true" />
      <div className="k-chat-col">
        <header className="k-chat-head">
          <button type="button" className="k-icon-btn" onClick={onClose} aria-label="Fechar conversa">
            <X />
          </button>
          <button type="button" className="k-icon-btn" onClick={() => setSheet("history")} aria-label="Conversas anteriores">
            <Clock />
          </button>
        </header>

        <div className="k-chat-scroll" ref={scrollRef}>
          {!started && (
            <div className="k-chat-start">
              <span className="k-mark">
                <KallanGlyph />
              </span>
              <h2>{name ? `Olá, ${name}` : "Olá"}</h2>
              <p>Como posso te ajudar?</p>
            </div>
          )}
          <div className="k-msgs" aria-live="polite">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="k-msg user">
                  {m.text}
                </div>
              ) : (
                <div key={m.id} className="k-msg bot">
                  <span className="k-bav">
                    <Sparkles />
                  </span>
                  <div className="k-bbody">
                    <Blocks blocks={m.blocks ?? []} onAsk={ask} onNavigate={onClose} />
                  </div>
                </div>
              ),
            )}
            {typing && (
              <div className="k-msg bot">
                <span className="k-bav">
                  <Sparkles />
                </span>
                <div className="k-bbody">
                  <span className="k-typing" aria-label="A Kallan está respondendo">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="k-chat-foot">
          {!started && (
            <div className="k-pills">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="k-pill" onClick={() => ask(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <form className="k-composer" onSubmit={submit} autoComplete="off">
            <button type="button" className="k-cbtn" onClick={() => setSheet("menu")} aria-label="Mais ações">
              <Plus />
            </button>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Envie uma mensagem"
              aria-label="Mensagem para a Kallan"
              maxLength={200}
            />
            <button type="submit" className="k-send" aria-label={text.trim() ? "Enviar mensagem" : "Falar por voz"}>
              {text.trim() ? <ArrowUp /> : <Mic />}
            </button>
          </form>
          <p className="k-chat-note">As respostas usam só os números do seu app. A IA conversacional chega na próxima etapa.</p>
        </div>
      </div>

      {sheet && (
        <div
          className="k-sheet-wrap"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSheet(null);
          }}
        >
          <div className="k-sheet" role="dialog" aria-modal="true" aria-label={sheet === "menu" ? "Atalhos" : "Conversas"}>
            <div className="k-grab" />
            <div className="k-sheet-head">
              <div>
                <small>{sheet === "menu" ? "Atalhos" : "Histórico"}</small>
                <h2>{sheet === "menu" ? "O que você quer fazer?" : "Conversas"}</h2>
              </div>
              <button type="button" className="k-icon-btn" onClick={() => setSheet(null)} aria-label="Fechar">
                <X />
              </button>
            </div>

            {sheet === "menu" ? (
              <div className="k-menu-list">
                <Link to="/movimentacoes" className="k-row" onClick={onClose}>
                  <span className="k-tile"><Receipt /></span>
                  <span className="grow"><b>Ver movimentações</b><small>Entradas e saídas do mês</small></span>
                  <ChevronRight />
                </Link>
                <Link to="/open-finance" className="k-row" onClick={onClose}>
                  <span className="k-tile"><Landmark /></span>
                  <span className="grow"><b>Conectar instituição</b><small>Traga outro banco para o app</small></span>
                  <ChevronRight />
                </Link>
                <Link to="/negocios" className="k-row" onClick={onClose}>
                  <span className="k-tile"><Briefcase /></span>
                  <span className="grow"><b>Negócios</b><small>Finanças da sua empresa</small></span>
                  <ChevronRight />
                </Link>
                <Link to="/comunidade" className="k-row" onClick={onClose}>
                  <span className="k-tile"><Users /></span>
                  <span className="grow"><b>Comunidade</b><small>Troque ideias com outros empreendedores</small></span>
                  <ChevronRight />
                </Link>
                <Link to="/configuracoes" className="k-row" onClick={onClose}>
                  <span className="k-tile"><Settings /></span>
                  <span className="grow"><b>Configurações</b><small>Preferências e privacidade</small></span>
                  <ChevronRight />
                </Link>
                <button type="button" className="k-row" onClick={startNew}>
                  <span className="k-tile"><Sparkles /></span>
                  <span className="grow"><b>Nova conversa</b><small>Começar do zero</small></span>
                  <ChevronRight />
                </button>
              </div>
            ) : convos.length || messages.length ? (
              <div className="k-menu-list">
                {messages.length > 0 && (
                  <button type="button" className="k-row" onClick={() => setSheet(null)}>
                    <span className="k-tile"><Sparkles /></span>
                    <span className="grow"><b>{titleOf(messages)}</b><small>Conversa atual</small></span>
                    <ChevronRight />
                  </button>
                )}
                {convos.map((c, i) => (
                  <button key={`${c.title}-${i}`} type="button" className="k-row" onClick={() => openConvo(i)}>
                    <span className="k-tile"><Sparkles /></span>
                    <span className="grow"><b>{c.title}</b><small>Hoje</small></span>
                    <ChevronRight />
                  </button>
                ))}
              </div>
            ) : (
              <div className="k-hist-empty">
                <b>Nenhuma conversa ainda.</b>
                Suas conversas com a Kallan aparecem aqui.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
