<?php

namespace App\Models\Concerns;

use App\Models\AuditLog;

/** Regista criação/actualização/eliminação no log de auditoria (usado nos modelos geridos no Filament). */
trait Audited
{
    public static function bootAudited(): void
    {
        $label = static::auditLabel();

        // Seeders/comandos não geram entradas de auditoria; só acções na aplicação.
        $record = function (string $suffix, $m, bool $onlyIfChanged = false) use ($label) {
            if (app()->runningInConsole() || ($onlyIfChanged && ! $m->wasChanged())) {
                return;
            }
            AuditLog::record("{$label}_{$suffix}", $m->auditName());
        };

        static::created(fn ($m) => $record('criado', $m));
        static::updated(fn ($m) => $record('actualizado', $m, true));
        static::deleted(fn ($m) => $record('eliminado', $m));
    }

    abstract protected static function auditLabel(): string;

    protected function auditName(): string
    {
        return (string) $this->name;
    }
}
