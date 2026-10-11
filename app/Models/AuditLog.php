<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $fillable = ['user_id', 'action', 'description', 'ip'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Regista uma acção no log de auditoria. */
    public static function record(string $action, ?string $description = null, ?int $userId = null): void
    {
        static::create([
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'description' => $description,
            'ip' => request()->ip(),
        ]);
    }
}
