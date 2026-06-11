<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Template Import Hotel</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #1e293b;
            font-size: 12px;
            line-height: 1.5;
        }
        h1, h2 {
            margin: 0 0 10px;
        }
        h1 {
            font-size: 22px;
            color: #0f172a;
        }
        h2 {
            margin-top: 22px;
            font-size: 16px;
            color: #0f172a;
        }
        p {
            margin: 0 0 8px;
        }
        .note {
            padding: 12px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            border: 1px solid #cbd5e1;
            padding: 8px;
            vertical-align: top;
            text-align: left;
        }
        th {
            background: #e2e8f0;
            font-weight: bold;
        }
        .small {
            font-size: 11px;
            color: #475569;
        }
    </style>
</head>
<body>
    <h1>Template Import Harga Hotel Musiman</h1>
    <p>Gunakan template CSV atau XLSX resmi untuk proses upload harga hotel setiap awal musim. PDF ini menjadi panduan baku agar format kolom dan pengisian tetap konsisten.</p>

    <div class="note">
        <p><strong>Aturan wajib:</strong></p>
        <p>1. Nama header harus mengikuti template resmi.</p>
        <p>2. Format tanggal wajib <strong>YYYY-MM-DD</strong>.</p>
        <p>3. Mata uang hanya boleh <strong>IDR</strong>, <strong>USD</strong>, atau <strong>SAR</strong>.</p>
        <p>4. Fare hotel diisi per kamar per malam sesuai basis <strong>double</strong>, <strong>triple</strong>, dan <strong>quad</strong>.</p>
    </div>

    <h2>Header Resmi</h2>
    <p class="small">{{ implode(', ', $headers) }}</p>

    <h2>Panduan Kolom</h2>
    <table>
        <thead>
            <tr>
                <th>Field</th>
                <th>Wajib</th>
                <th>Contoh</th>
                <th>Keterangan</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($fieldGuide as $guide)
                <tr>
                    <td>{{ $guide['field'] }}</td>
                    <td>{{ $guide['required'] }}</td>
                    <td>{{ $guide['example'] }}</td>
                    <td>{{ $guide['notes'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <h2>Contoh Data</h2>
    <table>
        <thead>
            <tr>
                @foreach ($headers as $header)
                    <th>{{ $header }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach ($sampleRows as $row)
                <tr>
                    @foreach ($headers as $header)
                        <td>{{ $row[$header] }}</td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
