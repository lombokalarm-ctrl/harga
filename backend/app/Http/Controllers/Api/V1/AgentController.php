<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\AgentRequest;
use App\Models\Agent;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class AgentController extends CrudController
{
    protected string $modelClass = Agent::class;

    protected string $module = 'agents';

    protected array $searchable = ['nama_agen'];

    protected array $filters = ['status'];

    public function __construct(AuditLogService $auditLogService)
    {
        parent::__construct($auditLogService);
    }

    public function index(Request $request)
    {
        return $this->indexRecords($request);
    }

    public function store(AgentRequest $request)
    {
        return $this->storeRecord($request->validated());
    }

    public function show(Agent $agent)
    {
        return $this->showRecord($agent);
    }

    public function update(AgentRequest $request, Agent $agent)
    {
        return $this->updateRecord($agent, $request->validated());
    }

    public function destroy(Agent $agent)
    {
        return $this->destroyRecord($agent);
    }
}
