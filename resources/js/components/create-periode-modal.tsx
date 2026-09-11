import { router, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CreatePeriodeModal({ children }: PropsWithChildren) {
    const page = usePage();
    const currentTeam = page.props.currentTeam;
    const [open, setOpen] = useState(false);
    const [nama, setNama] = useState('');
    const [tanggalMulai, setTanggalMulai] = useState('');
    const [tanggalSelesai, setTanggalSelesai] = useState('');
    const [isAktif, setIsAktif] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTeam) return;

        setProcessing(true);
        router.post(
            `/${currentTeam.slug}/periodes`,
            {
                nama,
                tanggal_mulai: tanggalMulai,
                tanggal_selesai: tanggalSelesai,
                is_aktif: isAktif,
            },
            {
                onError: (errs) => {
                    setErrors(errs);
                    setProcessing(false);
                },
                onSuccess: () => {
                    setOpen(false);
                    setNama('');
                    setTanggalMulai('');
                    setTanggalSelesai('');
                    setErrors({});
                    setProcessing(false);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>Buat Periode Baru</DialogTitle>
                        <DialogDescription>
                            Tambahkan periode kepengurusan baru untuk tim ini.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <Label htmlFor="periode-nama">Nama Periode</Label>
                        <Input
                            id="periode-nama"
                            value={nama}
                            onChange={(e) => setNama(e.target.value)}
                            placeholder="Contoh: 2026/2027"
                            required
                        />
                        <InputError message={errors.nama} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="tanggal-mulai">Tanggal Mulai</Label>
                            <Input
                                id="tanggal-mulai"
                                type="date"
                                value={tanggalMulai}
                                onChange={(e) => setTanggalMulai(e.target.value)}
                                required
                            />
                            <InputError message={errors.tanggal_mulai} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tanggal-selesai">Tanggal Selesai</Label>
                            <Input
                                id="tanggal-selesai"
                                type="date"
                                value={tanggalSelesai}
                                onChange={(e) => setTanggalSelesai(e.target.value)}
                                required
                            />
                            <InputError message={errors.tanggal_selesai} />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="is-aktif"
                            checked={isAktif}
                            onChange={(e) => setIsAktif(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="is-aktif" className="text-sm font-medium cursor-pointer">
                            Jadikan periode aktif utama
                        </Label>
                    </div>

                    <DialogFooter className="gap-2 pt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Batal</Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan Periode'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
