<?php

namespace App\Models;

use App\Enums\KycStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KycStatusHistory extends Model
{
    use HasFactory;

    protected $table = 'kyc_status_history';

    protected $fillable = [
        'kyc_verification_id',
        'from_status',
        'to_status',
        'reason',
        'changed_by',
    ];

    protected function casts(): array
    {
        return [
            'from_status' => KycStatus::class,
            'to_status' => KycStatus::class,
        ];
    }

    public function kycVerification(): BelongsTo
    {
        return $this->belongsTo(KycVerification::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
