
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";

interface Category {
    _id: string;
    name: string;
    description?: string;
}

interface CategoryForm {
    name: string;
    description: string;
}

const emptyForm: CategoryForm = {
    name: "",
    description: "",
};

function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CategoryForm>(emptyForm);

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/categories");
            setCategories(response.data.categories || []);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                    "Unable to retrieve categories."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        if (!success && !error) return;

        const timer = window.setTimeout(() => {
            setSuccess("");
            setError("");
        }, 4000);

        return () => window.clearTimeout(timer);
    }, [success, error]);

    const openAddForm = () => {
        setEditingId(null);
        setForm(emptyForm);
        setError("");
        setSuccess("");
        setShowForm(true);
    };

    const openEditForm = (category: Category) => {
        setEditingId(category._id);
        setForm({
            name: category.name,
            description: category.description || "",
        });
        setError("");
        setSuccess("");
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
    };

    const handleFormChange = (
        field: keyof CategoryForm,
        value: string
    ) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!form.name.trim()) {
            setError("Please enter a category name.");
            return;
        }

        try {
            setSaving(true);

            const categoryData = {
                name: form.name.trim(),
                description: form.description.trim(),
            };

            if (editingId) {
                await api.put(`/categories/${editingId}`, categoryData);
                setSuccess("Category updated successfully.");
            } else {
                await api.post("/categories", categoryData);
                setSuccess("Category created successfully.");
            }

            closeForm();
            await fetchCategories();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                    "Unable to save the category."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (category: Category) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${category.name}"?`
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        try {
            await api.delete(`/categories/${category._id}`);
            setSuccess("Category deleted successfully.");
            await fetchCategories();
        } catch (err: any) {
            if (err.response?.status === 409) {
                setError(
                    "This category cannot be deleted because it is being used by one or more expenses. Reassign or remove those expenses first."
                );
            } else {
                setError(
                    err.response?.data?.message ||
                        "Unable to delete the category."
                );
            }
        }
    };

    const filteredCategories = useMemo(() => {
        const query = search.toLowerCase().trim();

        return categories.filter((category) =>
            `${category.name} ${category.description || ""}`
                .toLowerCase()
                .includes(query)
        );
    }, [categories, search]);

    const glassCard =
        "rounded-3xl border border-white/10 bg-white/[0.055] shadow-[0_8px_32px_rgba(0,0,0,0.20)] backdrop-blur-2xl";

    const inputClass =
        "w-full rounded-xl border border-white/10 bg-[#0b1020]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/10";

    return (
        <div className="space-y-8">
            {/* Page heading */}
            <section className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-violet-300">
                        WORKSPACE
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                        Categories
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Organize your expenses into meaningful categories.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddForm}
                    className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3.5 text-sm font-semibold shadow-lg shadow-violet-950/30 transition hover:-translate-y-0.5 hover:brightness-110"
                >
                    + Add Category
                </button>
            </section>

            {/* Notifications */}
            {error && (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-300 backdrop-blur-xl">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300 backdrop-blur-xl">
                    {success}
                </div>
            )}

            {/* Summary */}
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-3xl border border-violet-300/20 bg-gradient-to-br from-violet-500/20 via-violet-500/10 to-white/[0.04] p-6 shadow-xl shadow-violet-950/20 backdrop-blur-2xl">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-violet-200">
                            Total Categories
                        </p>
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/15 text-xl text-violet-200">
                            ◈
                        </span>
                    </div>
                    <h2 className="mt-4 text-3xl font-bold">
                        {categories.length}
                    </h2>
                    <p className="mt-3 text-xs text-slate-400">
                        Categories in your account
                    </p>
                </div>

                <div className={`${glassCard} p-6`}>
                    <p className="text-sm text-blue-200">
                        Matching Results
                    </p>
                    <h2 className="mt-4 text-3xl font-bold">
                        {filteredCategories.length}
                    </h2>
                    <p className="mt-3 text-xs text-slate-400">
                        Categories matching your search
                    </p>
                </div>

                <div className={`${glassCard} p-6 sm:col-span-2 xl:col-span-1`}>
                    <p className="text-sm text-emerald-200">
                        Organization
                    </p>
                    <h2 className="mt-4 text-2xl font-bold">
                        Personal Categories
                    </h2>
                    <p className="mt-3 text-xs text-slate-400">
                        Manage the labels used to organize your spending
                    </p>
                </div>
            </section>

            {/* Search */}
            <section className={`${glassCard} p-5 sm:p-6`}>
                <label
                    htmlFor="category-search"
                    className="mb-3 block text-sm font-medium text-slate-300"
                >
                    Search categories
                </label>

                <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        ⌕
                    </span>
                    <input
                        id="category-search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by category name or description..."
                        className={`${inputClass} pl-11`}
                    />
                </div>
            </section>

            {/* Category list */}
            <section className={`${glassCard} overflow-hidden`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-5">
                    <div>
                        <h3 className="font-semibold">Your Categories</h3>
                        <p className="mt-1 text-xs text-slate-400">
                            View and manage your personal expense categories.
                        </p>
                    </div>

                    <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-300">
                        {filteredCategories.length} records
                    </span>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-sm text-slate-400">
                        Loading categories...
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl text-violet-300">
                            ◈
                        </div>
                        <p className="mt-4 text-lg font-semibold">
                            No categories found
                        </p>
                        <p className="mt-2 text-sm text-slate-400">
                            {search
                                ? "Try another search term."
                                : "Create your first category to get started."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-center">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredCategories.map((category) => (
                                    <tr
                                        key={category._id}
                                        className="border-t border-white/5 transition hover:bg-white/[0.035]"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-500/10 text-lg text-violet-300">
                                                    ◈
                                                </div>
                                                <span className="font-medium text-slate-100">
                                                    {category.name}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="max-w-md px-6 py-5 text-slate-400">
                                            {category.description ||
                                                "No description"}
                                        </td>

                                        <td className="px-6 py-5">
                                            <div className="flex justify-center gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEditForm(category)
                                                    }
                                                    className="text-xs font-medium text-violet-300 transition hover:text-violet-200"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(category)
                                                    }
                                                    className="text-xs font-medium text-rose-400 transition hover:text-rose-300"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Add/Edit modal */}
            {showForm && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md">
                    <div className="my-auto w-full max-w-lg rounded-3xl border border-white/10 bg-[#151b30] p-6 shadow-2xl shadow-black/50 sm:p-8">
                        <div className="mb-7 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-widest text-violet-300">
                                    Category management
                                </p>
                                <h3 className="mt-2 text-xl font-bold">
                                    {editingId
                                        ? "Edit Category"
                                        : "Add New Category"}
                                </h3>
                                <p className="mt-1 text-xs text-slate-400">
                                    Enter your category details below.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                className="rounded-xl border border-white/10 px-3 py-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                aria-label="Close form"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label
                                    htmlFor="category-name"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Category name
                                </label>
                                <input
                                    id="category-name"
                                    required
                                    maxLength={50}
                                    value={form.name}
                                    onChange={(event) =>
                                        handleFormChange(
                                            "name",
                                            event.target.value
                                        )
                                    }
                                    placeholder="e.g. Transport"
                                    className={inputClass}
                                />
                                <p className="mt-1.5 text-right text-xs text-slate-500">
                                    {form.name.length}/50
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="category-description"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Description
                                </label>
                                <textarea
                                    id="category-description"
                                    rows={4}
                                    maxLength={200}
                                    value={form.description}
                                    onChange={(event) =>
                                        handleFormChange(
                                            "description",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Describe this category..."
                                    className={`${inputClass} resize-none`}
                                />
                                <p className="mt-1.5 text-right text-xs text-slate-500">
                                    {form.description.length}/200
                                </p>
                            </div>

                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={saving}
                                    className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 text-sm font-semibold shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                          ? "Update Category"
                                          : "Save Category"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CategoriesPage;
