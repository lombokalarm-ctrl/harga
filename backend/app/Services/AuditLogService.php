<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AuditLogService
{
    public function log(string $module, string $action, ?Model $model = null, ?string $description = null, array $metadata = []): void
    {
        AuditLog::query()->create([
            'user_id' => Auth::id(),
            'module' => $module,
            'action' => $action,
            'auditable_type' => $model ? $model::class : null,
            'auditable_id' => $model?->getKey(),
            'description' => $description,
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }
}
