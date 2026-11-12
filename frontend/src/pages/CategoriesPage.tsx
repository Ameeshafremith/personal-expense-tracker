
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAppDispatch } from "../app/hooks";
import { logout } from "../features/auth/authSlice";

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
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

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
                await api.put(
                    `/categories/${editingId}`,
                    categoryData
                );
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

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login", { replace: true });
    };

    const filteredCategories = categories.filter((category) =>
        `${category.name} ${category.description || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-[#0b1020] text-white">

            {/* Sidebar */}
            <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#10172a] p-6 md:flex">
                <div className="mb-12">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Expense<span className="text-indigo-400">Flow</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500">
                        PERSONAL FINANCE TRACKER
                    </p>
                </div>

                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Workspace
                </p>

                <nav className="space-y-2">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                        <span className="text-lg">▦</span>
                        Dashboard
                    </button>

                    <button
                        onClick={() => navigate("/expenses")}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                        <span className="text-lg">↗</span>
                        Expenses
                    </button>

                    <div className="flex items-center gap-3 rounded-xl bg-indigo-500/15 px-4 py-3 text-sm font-medium text-indigo-300">
                        <span className="text-lg">◈</span>
                        Categories
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate("/reports")}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                        <span className="text-lg">▤</span>
                        Reports
                    </button>
                </nav>

                <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold">Organize spending</p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                        Group your expenses into meaningful categories.
                    </p>
                </div>
            </aside>

            {/* Main content */}
            <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">

                {/* Header */}
                <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-slate-400">Workspace</p>
                        <h2 className="mt-1 text-3xl font-bold tracking-tight">
                            Categories
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Organize and manage your expense categories.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5"
                        >
                            Dashboard
                        </button>

                        <button
                            onClick={handleLogout}
                            className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Notifications */}
                {error && (
                    <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
                        {success}
                    </div>
                )}

                {/* Summary */}
                <section className="mb-7 flex flex-wrap items-center justify-between gap-5">
                    <div className="min-w-[220px] flex-1 rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/20 to-[#151c36] p-6">
                        <p className="text-sm text-indigo-200">
                            Total Categories
                        </p>
                        <h3 className="mt-3 text-3xl font-bold">
                            {categories.length}
                        </h3>
                        <p className="mt-2 text-xs text-slate-400">
                            Categories in your account
                        </p>
                    </div>

                    <button
                        onClick={openAddForm}
                        className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 text-sm font-semibold shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:brightness-110"
                    >
                        + Add Category
                    </button>
                </section>

                {/* Search */}
                <section className="mb-7 rounded-2xl border border-white/10 bg-[#111a30] p-5">
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                        Search categories
                    </label>

                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by category name or description..."
                        className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-indigo-400"
                    />
                </section>

                {/* Category list */}
                <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111a30]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-5">
                        <div>
                            <h3 className="font-semibold">Your Categories</h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Manage your personal expense categories.
                            </p>
                        </div>

                        <span className="rounded-full bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300">
                            {filteredCategories.length} records
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-sm text-slate-400">
                            Loading categories...
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-lg font-semibold">
                                No categories found
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                                Add a category or try another search.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/[0.02] text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Description</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredCategories.map((category) => (
                                        <tr
                                            key={category._id}
                                            className="border-t border-white/5 transition hover:bg-white/[0.025]"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-lg text-indigo-300">
                                                        ◈
                                                    </div>
                                                    <span className="font-medium">
                                                        {category.name}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-5 text-slate-400">
                                                {category.description || "No description"}
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="flex justify-center gap-4">
                                                    <button
                                                        onClick={() => openEditForm(category)}
                                                        className="text-xs font-medium text-indigo-300 transition hover:text-indigo-200"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(category)}
                                                        className="text-xs font-medium text-red-400 transition hover:text-red-300"
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
            </main>

            {/* Add/Edit modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
                    <div className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#151e34] p-6 shadow-2xl sm:p-8">
                        <div className="mb-7 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold">
                                    {editingId ? "Edit Category" : "Add New Category"}
                                </h3>
                                <p className="mt-1 text-xs text-slate-400">
                                    Enter your category details below.
                                </p>
                            </div>

                            <button
                                onClick={closeForm}
                                className="rounded-lg px-3 py-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                aria-label="Close form"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    Category name
                                </label>

                                <input
                                    required
                                    maxLength={100}
                                    value={form.name}
                                    onChange={(event) =>
                                        handleFormChange("name", event.target.value)
                                    }
                                    placeholder="e.g. Transport"
                                    className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-indigo-400"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    Description
                                </label>

                                <textarea
                                    rows={4}
                                    maxLength={300}
                                    value={form.description}
                                    onChange={(event) =>
                                        handleFormChange("description", event.target.value)
                                    }
                                    placeholder="Describe this category..."
                                    className="w-full resize-none rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-indigo-400"
                                />
                            </div>

                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-sm font-semibold transition hover:brightness-110 disabled:opacity-50"
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
