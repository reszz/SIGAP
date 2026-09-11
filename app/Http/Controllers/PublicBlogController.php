<?php

namespace App\Http\Controllers;

use App\Models\Artikel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicBlogController extends Controller
{
    /**
     * Tampilkan daftar artikel terbit untuk publik.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');

        $articlesQuery = Artikel::terbit()
            ->with(['penulis:id,name'])
            ->when($search, function ($q) use ($search) {
                $q->where(function ($query) use ($search) {
                    $query->where('judul', 'like', "%{$search}%")
                        ->orWhere('ringkasan', 'like', "%{$search}%")
                        ->orWhere('konten', 'like', "%{$search}%");
                });
            });

        $articles = $articlesQuery->paginate(9)->withQueryString();

        // Artikel Unggulan / Terbaru (Item pertama jika halaman 1 dan tanpa search)
        $featured = null;
        if (! $search && $request->query('page', 1) == 1 && $articles->isNotEmpty()) {
            $featured = $articles->first();
        }

        return Inertia::render('blog/index', [
            'articles' => $articles,
            'featured' => $featured,
            'filters' => [
                'search' => $search ?? '',
            ],
        ]);
    }

    /**
     * Tampilkan detail artikel terbit berdasarkan slug.
     */
    public function show(Request $request, string $slug): Response
    {
        $artikel = Artikel::where('slug', $slug)
            ->with(['penulis:id,name'])
            ->first();

        // Jika tidak ditemukan ATAU status artikel masih draft, tampilkan 404 (jangan bocorkan draft)
        if (! $artikel || $artikel->status !== 'terbit' || ($artikel->diterbitkan_pada && $artikel->diterbitkan_pada->isFuture())) {
            abort(404, 'Artikel tidak ditemukan atau belum dipublikasikan.');
        }

        // Artikel terkait / terbaru lainnya
        $recentArticles = Artikel::terbit()
            ->where('id', '!=', $artikel->id)
            ->with(['penulis:id,name'])
            ->take(3)
            ->get();

        return Inertia::render('blog/show', [
            'artikel' => $artikel,
            'recentArticles' => $recentArticles,
        ]);
    }
}
