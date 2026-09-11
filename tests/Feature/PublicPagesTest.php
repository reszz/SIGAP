<?php

use Inertia\Testing\AssertableInertia as Assert;

beforeEach(fn () => $this->withoutVite());

// ─── 1. Akses Halaman Beranda Publik (Tanpa Auth) ──────────────────────────────

test('halaman beranda dapat diakses publik dan memuat props dinamis', function () {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->has('artikelTerbaru')
            ->has('pengurusInti')
            ->has('wishesTerbaru')
        );
});

// ─── 2. Akses Halaman Statis Publik (Tanpa Auth) ──────────────────────────────

test('halaman visi & misi dapat diakses tanpa login', function () {
    $this->get('/profil/visi-misi')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('profil/visi-misi'));
});

test('halaman sejarah dapat diakses tanpa login', function () {
    $this->get('/profil/sejarah')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('profil/sejarah'));
});

test('halaman privacy policy dapat diakses tanpa login', function () {
    $this->get('/privacy-policy')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('privacy-policy'));
});

// ─── 2. Akses Halaman Placeholder Fitur Lanjutan (Tanpa Auth) ─────────────────

test('halaman struktur kepengurusan dapat diakses publik tanpa login', function () {
    $this->get('/keorganisasian/struktur')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('keorganisasian/struktur'));
});

test('halaman divisi & bidang dapat diakses publik tanpa login', function () {
    $this->get('/keorganisasian/divisi')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('keorganisasian/divisi'));
});

test('halaman blog dapat diakses publik tanpa login', function () {
    $this->get('/blog')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('blog/index'));
});

test('halaman wish wall dapat diakses publik tanpa login', function () {
    $this->get('/wish-wall')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('wish-wall/index'));
});
