import { ShieldCheck, Lock, Eye, FileText, HelpCircle, Mail } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';

export default function PrivacyPolicy() {
    return (
        <PublicLayout
            title="Kebijakan Privasi (Privacy Policy) — SIGAP"
            description="Informasi mengenai pengumpulan, penggunaan, dan perlindungan data anggota serta peserta kegiatan di platform SIGAP."
        >
            {/* ── Page Header ── */}
            <section className="border-b border-[rgba(30,36,48,0.08)] bg-white py-12 sm:py-16 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]/60">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-[#2E9E82]/30 bg-[#2E9E82]/10 px-2.5 py-1 text-xs font-medium text-[#2E9E82] dark:border-[#2E9E82]/40 dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                        <ShieldCheck className="size-3.5" />
                        <span>Perlindungan Data & Privasi</span>
                    </div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-[#1E2430] sm:text-4xl dark:text-[#E6ECF5]">
                        Kebijakan Privasi
                    </h1>
                    <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-[#727C8E] sm:text-sm dark:text-[#8C97A8]">
                        Komitmen kami dalam menjaga kerahasiaan dan keamanan data pribadi seluruh pengurus, anggota, dan peserta kegiatan.
                    </p>
                </div>
            </section>

            {/* ── Document Content ── */}
            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 sm:p-10 shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B] space-y-8 text-xs leading-relaxed text-[#2E3542] sm:text-sm sm:leading-relaxed dark:text-[#CBD5E1]">
                    {/* Section 1 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Eye className="size-4 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                            <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                1. Data yang Kami Kumpulkan
                            </h2>
                        </div>
                        <p>
                            Dalam rangka mendukung operasional kegiatan kemahasiswaan dan pencatatan presensi yang akurat, sistem SIGAP mengumpulkan data berupa:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            <li>Informasi identitas dasar: Nama lengkap, Nomor Induk Mahasiswa (NIM), dan alamat surel kampus.</li>
                            <li>Informasi partisipasi: Riwayat RSVP pendaftaran acara, catatan kehadiran sesi presensi, dan ulasan evaluasi kegiatan.</li>
                            <li>Informasi kepanitiaan: Penugasan divisi, jabatan struktural, dan status penyelesaian tugas kerja (khusus pengurus dan panitia).</li>
                        </ul>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <FileText className="size-4 text-[#2E9E82] dark:text-[#34B394]" />
                            <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                2. Tujuan Penggunaan Data
                            </h2>
                        </div>
                        <p>
                            Seluruh data yang terkumpul hanya digunakan untuk kepentingan internal keorganisasian dan akademik, meliputi:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            <li>Verifikasi kuota pendaftaran dan pencatatan presensi kehadiran peserta kegiatan secara real-time.</li>
                            <li>Penyusunan Laporan Pertanggungjawaban (LPJ) kegiatan serta rekapitulasi keaktifan anggota organisasi.</li>
                            <li>Pemberitahuan resmi mengenai jadwal, sesi rundown, dan pengumuman administratif terkait acara.</li>
                        </ul>
                    </div>

                    {/* Section 3 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Lock className="size-4 text-[#B8862E] dark:text-[#D4A142]" />
                            <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                3. Keamanan & Retensi Data
                            </h2>
                        </div>
                        <p>
                            Kami menerapkan kontrol akses berbasis peran (Role-Based Access Control) yang ketat. Data anggaran rinci, notulensi internal, dan dokumen kesekretariatan hanya dapat diakses oleh pengurus yang berwenang sesuai amanah jabatannya. Kami tidak pernah memperjualbelikan atau membagikan data pribadi kepada pihak ketiga di luar entitas kampus yang sah.
                        </p>
                    </div>

                    {/* Section 4 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <HelpCircle className="size-4 text-[#727C8E] dark:text-[#8C97A8]" />
                            <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                4. Kontak & Pertanyaan Privasi
                            </h2>
                        </div>
                        <p>
                            Apabila Anda memiliki pertanyaan, permohonan pembaruan data, atau tanggapan terkait kebijakan privasi ini, silakan hubungi tim kesekretariatan kami melalui surel di <span className="font-mono-sigap font-semibold text-[#4A5FD1] dark:text-[#8FA0FA]">sekretariat@sigap-org.id</span> atau kunjungi Ruang Sekretariat Organisasi di Gedung PKM Kampus.
                        </p>
                    </div>

                    <div className="border-t border-[rgba(30,36,48,0.06)] pt-4 text-[11px] text-[#727C8E] dark:border-[rgba(255,255,255,0.06)] dark:text-[#8C97A8]">
                        Terakhir diperbarui: <span className="font-mono-sigap font-medium">Agustus 2026</span>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
