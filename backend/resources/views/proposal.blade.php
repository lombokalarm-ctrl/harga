<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Proposal Paket</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #0f172a; font-size: 12px; }
        .cover { padding: 32px; background: #0f2747; color: #fff; border-radius: 16px; }
        .accent { color: #d4af37; }
        h1, h2 { margin: 0 0 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { padding: 8px; border: 1px solid #cbd5e1; text-align: left; }
        .section { margin-top: 20px; }
    </style>
</head>
<body>
    <div class="cover">
        <h1>{{ $package->nama_paket }}</h1>
        <p>Proposal Paket Umrah Premium</p>
        <p class="accent">Durasi {{ $package->durasi_hari }} hari | Target {{ $package->target_jamaah }} jamaah</p>
    </div>

    <div class="section">
        <h2>Komponen Paket</h2>
        <table>
            <tr><th>Hotel Makkah</th><td>{{ $package->hotelMakkah->nama_hotel }}</td></tr>
            <tr><th>Hotel Madinah</th><td>{{ $package->hotelMadinah->nama_hotel }}</td></tr>
            <tr><th>Maskapai</th><td>{{ $package->airline->nama_maskapai }}</td></tr>
            <tr><th>Visa</th><td>{{ $package->visa->nama_visa }}</td></tr>
            <tr><th>Fasilitas</th><td>{{ $package->transports->pluck('nama_layanan')->join(', ') }}</td></tr>
        </table>
    </div>

    <div class="section">
        <h2>Itinerary</h2>
        <table>
            <thead><tr><th>Hari</th><th>Judul</th><th>Deskripsi</th></tr></thead>
            <tbody>
            @foreach($package->itineraryDays as $day)
                <tr>
                    <td>{{ $day->hari_ke }}</td>
                    <td>{{ $day->judul }}</td>
                    <td>{{ $day->deskripsi }}</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Harga dan Costing</h2>
        <table>
            @foreach($costing as $label => $value)
                @if(!is_array($value))
                    <tr><th>{{ str_replace('_', ' ', $label) }}</th><td>{{ $value }}</td></tr>
                @endif
            @endforeach
        </table>
    </div>

    <div class="section">
        <h2>Syarat dan Ketentuan</h2>
        <p>Harga dapat berubah mengikuti kurs aktif, kebijakan vendor, dan kondisi operasional. Paket belum termasuk item di luar fasilitas yang tercantum.</p>
    </div>
</body>
</html>
