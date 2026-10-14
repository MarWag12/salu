<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait Auditable
{
    /**
     * Boot the trait.
     */
    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            $model->logAudit(AuditLog::ACTION_CREATE, null, $model->getAuditableAttributes());
        });

        static::updated(function ($model) {
            $original = $model->getOriginal();
            $changes = $model->getChanges();

            // Remove timestamps from audit
            unset($changes['updated_at'], $changes['created_at']);
            unset($original['updated_at'], $original['created_at']);

            if (!empty($changes)) {
                $oldValues = array_intersect_key($original, $changes);
                $model->logAudit(AuditLog::ACTION_UPDATE, $oldValues, $changes);
            }
        });

        static::deleted(function ($model) {
            $model->logAudit(AuditLog::ACTION_DELETE, $model->getAuditableAttributes(), null);
        });
    }

    /**
     * Log an audit entry.
     */
    public function logAudit(string $action, ?array $oldValues = null, ?array $newValues = null, ?array $metadata = null): AuditLog
    {
        return AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'auditable_type' => get_class($this),
            'auditable_id' => $this->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log a status change specifically.
     */
    public function logStatusChange(string $fromStatus, string $toStatus, ?string $reason = null): AuditLog
    {
        return $this->logAudit(
            AuditLog::ACTION_STATUS_CHANGE,
            ['status' => $fromStatus],
            ['status' => $toStatus],
            ['reason' => $reason]
        );
    }

    /**
     * Get attributes that should be audited.
     */
    protected function getAuditableAttributes(): array
    {
        $attributes = $this->getAttributes();

        // Remove sensitive/unnecessary fields
        $excluded = ['password', 'remember_token', 'updated_at', 'created_at'];

        return array_diff_key($attributes, array_flip($excluded));
    }

    /**
     * Get the audit logs for this model.
     */
    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }
}
