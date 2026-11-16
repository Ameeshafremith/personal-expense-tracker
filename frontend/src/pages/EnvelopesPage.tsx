import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Plus, Pencil, Trash2, X, RefreshCw, Wallet, Utensils, AlertCircle } from "lucide-react";
import api from "../services/api";

interface Category {
  _id: string;
  name: string;
}
interface Envelope {
  _id: string;
  name: string;
  description?: string;
  allocatedAmount: number;
  spentAmount: number;
  remaining: number;
  exceeded: boolean;
  progressPercentage: number;
  month: number;
  year: number;
  categoryId: Category | string;
}
interface EnvelopeForm {
  name: string;
  description: string;
  allocatedAmount: string;
  categoryId: string;
}
const emptyForm: EnvelopeForm = {
  name: "",
  description: "",
  allocatedAmount: "",
  categoryId: "",
};
const money = (value: number) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
const categoryIdOf = (value: Category | string) =>
  typeof value === "string" ? value : value?._id || "";
const categoryNameOf = (value: Category | string) =>
  typeof value === "string" ? "Category" : value?.name || "Category";

export default function EnvelopesPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Envelope | null>(null);
  const [form, setForm] = useState<EnvelopeForm>(emptyForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [envelopeResponse, categoryResponse] = await Promise.all([
        api.get("/envelopes", { params: { month, year } }),
        api.get("/categories"),
      ]);
      setEnvelopes(envelopeResponse.data.data || []);
      setCategories(categoryResponse.data.categories || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load your envelopes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  // Automatically clear success and error notifications after 4 seconds.
  useEffect(() => {
    if (!success && !error) return;

    const notificationTimer = window.setTimeout(() => {
      setSuccess("");
      setError("");
    }, 4000);

    return () => window.clearTimeout(notificationTimer);
  }, [success, error]);

  const totals = useMemo(
    () =>
      envelopes.reduce(
        (acc, item) => ({
          allocated: acc.allocated + Number(item.allocatedAmount || 0),
          spent: acc.spent + Number(item.spentAmount || 0),
          remaining: acc.remaining + Number(item.remaining ?? (item.allocatedAmount - item.spentAmount)),
        }),
        { allocated: 0, spent: 0, remaining: 0 }
      ),
    [envelopes]
  );

  const usedCategoryIds = useMemo(
    () => new Set(envelopes.map((item) => categoryIdOf(item.categoryId))),
    [envelopes]
  );
  const availableCategories = categories.filter(
    (category) =>
      !usedCategoryIds.has(category._id) ||
      category._id === (editing ? categoryIdOf(editing.categoryId) : "")
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setModalOpen(true);
  };
  const openEdit = (item: Envelope) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description || "",
      allocatedAmount: String(item.allocatedAmount),
      categoryId: categoryIdOf(item.categoryId),
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  };
  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(form.allocatedAmount);
    if (!form.name.trim() || !form.categoryId || !Number.isFinite(amount) || amount <= 0) {
      setError("Enter an envelope name, choose a category, and enter an amount greater than zero.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        allocatedAmount: amount,
        categoryId: form.categoryId,
        month,
        year,
      };
      if (editing) {
        await api.put(`/envelopes/${editing._id}`, payload);
        setSuccess("Envelope updated successfully.");
      } else {
        await api.post("/envelopes", payload);
        setSuccess("Envelope created successfully.");
      }
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to save this envelope.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Envelope) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      setError("");
      setSuccess("");
      await api.delete(`/envelopes/${item._id}`);
      setSuccess("Envelope deleted successfully.");
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to delete this envelope.");
    }
  };

  const changeMonth = (direction: number) => {
    const date = new Date(year, month - 1 + direction, 1);
    setMonth(date.getMonth() + 1);
    setYear(date.getFullYear());
  };
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const glass =
    "rounded-3xl border border-white/10 bg-white/[0.055] shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-2xl";

  return (
    <div className="space-y-8 text-white">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wider text-violet-300">SPENDING PLAN</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Money Envelopes</h1>
          <p className="mt-2 text-sm text-slate-400">
            Allocate money to categories and keep track of your monthly spending.
          </p>
        </div>
        <button
          onClick={openAdd}
          disabled={categories.length === 0 || availableCategories.length === 0}
          className="flex items-center gap-2 rounded-2xl border border-violet-300/20 bg-violet-500/20 px-5 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={18} /> Add Envelope
        </button>
      </section>

      {(error || success) && !modalOpen && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${error ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}>
          {error || success}
        </div>
      )}

      <section className={`${glass} flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Selected period</p>
          <h2 className="mt-1 text-xl font-semibold">{monthLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/10">Previous</button>
          <button onClick={() => { setMonth(today.getMonth() + 1); setYear(today.getFullYear()); }} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/10">This month</button>
          <button onClick={() => changeMonth(1)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/10">Next</button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total allocated", value: totals.allocated, icon: Wallet, color: "text-violet-300" },
          { label: "Total spent", value: totals.spent, icon: Utensils, color: "text-rose-300" },
          { label: "Remaining", value: totals.remaining, icon: RefreshCw, color: "text-emerald-300" },
        ].map((item) => (
          <div key={item.label} className={`${glass} p-6`}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{item.label}</p>
              <item.icon className={item.color} size={19} />
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight">{money(item.value)}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Your envelopes</h2>
            <p className="mt-1 text-sm text-slate-500">{envelopes.length} envelope{envelopes.length === 1 ? "" : "s"} for {monthLabel}</p>
          </div>
          <button onClick={fetchData} className="rounded-xl border border-white/10 p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white" title="Refresh">
            <RefreshCw size={17} />
          </button>
        </div>

        {loading ? (
          <div className={`${glass} p-12 text-center text-slate-400`}>Loading envelopes...</div>
        ) : envelopes.length === 0 ? (
          <div className={`${glass} px-6 py-14 text-center`}>
            <Wallet className="mx-auto text-violet-300" size={34} />
            <h3 className="mt-4 text-lg font-semibold">No envelopes for this month</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">Create an envelope to set aside an amount for a spending category.</p>
            {categories.length > 0 && (
              <button onClick={openAdd} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-500/20 px-4 py-2.5 text-sm font-semibold text-violet-200 hover:bg-violet-500/30">
                <Plus size={16} /> Create your first envelope
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {envelopes.map((item) => {
              const percentage = Math.min(100, Math.max(0, Number(item.progressPercentage ?? (item.allocatedAmount ? item.spentAmount / item.allocatedAmount * 100 : 0))));
              const exceeded = Boolean(item.exceeded || item.spentAmount > item.allocatedAmount);
              return (
                <article key={item._id} className={`${glass} p-6`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-violet-300">{categoryNameOf(item.categoryId)}</p>
                      <h3 className="mt-2 truncate text-lg font-semibold">{item.name}</h3>
                      {item.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.description}</p>}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => openEdit(item)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" title="Edit"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(item)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-400/10 hover:text-rose-300" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="mt-6 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Spent</p>
                      <p className="mt-1 text-xl font-bold">{money(item.spentAmount)}</p>
                    </div>
                    <p className="text-right text-sm text-slate-400">of {money(item.allocatedAmount)}</p>
                  </div>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full transition-all ${exceeded ? "bg-rose-400" : percentage >= 80 ? "bg-amber-300" : "bg-violet-400"}`} style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={exceeded ? "text-rose-300" : "text-slate-400"}>{percentage.toFixed(0)}% used</span>
                    <span className={exceeded ? "font-semibold text-rose-300" : "text-emerald-300"}>{money(item.remaining ?? item.allocatedAmount - item.spentAmount)} left</span>
                  </div>
                  {exceeded && <p className="mt-4 flex items-center gap-2 rounded-xl bg-rose-400/10 px-3 py-2 text-xs text-rose-200"><AlertCircle size={15} /> This envelope is over its allocation.</p>}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-[#111a30] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{editing ? "Edit envelope" : "Create envelope"}</h2>
                <p className="mt-1 text-sm text-slate-400">{monthLabel}</p>
              </div>
              <button onClick={closeModal} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={19} /></button>
            </div>
            {error && <div className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{error}</div>}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Envelope name</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} placeholder="e.g. Food Envelope" className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Category</span>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required className="w-full rounded-xl border border-white/10 bg-[#182239] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50">
                  <option value="">Choose a category</option>
                  {availableCategories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Allocated amount (LKR)</span>
                <input type="number" min="0.01" step="0.01" value={form.allocatedAmount} onChange={(e) => setForm({ ...form, allocatedAmount: e.target.value })} required placeholder="10000" className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Description <span className="text-slate-500">(optional)</span></span>
                <textarea rows={3} maxLength={200} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this envelope for?" className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50" />
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} disabled={saving} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-violet-500/80 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50">{saving ? "Saving..." : editing ? "Save changes" : "Create envelope"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
