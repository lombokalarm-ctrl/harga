<?php

namespace App\Contracts\Repositories;

use App\Models\UmrahPackage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface PackageRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;

    public function findOrFail(int $id): UmrahPackage;

    public function create(array $payload): UmrahPackage;

    public function update(UmrahPackage $package, array $payload): UmrahPackage;
}
