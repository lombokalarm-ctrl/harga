<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\EntityResource;
use App\Services\AuditLogService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

abstract class CrudController extends Controller
{
    use ApiResponse;

    protected string $modelClass;

    protected string $module;

    protected array $searchable = [];

    protected array $filters = [];

    public function __construct(protected readonly AuditLogService $auditLogService)
    {
    }

    protected function indexRecords(Request $request)
    {
        $query = ($this->modelClass)::query();

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search) {
                foreach ($this->searchable as $index => $column) {
                    if ($index === 0) {
                        $builder->where($column, 'like', '%'.$search.'%');
                    } else {
                        $builder->orWhere($column, 'like', '%'.$search.'%');
                    }
                }
            });
        }

        foreach ($this->filters as $column) {
            if ($request->filled($column)) {
                $query->where($column, $request->input($column));
            }
        }

        $paginator = $query->latest()->paginate((int) $request->integer('per_page', 10));

        return $this->success('Data berhasil diambil', EntityResource::collection($paginator->items()), [
            'page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]);
    }

    protected function storeRecord(array $validated)
    {
        $model = ($this->modelClass)::query()->create($validated);
        $this->auditLogService->log($this->module, 'create', $model, 'Data berhasil dibuat');

        return $this->success('Data berhasil dibuat', new EntityResource($model));
    }

    protected function showRecord(Model $model)
    {
        return $this->success('Detail berhasil diambil', new EntityResource($model));
    }

    protected function updateRecord(Model $model, array $validated)
    {
        $model->update($validated);
        $this->auditLogService->log($this->module, 'update', $model, 'Data berhasil diperbarui');

        return $this->success('Data berhasil diperbarui', new EntityResource($model->fresh()));
    }

    protected function destroyRecord(Model $model)
    {
        $model->delete();
        $this->auditLogService->log($this->module, 'delete', $model, 'Data berhasil dihapus');

        return $this->success('Data berhasil dihapus');
    }
}
