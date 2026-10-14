<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Relatório de Ganhos - {{ $provider->display_name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
        }
        .container {
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #667eea;
        }
        .header h1 {
            font-size: 24px;
            color: #667eea;
            margin-bottom: 5px;
        }
        .header .subtitle {
            font-size: 14px;
            color: #666;
        }
        .meta-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .meta-info .left {
            float: left;
        }
        .meta-info .right {
            float: right;
            text-align: right;
        }
        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
        .stats-grid {
            margin-bottom: 30px;
        }
        .stats-grid table {
            width: 100%;
            border-collapse: collapse;
        }
        .stats-grid td {
            width: 33.33%;
            text-align: center;
            padding: 15px;
            background: #667eea;
            color: white;
        }
        .stats-grid td:nth-child(2) {
            background: #764ba2;
        }
        .stats-grid td:nth-child(3) {
            background: #20c997;
        }
        .stats-grid .stat-value {
            font-size: 24px;
            font-weight: bold;
            display: block;
        }
        .stats-grid .stat-label {
            font-size: 11px;
            opacity: 0.9;
        }
        .orders-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .orders-table th,
        .orders-table td {
            padding: 10px 8px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        .orders-table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #495057;
            font-size: 11px;
            text-transform: uppercase;
        }
        .orders-table tbody tr:hover {
            background: #f8f9fa;
        }
        .orders-table .text-right {
            text-align: right;
        }
        .orders-table .total-row {
            font-weight: bold;
            background: #f8f9fa;
        }
        .orders-table .total-row td {
            border-top: 2px solid #667eea;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            font-size: 10px;
            color: #6c757d;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            font-size: 10px;
            border-radius: 4px;
            background: #28a745;
            color: white;
        }
        .no-data {
            text-align: center;
            padding: 40px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Relatório de Ganhos</h1>
            <div class="subtitle">{{ $provider->display_name }}</div>
        </div>

        <div class="meta-info clearfix">
            <div class="left">
                <strong>Período:</strong> {{ $periodLabel }}<br>
                <strong>Total de Pedidos:</strong> {{ $totalOrders }}
            </div>
            <div class="right">
                <strong>Gerado em:</strong> {{ $generatedAt }}<br>
                <strong>Por:</strong> Salu - Marketplace de Serviços
            </div>
        </div>

        <div class="stats-grid">
            <table>
                <tr>
                    <td>
                        <span class="stat-value">{{ number_format($totalEarnings, 0, ',', '.') }} Kz</span>
                        <span class="stat-label">Total de Ganhos</span>
                    </td>
                    <td>
                        <span class="stat-value">{{ $totalOrders }}</span>
                        <span class="stat-label">Serviços Concluídos</span>
                    </td>
                    <td>
                        <span class="stat-value">{{ $totalOrders > 0 ? number_format($totalEarnings / $totalOrders, 0, ',', '.') : 0 }} Kz</span>
                        <span class="stat-label">Média por Serviço</span>
                    </td>
                </tr>
            </table>
        </div>

        @if($orders->count() > 0)
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>Ref.</th>
                        <th>Serviço</th>
                        <th>Cliente</th>
                        <th>Data Conclusão</th>
                        <th class="text-right">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($orders as $order)
                        <tr>
                            <td>#{{ $order->reference }}</td>
                            <td>{{ $order->service->name ?? 'N/A' }}</td>
                            <td>{{ $order->client->name ?? 'N/A' }}</td>
                            <td>{{ $order->completed_at?->format('d/m/Y') ?? '-' }}</td>
                            <td class="text-right">{{ number_format($order->agreed_price, 0, ',', '.') }} Kz</td>
                        </tr>
                    @endforeach
                    <tr class="total-row">
                        <td colspan="4" class="text-right"><strong>TOTAL:</strong></td>
                        <td class="text-right">{{ number_format($totalEarnings, 0, ',', '.') }} Kz</td>
                    </tr>
                </tbody>
            </table>
        @else
            <div class="no-data">
                <p>Nenhum pedido concluído encontrado para o período selecionado.</p>
            </div>
        @endif

        <div class="footer">
            <p>Este relatório foi gerado automaticamente pelo sistema Salu.</p>
            <p>&copy; {{ date('Y') }} Salu - Marketplace de Serviços para Angola</p>
        </div>
    </div>
</body>
</html>
