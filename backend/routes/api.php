<?php

use App\Http\Controllers\Api\V1\AgentController;
use App\Http\Controllers\Api\V1\AirlineController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CostComponentController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\ExchangeRateController;
use App\Http\Controllers\Api\V1\GuideController;
use App\Http\Controllers\Api\V1\HotelController;
use App\Http\Controllers\Api\V1\PackageController;
use App\Http\Controllers\Api\V1\PackageSnapshotController;
use App\Http\Controllers\Api\V1\TransportController;
use App\Http\Controllers\Api\V1\VisaController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::get('/hotels/import-template/{format}', [HotelController::class, 'downloadTemplate']);
        Route::post('/hotels/import-preview', [HotelController::class, 'previewImport']);
        Route::post('/hotels/import', [HotelController::class, 'import']);
        Route::get('/airlines/import-template/{format}', [AirlineController::class, 'downloadTemplate']);
        Route::post('/airlines/import-preview', [AirlineController::class, 'previewImport']);
        Route::post('/airlines/import', [AirlineController::class, 'import']);
        Route::get('/visas/import-template/{format}', [VisaController::class, 'downloadTemplate']);
        Route::post('/visas/import-preview', [VisaController::class, 'previewImport']);
        Route::post('/visas/import', [VisaController::class, 'import']);
        Route::get('/transports/import-template/{format}', [TransportController::class, 'downloadTemplate']);
        Route::post('/transports/import-preview', [TransportController::class, 'previewImport']);
        Route::post('/transports/import', [TransportController::class, 'import']);
        Route::get('/guides/import-template/{format}', [GuideController::class, 'downloadTemplate']);
        Route::post('/guides/import-preview', [GuideController::class, 'previewImport']);
        Route::post('/guides/import', [GuideController::class, 'import']);
        Route::get('/cost-components/import-template/{format}', [CostComponentController::class, 'downloadTemplate']);
        Route::post('/cost-components/import-preview', [CostComponentController::class, 'previewImport']);
        Route::post('/cost-components/import', [CostComponentController::class, 'import']);
        Route::apiResource('hotels', HotelController::class);
        Route::apiResource('airlines', AirlineController::class);
        Route::apiResource('visas', VisaController::class);
        Route::apiResource('transports', TransportController::class);
        Route::apiResource('guides', GuideController::class);
        Route::apiResource('cost-components', CostComponentController::class);
        Route::apiResource('agents', AgentController::class);

        Route::get('/exchange-rates/current', [ExchangeRateController::class, 'current']);
        Route::post('/exchange-rates/recalculate', [ExchangeRateController::class, 'recalculate']);
        Route::get('/exchange-rates', [ExchangeRateController::class, 'index']);
        Route::post('/exchange-rates', [ExchangeRateController::class, 'store']);

        Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
        Route::get('/audit-logs', [AuditLogController::class, 'index']);

        Route::post('/packages/{package}/duplicate', [PackageController::class, 'duplicate']);
        Route::post('/packages/{package}/publish', [PackageController::class, 'publish']);
        Route::get('/packages/{package}/costing', [PackageController::class, 'costing']);
        Route::post('/packages/{package}/simulations/margin', [PackageController::class, 'costing']);
        Route::post('/packages/{package}/simulations/occupancy', [PackageController::class, 'occupancy']);
        Route::post('/packages/{package}/simulations/bep', [PackageController::class, 'bep']);
        Route::post('/packages/{package}/proposal/pdf', [PackageController::class, 'proposalPdf']);
        Route::post('/packages/{package}/proposal/xlsx', [PackageController::class, 'proposalSpreadsheet']);
        Route::get('/packages/{package}/snapshots', [PackageSnapshotController::class, 'index']);
        Route::post('/packages/{package}/snapshots', [PackageSnapshotController::class, 'store']);
        Route::put('/packages/{package}/snapshots/{snapshot}', [PackageSnapshotController::class, 'update']);
        Route::delete('/packages/{package}/snapshots/{snapshot}', [PackageSnapshotController::class, 'destroy']);
        Route::apiResource('packages', PackageController::class);
    });
});
