export type BreadcrumbLevel = { title: string; href: string };

/**
 * Bangun breadcrumb array: base + level tambahan (mis. kegiatan, sesi).
 * Level tambahan yang falsy (null/undefined/false) otomatis di-skip,
 * jadi aman dipanggil sebelum kegiatan/sesi terpilih.
 */
export function kegiatanBreadcrumbs(
    baseTitle: string,
    baseHref: string,
    ...extra: (BreadcrumbLevel | null | undefined | false)[]
): BreadcrumbLevel[] {
    return [
        { title: baseTitle, href: baseHref },
        ...extra.filter((e): e is BreadcrumbLevel => Boolean(e)),
    ];
}
